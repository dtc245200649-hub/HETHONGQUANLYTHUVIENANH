from flask import Blueprint, request, jsonify
from sqlalchemy import or_
from ..models import db, Album, Photo
from ..utils.auth_middleware import token_required, optional_token, log_activity

albums_bp = Blueprint('albums', __name__, url_prefix='/api/albums')

@albums_bp.route('', methods=['GET'])
@optional_token
def list_albums(current_user):
    query = Album.query
    if current_user and current_user.role == 'admin':
        pass
    elif current_user:
        query = query.filter(or_(Album.is_public == True, Album.user_id == current_user.id))
    else:
        query = query.filter(Album.is_public == True)

    albums = query.order_by(Album.created_at.desc()).all()
    return jsonify({
        'success': True,
        'albums': [a.to_dict() for a in albums]
    }), 200

@albums_bp.route('', methods=['POST'])
@token_required
def create_album(current_user):
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    is_public = data.get('is_public', True)
    cover_image_url = data.get('cover_image_url', '')

    if not name:
        return jsonify({'success': False, 'message': 'Tên album không được để trống'}), 400

    album = Album(
        name=name,
        description=description,
        is_public=bool(is_public),
        cover_image_url=cover_image_url,
        user_id=current_user.id
    )
    db.session.add(album)
    db.session.commit()

    log_activity(current_user.id, 'ALBUM_CREATE', f"Tạo album '{name}'")

    return jsonify({
        'success': True,
        'message': 'Tạo album mới thành công!',
        'album': album.to_dict()
    }), 201

@albums_bp.route('/<int:album_id>', methods=['GET'])
@optional_token
def get_album_detail(current_user, album_id):
    album = db.session.get(Album, album_id)
    if not album:
        return jsonify({'success': False, 'message': 'Không tìm thấy album'}), 404

    if not album.is_public:
        if not current_user or (current_user.id != album.user_id and current_user.role != 'admin'):
            return jsonify({'success': False, 'message': 'Album này được đặt ở chế độ riêng tư'}), 403

    photos_query = album.photos
    if not (current_user and (current_user.id == album.user_id or current_user.role == 'admin')):
        photos_query = photos_query.filter(Photo.is_public == True)

    photos = [p.to_dict() for p in photos_query.order_by(Photo.created_at.desc()).all()]

    album_dict = album.to_dict()
    album_dict['photos'] = photos

    return jsonify({
        'success': True,
        'album': album_dict
    }), 200

@albums_bp.route('/<int:album_id>', methods=['PUT'])
@token_required
def update_album(current_user, album_id):
    album = db.session.get(Album, album_id)
    if not album:
        return jsonify({'success': False, 'message': 'Không tìm thấy album'}), 404

    if album.user_id != current_user.id and current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Bạn không có quyền chỉnh sửa album này'}), 403

    data = request.get_json() or {}
    if 'name' in data:
        album.name = data['name'].strip() or album.name
    if 'description' in data:
        album.description = data['description'].strip()
    if 'is_public' in data:
        album.is_public = bool(data['is_public'])
    if 'cover_image_url' in data:
        album.cover_image_url = data['cover_image_url']

    db.session.commit()
    log_activity(current_user.id, 'ALBUM_UPDATE', f"Cập nhật album '{album.name}'")

    return jsonify({
        'success': True,
        'message': 'Cập nhật album thành công!',
        'album': album.to_dict()
    }), 200

@albums_bp.route('/<int:album_id>', methods=['DELETE'])
@token_required
def delete_album(current_user, album_id):
    album = db.session.get(Album, album_id)
    if not album:
        return jsonify({'success': False, 'message': 'Không tìm thấy album'}), 404

    if album.user_id != current_user.id and current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Bạn không có quyền xóa album này'}), 403

    album_name = album.name
    # Detach photos from this album before deleting
    for p in album.photos:
        p.album_id = None

    db.session.delete(album)
    db.session.commit()

    log_activity(current_user.id, 'ALBUM_DELETE', f"Xóa album '{album_name}'")

    return jsonify({
        'success': True,
        'message': 'Đã xóa album thành công'
    }), 200
