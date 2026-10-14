from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from app import db
from app.models.album import Album
from app.models.image import Image
from app.models.user import User

albums_bp = Blueprint('albums', __name__)

def get_current_user_optional():
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity:
            return User.query.get(int(identity))
    except Exception:
        pass
    return None

@albums_bp.route('', methods=['GET'])
def list_albums():
    current_user = get_current_user_optional()
    user_id = request.args.get('user_id', type=int)
    search = request.args.get('search', '').strip()

    query = Album.query

    if current_user and current_user.role == 'admin':
        pass
    elif current_user:
        query = query.filter((Album.is_public == True) | (Album.user_id == current_user.id))
    else:
        query = query.filter(Album.is_public == True)

    if user_id:
        query = query.filter(Album.user_id == user_id)

    if search:
        query = query.filter((Album.title.ilike(f'%{search}%')) | (Album.description.ilike(f'%{search}%')))

    albums = query.order_by(Album.created_at.desc()).all()
    return jsonify({'albums': [a.to_dict() for a in albums]}), 200

@albums_bp.route('', methods=['POST'])
@jwt_required()
def create_album():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    is_public = bool(data.get('is_public', True))

    if not title:
        return jsonify({'error': 'Tên album không được để trống'}), 400

    album = Album(
        title=title,
        description=description,
        is_public=is_public,
        user_id=user_id
    )

    db.session.add(album)
    db.session.commit()

    return jsonify({'message': 'Tạo album thành công', 'album': album.to_dict()}), 201

@albums_bp.route('/<int:album_id>', methods=['GET'])
def get_album(album_id):
    current_user = get_current_user_optional()
    album = Album.query.get_or_404(album_id)

    if not album.is_public:
        if not current_user or (current_user.id != album.user_id and current_user.role != 'admin'):
            return jsonify({'error': 'Bạn không có quyền truy cập album này'}), 403

    return jsonify({'album': album.to_dict(include_images=True)}), 200

@albums_bp.route('/<int:album_id>', methods=['PUT'])
@jwt_required()
def update_album(album_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    album = Album.query.get_or_404(album_id)

    if user.role != 'admin' and album.user_id != user.id:
        return jsonify({'error': 'Bạn không có quyền chỉnh sửa album này'}), 403

    data = request.get_json() or {}
    if 'title' in data:
        album.title = data['title'].strip()
    if 'description' in data:
        album.description = data['description'].strip()
    if 'is_public' in data:
        album.is_public = bool(data['is_public'])
    if 'cover_image_id' in data:
        album.cover_image_id = data['cover_image_id']

    db.session.commit()
    return jsonify({'message': 'Cập nhật album thành công', 'album': album.to_dict()}), 200

@albums_bp.route('/<int:album_id>', methods=['DELETE'])
@jwt_required()
def delete_album(album_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    album = Album.query.get_or_404(album_id)

    if user.role != 'admin' and album.user_id != user.id:
        return jsonify({'error': 'Bạn không có quyền xóa album này'}), 403

    # Unassign images from album before deleting
    Image.query.filter_by(album_id=album.id).update({'album_id': None})
    db.session.delete(album)
    db.session.commit()

    return jsonify({'message': 'Đã xóa album thành công'}), 200

@albums_bp.route('/<int:album_id>/add-images', methods=['POST'])
@jwt_required()
def add_images_to_album(album_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    album = Album.query.get_or_404(album_id)

    if user.role != 'admin' and album.user_id != user.id:
        return jsonify({'error': 'Bạn không có quyền thêm ảnh vào album này'}), 403

    data = request.get_json() or {}
    image_ids = data.get('image_ids', [])

    images = Image.query.filter(Image.id.in_(image_ids)).all()
    for img in images:
        if user.role == 'admin' or img.user_id == user.id:
            img.album_id = album.id

    if not album.cover_image_id and images:
        album.cover_image_id = images[0].id

    db.session.commit()
    return jsonify({'message': f'Đã thêm {len(images)} ảnh vào album', 'album': album.to_dict(include_images=True)}), 200
