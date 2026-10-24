import os
import json
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app, send_from_directory, send_file
from sqlalchemy import or_, desc, asc, func
from ..models import db, Photo, Tag, Album, photo_tags
from ..utils.auth_middleware import token_required, optional_token, log_activity
from ..utils.file_handler import allowed_file, save_and_process_image, delete_image_files
from ..utils.metrics_tracker import PHOTO_UPLOADS_TOTAL, PHOTO_DOWNLOADS_TOTAL
from ..utils.album_classifier import match_photo_to_album

photos_bp = Blueprint('photos', __name__, url_prefix='/api/photos')

@photos_bp.route('', methods=['GET'])
@optional_token
def list_photos(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 24, type=int), 100)
    search_query = request.args.get('search', '').strip()
    tag_name = request.args.get('tag', '').strip()
    album_id = request.args.get('album_id', type=int)
    user_id = request.args.get('user_id', type=int)
    favorites_only = request.args.get('favorite', '').lower() in ('true', '1')
    trash_only = request.args.get('trash', '').lower() in ('true', '1')
    sort_by = request.args.get('sort', 'newest')

    query = Photo.query

    if trash_only:
        if not current_user:
            return jsonify({'success': False, 'message': 'Vui lòng đăng nhập để xem thùng rác'}), 401
        if current_user.role == 'admin':
            query = query.filter(Photo.is_deleted == True)
        else:
            query = query.filter(Photo.is_deleted == True, Photo.user_id == current_user.id)
    else:
        query = query.filter(or_(Photo.is_deleted == False, Photo.is_deleted == None))
        # Privacy filter:
        if current_user and current_user.role == 'admin':
            # Admin can view all photos
            pass
        elif current_user:
            # User can view public photos + their own private photos
            query = query.filter(or_(Photo.is_public == True, Photo.user_id == current_user.id))
        else:
            # Guests can only see public photos
            query = query.filter(Photo.is_public == True)

    # Filter by user
    if user_id:
        query = query.filter(Photo.user_id == user_id)

    # Filter by album
    if album_id:
        query = query.filter(Photo.album_id == album_id)

    # Filter by favorite
    if favorites_only:
        query = query.filter(Photo.is_favorite == True)

    # Filter by tag or album
    if tag_name:
        clean_tag = tag_name.lstrip('#').strip()
        matched_ids = db.session.query(Photo.id).outerjoin(Photo.tags).outerjoin(Photo.album).filter(
            or_(
                Tag.name.ilike(clean_tag),
                Tag.name.ilike(f"%{clean_tag}%"),
                Album.name.ilike(clean_tag),
                Album.name.ilike(f"%{clean_tag}%")
            )
        )
        query = query.filter(Photo.id.in_(matched_ids))

    # Search filter
    if search_query:
        search_filter = or_(
            Photo.title.ilike(f"%{search_query}%"),
            Photo.description.ilike(f"%{search_query}%"),
            Photo.tags.any(Tag.name.ilike(f"%{search_query}%")),
            Photo.album.has(Album.name.ilike(f"%{search_query}%"))
        )
        query = query.filter(search_filter)

    # Sorting: Tất cả các tiêu chí định lượng đều sắp xếp từ LỚN ĐẾN NHỎ (DESC)
    if sort_by == 'popular':
        # Lượt xem: Lớn -> Nhỏ
        query = query.order_by(desc(func.coalesce(Photo.views_count, 0)), desc(Photo.created_at))
    elif sort_by == 'downloads':
        # Lượt tải: Lớn -> Nhỏ
        query = query.order_by(desc(func.coalesce(Photo.downloads_count, 0)), desc(Photo.created_at))
    elif sort_by == 'size':
        # Dung lượng / kích thước: Lớn -> Nhỏ
        query = query.order_by(desc(func.coalesce(Photo.file_size, 0)), desc(Photo.created_at))
    elif sort_by == 'oldest':
        # Cũ nhất: Thời gian cũ -> mới
        query = query.order_by(asc(Photo.created_at))
    else:
        # Mới nhất: Thời gian mới nhất -> cũ nhất (default)
        query = query.order_by(desc(Photo.created_at))

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'success': True,
        'photos': [p.to_dict() for p in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': pagination.page,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev
    }), 200

