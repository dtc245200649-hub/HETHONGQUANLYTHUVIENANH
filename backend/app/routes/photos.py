import os
import json
from flask import Blueprint, request, jsonify, current_app, send_from_directory, send_file
from sqlalchemy import or_, desc, asc
from ..models import db, Photo, Tag, Album, photo_tags
from ..utils.auth_middleware import token_required, optional_token, log_activity
from ..utils.file_handler import allowed_file, save_and_process_image, delete_image_files
from ..utils.metrics_tracker import PHOTO_UPLOADS_TOTAL, PHOTO_DOWNLOADS_TOTAL

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
    sort_by = request.args.get('sort', 'newest')

    query = Photo.query

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

    # Filter by tag
    if tag_name:
        query = query.join(Photo.tags).filter(Tag.name.ilike(tag_name))

    # Search filter
    if search_query:
        search_filter = or_(
            Photo.title.ilike(f"%{search_query}%"),
            Photo.description.ilike(f"%{search_query}%"),
            Photo.tags.any(Tag.name.ilike(f"%{search_query}%"))
        )
        query = query.filter(search_filter)

    # Sorting
    if sort_by == 'oldest':
        query = query.order_by(asc(Photo.created_at))
    elif sort_by == 'popular':
        query = query.order_by(desc(Photo.views_count), desc(Photo.created_at))
    elif sort_by == 'downloads':
        query = query.order_by(desc(Photo.downloads_count), desc(Photo.created_at))
    elif sort_by == 'size':
        query = query.order_by(desc(Photo.file_size))
    else:
        # default newest
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
    album_id = request.form.get('album_id', type=int)
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
        tag_obj = Tag.query.filter_by(name=t_name).first()
        if not tag_obj:
            tag_obj = Tag(name=t_name)
            db.session.add(tag_obj)
        tag_objects.append(tag_obj)

    upload_folder = current_app.config['UPLOAD_FOLDER']
    thumb_folder = current_app.config['THUMBNAIL_FOLDER']

    uploaded_photos = []
    errors = []

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
            user_id=current_user.id,
            album_id=album_id
        )
        photo.tags = tag_objects
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

    return jsonify({
        'success': len(uploaded_photos) > 0,
        'message': f"Đã tải lên thành công {len(uploaded_photos)} ảnh" if uploaded_photos else "Không có ảnh nào được tải lên",
        'uploaded_photos': [p.to_dict() for p in uploaded_photos],
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
    if 'album_id' in data:
        photo.album_id = data['album_id'] if data['album_id'] else None

    if 'tags' in data:
        tags_input = data['tags']
        if isinstance(tags_input, list):
            tag_names = {t.strip().lower() for t in tags_input if t.strip()}
        else:
            tag_names = {t.strip().lower() for t in str(tags_input).split(',') if t.strip()}

        tag_objects = []
        for t_name in tag_names:
            t = Tag.query.filter_by(name=t_name).first()
            if not t:
                t = Tag(name=t_name)
                db.session.add(t)
            tag_objects.append(t)
        photo.tags = tag_objects

    db.session.commit()
    log_activity(current_user.id, 'PHOTO_UPDATE', f"Cập nhật ảnh ID {photo.id} ({photo.title})")

    return jsonify({
        'success': True,
        'message': 'Cập nhật thông tin ảnh thành công',
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

    upload_folder = current_app.config['UPLOAD_FOLDER']
    thumb_folder = current_app.config['THUMBNAIL_FOLDER']

    delete_image_files(upload_folder, thumb_folder, photo.filename, photo.thumbnail_filename)

    photo_title = photo.title
    db.session.delete(photo)
    db.session.commit()

    log_activity(current_user.id, 'PHOTO_DELETE', f"Xóa ảnh ID {photo_id} ({photo_title})")

    return jsonify({
        'success': True,
        'message': 'Đã xóa ảnh thành công'
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
    tags = Tag.query.all()
    tag_list = [t.to_dict() for t in tags if t.photos.count() > 0]
    tag_list.sort(key=lambda x: x['count'], reverse=True)
    return jsonify({
        'success': True,
        'tags': tag_list[:20]
    }), 200
