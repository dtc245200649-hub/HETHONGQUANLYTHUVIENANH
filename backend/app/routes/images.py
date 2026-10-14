import os
import uuid
from PIL import Image as PILImage
from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from werkzeug.utils import secure_filename
from app import db
from app.models.image import Image
from app.models.tag import Tag
from app.models.album import Album
from app.models.user import User
from app.models.log import SystemLog

images_bp = Blueprint('images', __name__)

def get_current_user_optional():
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity:
            return User.query.get(int(identity))
    except Exception:
        pass
    return None

def allowed_file(filename):
    exts = current_app.config.get('ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'})
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in exts

@images_bp.route('', methods=['GET'])
def list_images():
    current_user = get_current_user_optional()
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 24, type=int), 100)
    search = request.args.get('search', '').strip()
    tag_name = request.args.get('tag', '').strip()
    album_id = request.args.get('album_id', type=int)
    user_id = request.args.get('user_id', type=int)
    only_mine = request.args.get('only_mine', 'false').lower() == 'true'
    sort_by = request.args.get('sort_by', 'newest')

    query = Image.query

    # Privacy filtering:
    # Public images can be seen by all.
    # Private images can only be seen by owner or admin.
    if current_user and current_user.role == 'admin':
        # Admin can view all
        pass
    elif current_user:
        # User sees public images OR their own private images
        if only_mine:
            query = query.filter(Image.user_id == current_user.id)
        else:
            query = query.filter((Image.is_public == True) | (Image.user_id == current_user.id))
    else:
        # Guest only sees public
        query = query.filter(Image.is_public == True)

    # Search filter
    if search:
        query = query.filter((Image.title.ilike(f'%{search}%')) | (Image.description.ilike(f'%{search}%')))

    # Filter by user
    if user_id:
        query = query.filter(Image.user_id == user_id)

    # Filter by album
    if album_id:
        query = query.filter(Image.album_id == album_id)

    # Filter by tag
    if tag_name:
        query = query.filter(Image.tags.any(Tag.name == tag_name))

    # Sorting
    if sort_by == 'oldest':
        query = query.order_by(Image.created_at.asc())
    elif sort_by == 'most_viewed':
        query = query.order_by(Image.view_count.desc())
    elif sort_by == 'most_downloaded':
        query = query.order_by(Image.download_count.desc())
    elif sort_by == 'size':
        query = query.order_by(Image.file_size.desc())
    else: # newest
        query = query.order_by(Image.created_at.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'images': [img.to_dict() for img in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'per_page': per_page
    }), 200

@images_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_image():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or not user.is_active:
        return jsonify({'error': 'Tài khoản không hợp lệ hoặc đã bị khóa'}), 403

    if 'file' not in request.files and 'files' not in request.files:
        return jsonify({'error': 'Không có tệp tải lên'}), 400

    uploaded_files = request.files.getlist('files') or [request.files['file']]
    title = request.form.get('title', '').strip()
    description = request.form.get('description', '').strip()
    is_public = request.form.get('is_public', 'true').lower() in ('true', '1')
    album_id = request.form.get('album_id', type=int)
    raw_tags = request.form.get('tags', '')

    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)

    # Parse tags
    tag_objects = []
    if raw_tags:
        tag_names = [t.strip() for t in raw_tags.split(',') if t.strip()]
        for tname in tag_names:
            tag = Tag.query.filter_by(name=tname).first()
            if not tag:
                tag = Tag(name=tname)
                db.session.add(tag)
            tag_objects.append(tag)

    saved_images = []

    for file in uploaded_files:
        if not file or file.filename == '':
            continue

        if not allowed_file(file.filename):
            continue

        orig_filename = secure_filename(file.filename) or 'photo.jpg'
        ext = orig_filename.rsplit('.', 1)[1].lower() if '.' in orig_filename else 'jpg'
        unique_filename = f"{uuid.uuid4().hex}.{ext}"
        save_path = os.path.join(upload_folder, unique_filename)

        file.save(save_path)
        file_size = os.path.getsize(save_path)

        # Extract dimensions
        width = 0
        height = 0
        mime_type = file.mimetype or f'image/{ext}'
        try:
            with PILImage.open(save_path) as img:
                width, height = img.size
                if not mime_type or mime_type == 'application/octet-stream':
                    mime_type = PILImage.MIME.get(img.format, f'image/{ext}')
        except Exception:
            pass

        img_title = title if (len(uploaded_files) == 1 and title) else orig_filename.rsplit('.', 1)[0].replace('_', ' ').replace('-', ' ').title()

        image_record = Image(
            title=img_title,
            description=description,
            filename=unique_filename,
            original_filename=orig_filename,
            file_path=save_path,
            file_size=file_size,
            mime_type=mime_type,
            width=width,
            height=height,
            is_public=is_public,
            user_id=user.id,
            album_id=album_id
        )

        for tag in tag_objects:
            image_record.tags.append(tag)

        db.session.add(image_record)
        saved_images.append(image_record)

    db.session.commit()

    # Log action
    log = SystemLog(
        action='IMAGE_UPLOAD',
        description=f'Tải lên {len(saved_images)} ảnh bởi {user.username}',
        user_id=user.id
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'message': f'Đã tải lên {len(saved_images)} ảnh thành công',
        'images': [img.to_dict() for img in saved_images]
    }), 201