@photos_bp.route('/upload', methods=['POST'])
@token_required
def upload_photos(current_user):
    files = request.files.getlist('files') or request.files.getlist('file')
    if not files or len(files) == 0:
        return jsonify({'success': False, 'message': 'Vui lòng chọn ít nhất một hình ảnh'}), 400

    title = request.form.get('title', '').strip()
    description = request.form.get('description', '').strip()
    is_public = request.form.get('is_public', 'true').lower() in ('true', '1')
    raw_album_id = request.form.get('album_id', '').strip()
    auto_classify = raw_album_id == 'auto' or request.form.get('auto_album', '').lower() in ('true', '1')
    explicit_album_id = None
    if raw_album_id and raw_album_id != 'auto':
        try:
            explicit_album_id = int(raw_album_id)
        except ValueError:
            explicit_album_id = None

    tags_str = request.form.get('tags', '')

    # Process tags
    tag_names = set()
    if tags_str:
        if tags_str.startswith('['):
            try:
                parsed = json.loads(tags_str)
                tag_names = {t.strip().lower() for t in parsed if t.strip()}
            except Exception:
                tag_names = {t.strip().lower() for t in tags_str.split(',') if t.strip()}
        else:
            tag_names = {t.strip().lower() for t in tags_str.split(',') if t.strip()}

    tag_objects = []
    for t_name in tag_names:
        tag_obj = Tag.query.filter(Tag.name.ilike(t_name)).first()
        if not tag_obj:
            tag_obj = Tag(name=t_name.title() if len(t_name) > 3 else t_name)
            db.session.add(tag_obj)
        tag_objects.append(tag_obj)

    upload_folder = current_app.config['UPLOAD_FOLDER']
    thumb_folder = current_app.config['THUMBNAIL_FOLDER']

    uploaded_photos = []
    errors = []
    auto_matched_albums = []

    for idx, file_obj in enumerate(files):
        if not file_obj or file_obj.filename == '':
            continue

        if not allowed_file(file_obj.filename):
            errors.append(f"{file_obj.filename}: Định dạng tập tin không được hỗ trợ")
            continue

        res = save_and_process_image(file_obj, upload_folder, thumb_folder)
        if not res['success']:
            errors.append(f"{file_obj.filename}: {res['error']}")
            PHOTO_UPLOADS_TOTAL.labels(status='failed').inc()
            continue

        # Item title
        item_title = title if (len(files) == 1 and title) else (
            os.path.splitext(file_obj.filename)[0].replace('_', ' ').replace('-', ' ').title()
        )

        # Smart Album Classification
        target_album_id = explicit_album_id
        if not target_album_id and auto_classify:
            matched_album = match_photo_to_album(
                user_id=current_user.id,
                title=item_title,
                filename=file_obj.filename,
                description=description,
                tags=[t.name for t in tag_objects],
                exif_data=res.get('exif_data', {})
            )
            if matched_album:
                target_album_id = matched_album.id
                auto_matched_albums.append(f"'{item_title}' → Album '{matched_album.name}'")

        photo_tags_list = list(tag_objects)
        if target_album_id:
            alb_obj = db.session.get(Album, target_album_id)
            if alb_obj and alb_obj.name:
                has_alb_tag = any(t.name.lower() == alb_obj.name.lower() for t in photo_tags_list)
                if not has_alb_tag:
                    alb_tag = Tag.query.filter(Tag.name.ilike(alb_obj.name)).first()
                    if not alb_tag:
                        alb_tag = Tag(name=alb_obj.name)
                        db.session.add(alb_tag)
                    photo_tags_list.append(alb_tag)

        photo = Photo(
            title=item_title,
            description=description,
            filename=res['filename'],
            thumbnail_filename=res['thumbnail_filename'],
            file_size=res['file_size'],
            width=res['width'],
            height=res['height'],
            mime_type=res['mime_type'],
            is_public=is_public,
            exif_data=res.get('exif_data', {}),
            user_id=current_user.id,
            album_id=target_album_id
        )
        photo.tags = photo_tags_list
        db.session.add(photo)
        uploaded_photos.append(photo)
        PHOTO_UPLOADS_TOTAL.labels(status='success').inc()

    db.session.commit()

    if uploaded_photos:
        log_activity(
            current_user.id,
            'PHOTO_UPLOAD',
            f"Tải lên thành công {len(uploaded_photos)} ảnh bởi {current_user.username}"
        )

    msg = f"Đã tải lên thành công {len(uploaded_photos)} ảnh" if uploaded_photos else "Không có ảnh nào được tải lên"
    if auto_matched_albums:
        msg += f" (Tự động phân loại: {', '.join(auto_matched_albums)})"

    return jsonify({
        'success': len(uploaded_photos) > 0,
        'message': msg,
        'uploaded_photos': [p.to_dict() for p in uploaded_photos],
        'auto_matched_albums': auto_matched_albums,
        'errors': errors
    }), (201 if uploaded_photos else 400)

