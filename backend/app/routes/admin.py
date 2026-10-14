import os
from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import func, desc
from ..models import db, User, Photo, Album, SystemLog
from ..utils.auth_middleware import token_required, admin_required, log_activity

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/stats', methods=['GET'])
@token_required
@admin_required
def get_system_stats(current_user):
    total_users = User.query.count()
    total_photos = Photo.query.count()
    total_albums = Album.query.count()
    
    views_sum = db.session.query(func.sum(Photo.views_count)).scalar() or 0
    downloads_sum = db.session.query(func.sum(Photo.downloads_count)).scalar() or 0

    # Calculate upload storage usage
    upload_folder = current_app.config['UPLOAD_FOLDER']
    thumb_folder = current_app.config['THUMBNAIL_FOLDER']
    
    total_bytes = 0
    for folder in [upload_folder, thumb_folder]:
        if os.path.exists(folder):
            for dirpath, dirnames, filenames in os.walk(folder):
                for f in filenames:
                    fp = os.path.join(dirpath, f)
                    if os.path.exists(fp):
                        total_bytes += os.path.getsize(fp)

    storage_mb = round(total_bytes / (1024 * 1024), 2)

    # Recent 5 activity logs
    recent_logs = SystemLog.query.order_by(SystemLog.created_at.desc()).limit(10).all()

    return jsonify({
        'success': True,
        'stats': {
            'total_users': total_users,
            'total_photos': total_photos,
            'total_albums': total_albums,
            'total_views': views_sum,
            'total_downloads': downloads_sum,
            'storage_bytes': total_bytes,
            'storage_mb': storage_mb
        },
        'recent_logs': [log.to_dict() for log in recent_logs]
    }), 200

@admin_bp.route('/users', methods=['GET'])
@token_required
@admin_required
def list_users(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    search = request.args.get('search', '').strip()

    query = User.query
    if search:
        query = query.filter((User.username.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%")))

    pagination = query.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'success': True,
        'users': [u.to_dict() for u in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': pagination.page
    }), 200

@admin_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@token_required
@admin_required
def update_user_role(current_user, user_id):
    if user_id == current_user.id:
        return jsonify({'success': False, 'message': 'Không thể tự thay đổi quyền hạn của chính bạn'}), 400

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'success': False, 'message': 'Không tìm thấy người dùng'}), 404

    data = request.get_json() or {}
    new_role = data.get('role', 'user')
    if new_role not in ('admin', 'user'):
        return jsonify({'success': False, 'message': 'Quyền không hợp lệ'}), 400

    old_role = user.role
    user.role = new_role
    db.session.commit()

    log_activity(current_user.id, 'CHANGE_USER_ROLE', f"Đổi quyền người dùng {user.username} từ {old_role} sang {new_role}")

    return jsonify({
        'success': True,
        'message': f"Đã chuyển quyền của {user.username} thành {new_role}",
        'user': user.to_dict()
    }), 200

@admin_bp.route('/users/<int:user_id>/status', methods=['PUT'])
@token_required
@admin_required
def toggle_user_status(current_user, user_id):
    if user_id == current_user.id:
        return jsonify({'success': False, 'message': 'Không thể khóa tài khoản của chính bạn'}), 400

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'success': False, 'message': 'Không tìm thấy người dùng'}), 404

    user.is_active = not user.is_active
    db.session.commit()

    status_str = "kích hoạt" if user.is_active else "vô hiệu hóa"
    log_activity(current_user.id, 'CHANGE_USER_STATUS', f"{status_str.title()} tài khoản {user.username}")

    return jsonify({
        'success': True,
        'message': f"Đã {status_str} tài khoản {user.username}",
        'user': user.to_dict()
    }), 200

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(current_user, user_id):
    if user_id == current_user.id:
        return jsonify({'success': False, 'message': 'Không thể xóa tài khoản của chính bạn'}), 400

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'success': False, 'message': 'Không tìm thấy người dùng'}), 404

    username = user.username
    db.session.delete(user)
    db.session.commit()

    log_activity(current_user.id, 'DELETE_USER', f"Quản trị viên xóa tài khoản {username}")

    return jsonify({
        'success': True,
        'message': f"Đã xóa người dùng {username}"
    }), 200

@admin_bp.route('/logs', methods=['GET'])
@token_required
@admin_required
def get_audit_logs(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 200)

    pagination = SystemLog.query.order_by(SystemLog.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'success': True,
        'logs': [log.to_dict() for log in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': pagination.page
    }), 200