@images_bp.route('/<int:image_id>', methods=['GET'])
def get_image(image_id):
    current_user = get_current_user_optional()
    image = Image.query.get_or_404(image_id)

    # Permission check for private images
    if not image.is_public:
        if not current_user or (current_user.id != image.user_id and current_user.role != 'admin'):
            return jsonify({'error': 'Bạn không có quyền xem ảnh này'}), 403

    # Increment views
    image.view_count += 1
    db.session.commit()

    return jsonify({'image': image.to_dict()}), 200

@images_bp.route('/<int:image_id>', methods=['PUT'])
@jwt_required()
def update_image(image_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    image = Image.query.get_or_404(image_id)

    if user.role != 'admin' and image.user_id != user.id:
        return jsonify({'error': 'Bạn không có quyền chỉnh sửa ảnh này'}), 403

    data = request.get_json() or {}

    if 'title' in data:
        image.title = data['title'].strip()
    if 'description' in data:
        image.description = data['description'].strip()
    if 'is_public' in data:
        image.is_public = bool(data['is_public'])
    if 'album_id' in data:
        image.album_id = data['album_id'] if data['album_id'] else None

    if 'tags' in data:
        raw_tags = data['tags']
        tag_objects = []
        tag_list = raw_tags if isinstance(raw_tags, list) else [t.strip() for t in raw_tags.split(',') if t.strip()]
        for tname in tag_list:
            tag = Tag.query.filter_by(name=tname).first()
            if not tag:
                tag = Tag(name=tname)
                db.session.add(tag)
            tag_objects.append(tag)
        image.tags = tag_objects

    db.session.commit()
    return jsonify({'message': 'Cập nhật thông tin ảnh thành công', 'image': image.to_dict()}), 200

@images_bp.route('/<int:image_id>', methods=['DELETE'])
@jwt_required()
def delete_image(image_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    image = Image.query.get_or_404(image_id)

    if user.role != 'admin' and image.user_id != user.id:
        return jsonify({'error': 'Bạn không có quyền xóa ảnh này'}), 403

    # Delete physical file
    if os.path.exists(image.file_path):
        try:
            os.remove(image.file_path)
        except Exception:
            pass

    db.session.delete(image)
    db.session.commit()

    log = SystemLog(
        action='IMAGE_DELETE',
        description=f'Xóa ảnh #{image_id} ({image.title}) bởi {user.username}',
        user_id=user.id
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({'message': 'Đã xóa ảnh thành công'}), 200

@images_bp.route('/<int:image_id>/file', methods=['GET'])
def serve_image_file(image_id):
    image = Image.query.get_or_404(image_id)

    if not image.is_public:
        current_user = get_current_user_optional()
        if not current_user or (current_user.id != image.user_id and current_user.role != 'admin'):
            return jsonify({'error': 'Không có quyền truy cập'}), 403

    if not os.path.exists(image.file_path):
        return jsonify({'error': 'Tệp ảnh không tồn tại trên máy chủ'}), 404

    return send_file(image.file_path, mimetype=image.mime_type)

@images_bp.route('/<int:image_id>/download', methods=['GET'])
def download_image(image_id):
    image = Image.query.get_or_404(image_id)

    if not image.is_public:
        current_user = get_current_user_optional()
        if not current_user or (current_user.id != image.user_id and current_user.role != 'admin'):
            return jsonify({'error': 'Không có quyền truy cập'}), 403

    if not os.path.exists(image.file_path):
        return jsonify({'error': 'Tệp ảnh không tồn tại trên máy chủ'}), 404

    image.download_count += 1
    db.session.commit()

    return send_file(
        image.file_path,
        mimetype=image.mime_type,
        as_attachment=True,
        download_name=image.original_filename
    )