@photos_bp.route('/<int:photo_id>', methods=['GET'])
@optional_token
def get_photo_detail(current_user, photo_id):
    photo = db.session.get(Photo, photo_id)
    if not photo:
        return jsonify({'success': False, 'message': 'Không tìm thấy hình ảnh'}), 404

    # Check access permission
    if not photo.is_public:
        if not current_user or (current_user.id != photo.user_id and current_user.role != 'admin'):
            return jsonify({'success': False, 'message': 'Ảnh này ở chế độ riêng tư'}), 403

    # Increment view count
    photo.views_count = (photo.views_count or 0) + 1
    db.session.commit()

    return jsonify({
        'success': True,
        'photo': photo.to_dict()
    }), 200

@photos_bp.route('/<int:photo_id>', methods=['PUT'])
@token_required
def update_photo(current_user, photo_id):
    photo = db.session.get(Photo, photo_id)
    if not photo:
        return jsonify({'success': False, 'message': 'Không tìm thấy hình ảnh'}), 404

    # Only owner or admin can edit
    if photo.user_id != current_user.id and current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Bạn không có quyền chỉnh sửa ảnh này'}), 403

    data = request.get_json() or {}
    if 'title' in data:
        photo.title = data['title'].strip() or 'Untitled'
    if 'description' in data:
        photo.description = data['description'].strip()
    if 'is_public' in data:
        photo.is_public = bool(data['is_public'])
    # Process tags
    if 'tags' in data:
        tags_input = data['tags']
        if isinstance(tags_input, list):
            tag_names = {t.strip().lower() for t in tags_input if t.strip()}
        else:
            tag_names = {t.strip().lower() for t in str(tags_input).split(',') if t.strip()}

        tag_objects = []
        for t_name in tag_names:
            t = Tag.query.filter(Tag.name.ilike(t_name)).first()
            if not t:
                t = Tag(name=t_name.title() if len(t_name) > 3 else t_name)
                db.session.add(t)
            tag_objects.append(t)
        photo.tags = tag_objects

    # Intelligent Album Assignment / Update
    raw_album_id = data.get('album_id')
    auto_assigned_album = None

    if raw_album_id == '' or raw_album_id is False:
        # User explicitly chose to detach from any album
        photo.album_id = None
    elif raw_album_id and raw_album_id != 'auto':
        try:
            photo.album_id = int(raw_album_id)
        except ValueError:
            pass
    elif raw_album_id == 'auto' or 'tags' in data or 'title' in data:
        # Check matching album based on tags, title, description, EXIF
        matched = match_photo_to_album(
            user_id=photo.user_id,
            title=photo.title,
            filename=photo.filename,
            description=photo.description,
            tags=[t.name for t in photo.tags],
            exif_data=photo.exif_data or {}
        )
        if matched:
            photo.album_id = matched.id
            auto_assigned_album = matched.name

    if photo.album_id:
        alb_obj = db.session.get(Album, photo.album_id)
        if alb_obj and alb_obj.name:
            has_tag = any(t.name.lower() == alb_obj.name.lower() for t in photo.tags)
            if not has_tag:
                alb_tag = Tag.query.filter(Tag.name.ilike(alb_obj.name)).first()
                if not alb_tag:
                    alb_tag = Tag(name=alb_obj.name)
                    db.session.add(alb_tag)
                photo.tags.append(alb_tag)

    db.session.commit()
    log_activity(current_user.id, 'PHOTO_UPDATE', f"Cập nhật ảnh ID {photo.id} ({photo.title})")

    msg = 'Cập nhật thông tin ảnh thành công'
    if auto_assigned_album:
        msg = f"Đã lưu và tự động chuyển ảnh vào album '{auto_assigned_album}'!"

    return jsonify({
        'success': True,
        'message': msg,
        'photo': photo.to_dict()
    }), 200

