import io
import os
import zipfile
import re
from flask import Blueprint, request, jsonify, current_app, send_file
from sqlalchemy import or_
from ..models import db, Album, Photo
from ..utils.auth_middleware import token_required, optional_token, log_activity
from ..utils.metrics_tracker import PHOTO_DOWNLOADS_TOTAL

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

    albums = query.all()
    album_dicts = [a.to_dict() for a in albums]
    album_dicts.sort(key=lambda x: x.get('photos_count', 0), reverse=True)
    return jsonify({
        'success': True,
        'albums': album_dicts
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

@albums_bp.route('/<int:album_id>/download', methods=['GET'])
@optional_token
def download_album(current_user, album_id):
    album = db.session.get(Album, album_id)
    if not album:
        return jsonify({'success': False, 'message': 'Không tìm thấy album'}), 404

    # Permission check for private album
    if not album.is_public:
        if not current_user or (current_user.id != album.user_id and current_user.role != 'admin'):
            return jsonify({'success': False, 'message': 'Album này ở chế độ riêng tư'}), 403

    photos_query = album.photos.filter(or_(Photo.is_deleted == False, Photo.is_deleted == None))
    if not (current_user and (current_user.id == album.user_id or current_user.role == 'admin')):
        photos_query = photos_query.filter(Photo.is_public == True)

    photos = photos_query.all()
    if not photos:
        return jsonify({'success': False, 'message': 'Album hiện chưa có hình ảnh nào để tải về'}), 400

    upload_folder = current_app.config['UPLOAD_FOLDER']
    mem_zip = io.BytesIO()

    with zipfile.ZipFile(mem_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        used_filenames = set()
        for idx, p in enumerate(photos):
            file_path = os.path.join(upload_folder, p.filename)
            if os.path.exists(file_path):
                # Sanitize photo title
                safe_title = re.sub(r'[\\/*?:"<>|]', "", p.title).strip() or f"photo_{p.id}"
                ext = p.filename.rsplit('.', 1)[1].lower() if '.' in p.filename else 'jpg'
                arc_name = f"{safe_title}.{ext}"
                if arc_name in used_filenames:
                    arc_name = f"{safe_title}_{idx + 1}.{ext}"
                used_filenames.add(arc_name)

                zf.write(file_path, arcname=arc_name)
                p.downloads_count = (p.downloads_count or 0) + 1
                PHOTO_DOWNLOADS_TOTAL.inc()

    db.session.commit()
    mem_zip.seek(0)

    safe_album_name = re.sub(r'[\\/*?:"<>|]', "", album.name).strip() or f"album_{album.id}"
    return send_file(
        mem_zip,
        mimetype='application/zip',
        as_attachment=True,
        download_name=f"{safe_album_name}.zip"
    )