@photos_bp.route('/<int:photo_id>/favorite', methods=['POST'])
@token_required
def toggle_favorite(current_user, photo_id):
    photo = db.session.get(Photo, photo_id)
    if not photo:
        return jsonify({'success': False, 'message': 'Không tìm thấy ảnh'}), 404

    photo.is_favorite = not photo.is_favorite
    db.session.commit()

    return jsonify({
        'success': True,
        'is_favorite': photo.is_favorite,
        'message': 'Đã thêm vào mục yêu thích' if photo.is_favorite else 'Đã bỏ khỏi mục yêu thích'
    }), 200

@photos_bp.route('/<int:photo_id>', methods=['DELETE'])
@token_required
def delete_photo(current_user, photo_id):
    photo = db.session.get(Photo, photo_id)
    if not photo:
        return jsonify({'success': False, 'message': 'Không tìm thấy hình ảnh'}), 404

    # Permission check
    if photo.user_id != current_user.id and current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Bạn không có quyền xóa ảnh này'}), 403

    permanent = request.args.get('permanent', '').lower() in ('true', '1')

    if permanent:
        upload_folder = current_app.config['UPLOAD_FOLDER']
        thumb_folder = current_app.config['THUMBNAIL_FOLDER']
        delete_image_files(upload_folder, thumb_folder, photo.filename, photo.thumbnail_filename)

        photo_title = photo.title
        db.session.delete(photo)
        db.session.commit()
        log_activity(current_user.id, 'PHOTO_DELETE_PERMANENT', f"Xóa vĩnh viễn ảnh ID {photo_id} ({photo_title})")
        return jsonify({
            'success': True,
            'message': 'Đã xóa vĩnh viễn ảnh khỏi thư viện'
        }), 200
    else:
        photo.is_deleted = True
        photo.deleted_at = datetime.utcnow()
        db.session.commit()
        log_activity(current_user.id, 'PHOTO_DELETE_TRASH', f"Chuyển ảnh ID {photo_id} ({photo.title}) vào thùng rác")
        return jsonify({
            'success': True,
            'message': 'Đã chuyển ảnh vào thùng rác'
        }), 200

@photos_bp.route('/<int:photo_id>/restore', methods=['POST'])
@token_required
def restore_photo(current_user, photo_id):
    photo = db.session.get(Photo, photo_id)
    if not photo:
        return jsonify({'success': False, 'message': 'Không tìm thấy hình ảnh'}), 404

    if photo.user_id != current_user.id and current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Bạn không có quyền khôi phục ảnh này'}), 403

    photo.is_deleted = False
    photo.deleted_at = None
    db.session.commit()

    log_activity(current_user.id, 'PHOTO_RESTORE', f"Khôi phục ảnh ID {photo_id} ({photo.title}) từ thùng rác")
    return jsonify({
        'success': True,
        'message': 'Đã khôi phục ảnh thành công!',
        'photo': photo.to_dict()
    }), 200

@photos_bp.route('/<int:photo_id>/file', methods=['GET'])
def get_original_file(photo_id):
    photo = db.session.get(Photo, photo_id)
    if not photo:
        return jsonify({'success': False, 'message': 'Không tìm thấy file'}), 404

    upload_folder = current_app.config['UPLOAD_FOLDER']
    file_path = os.path.join(upload_folder, photo.filename)
    if not os.path.exists(file_path):
        return jsonify({'success': False, 'message': 'File không tồn tại trên hệ thống lưu trữ'}), 404

    response = send_from_directory(upload_folder, photo.filename, mimetype=photo.mime_type)
    response.headers['Cache-Control'] = 'public, max-age=604800'  # 7 days browser cache
    return response

@photos_bp.route('/<int:photo_id>/thumbnail', methods=['GET'])
def get_thumbnail_file(photo_id):
    photo = db.session.get(Photo, photo_id)
    if not photo:
        return jsonify({'success': False, 'message': 'Không tìm thấy thumbnail'}), 404

    thumb_folder = current_app.config['THUMBNAIL_FOLDER']
    thumb_name = photo.thumbnail_filename

    if thumb_name and os.path.exists(os.path.join(thumb_folder, thumb_name)):
        response = send_from_directory(thumb_folder, thumb_name, mimetype='image/webp')
    else:
        # Fallback to original if thumbnail missing
        upload_folder = current_app.config['UPLOAD_FOLDER']
        file_path = os.path.join(upload_folder, photo.filename)
        if not os.path.exists(file_path):
            return jsonify({'success': False, 'message': 'File không tồn tại trên hệ thống lưu trữ'}), 404
        response = send_from_directory(upload_folder, photo.filename, mimetype=photo.mime_type)

    response.headers['Cache-Control'] = 'public, max-age=604800'
    return response

@photos_bp.route('/<int:photo_id>/download', methods=['GET'])
def download_photo(photo_id):
    photo = db.session.get(Photo, photo_id)
    if not photo:
        return jsonify({'success': False, 'message': 'Không tìm thấy file'}), 404

    upload_folder = current_app.config['UPLOAD_FOLDER']
    file_path = os.path.join(upload_folder, photo.filename)
    if not os.path.exists(file_path):
        return jsonify({'success': False, 'message': 'File không tồn tại'}), 404

    photo.downloads_count = (photo.downloads_count or 0) + 1
    db.session.commit()
    PHOTO_DOWNLOADS_TOTAL.inc()

    ext = photo.filename.rsplit('.', 1)[-1] if '.' in photo.filename else 'jpg'
    download_name = f"{photo.title.replace(' ', '_')}.{ext}"

    return send_file(
        file_path,
        as_attachment=True,
        download_name=download_name,
        mimetype=photo.mime_type
    )

@photos_bp.route('/tags/popular', methods=['GET'])
def get_popular_tags():
    # 1. Collect all albums that have active photos
    albums = Album.query.all()
    categories = []
    seen_names = set()

    for alb in albums:
        cnt = alb.photos.filter(or_(Photo.is_deleted == False, Photo.is_deleted == None)).count()
        if cnt > 0:
            categories.append({
                'id': f"album_{alb.id}",
                'album_id': alb.id,
                'name': alb.name,
                'count': cnt,
                'is_album': True
            })
            seen_names.add(alb.name.strip().lower())

    # 2. Collect popular tags that have active photos
    tags = Tag.query.all()
    for t in tags:
        cnt = t.photos.filter(or_(Photo.is_deleted == False, Photo.is_deleted == None)).count()
        if cnt > 0:
            norm_name = t.name.strip().lower()
            if norm_name not in seen_names:
                categories.append({
                    'id': f"tag_{t.id}",
                    'album_id': None,
                    'name': t.name,
                    'count': cnt,
                    'is_album': False
                })
                seen_names.add(norm_name)
            else:
                for cat in categories:
                    if cat['name'].strip().lower() == norm_name:
                        cat['count'] = max(cat['count'], cnt)

    categories.sort(key=lambda x: x['count'], reverse=True)
    return jsonify({
        'success': True,
        'tags': categories[:30]
    }), 200
