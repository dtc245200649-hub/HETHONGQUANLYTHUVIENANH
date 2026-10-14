import os
import shutil
from functools import wraps
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from app import db
from app.models.user import User
from app.models.image import Image
from app.models.album import Album
from app.models.log import SystemLog

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Yêu cầu quyền Quản trị viên (Admin)'}), 403
        return f(*args, **kwargs)
    return decorated

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    total_images = Image.query.count()
    total_albums = Album.query.count()

    # Storage statistics
    storage_sum = db.session.query(func.sum(Image.file_size)).scalar() or 0
    total_storage_mb = round(storage_sum / (1024 * 1024), 2)
    total_storage_gb = round(storage_sum / (1024 * 1024 * 1024), 2)

    # Disk usage of upload directory
    upload_dir = current_app.config.get('UPLOAD_FOLDER')
    disk_total, disk_used, disk_free = shutil.disk_usage(upload_dir if os.path.exists(upload_dir) else '.')
    disk_total_gb = round(disk_total / (1024 ** 3), 1)
    disk_free_gb = round(disk_free / (1024 ** 3), 1)
    disk_percent = round((disk_used / disk_total) * 100, 1)

    # Recent activities
    recent_images = Image.query.order_by(Image.created_at.desc()).limit(6).all()
    recent_users = User.query.order_by(User.created_at.desc()).limit(6).all()

    return jsonify({
        'stats': {
            'total_users': total_users,
            'active_users': active_users,
            'total_images': total_images,
            'total_albums': total_albums,
            'total_storage_bytes': storage_sum,
            'total_storage_mb': total_storage_mb,
            'total_storage_gb': total_storage_gb,
            'disk_total_gb': disk_total_gb,
            'disk_free_gb': disk_free_gb,
            'disk_percent': disk_percent
        },
        'recent_images': [img.to_dict() for img in recent_images],
        'recent_users': [u.to_dict(include_private=True) for u in recent_users]
    }), 200

@admin_bp.route('/users', methods=['GET'])
@admin_required
def list_users():
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    search = request.args.get('search', '').strip()

    query = User.query
    if search:
        query = query.filter(
            (User.username.ilike(f'%{search}%')) |
            (User.email.ilike(f'%{search}%')) |
            (User.full_name.ilike(f'%{search}%'))
        )

    pagination = query.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'users': [u.to_dict(include_private=True) for u in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user_status(user_id):
    current_admin_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}

    if 'is_active' in data:
        if user.id == current_admin_id and not data['is_active']:
            return jsonify({'error': 'Bạn không thể tự khóa tài khoản Admin đang đăng nhập'}), 400
        user.is_active = bool(data['is_active'])

    if 'role' in data:
        if data['role'] in ['admin', 'user']:
            if user.id == current_admin_id and data['role'] != 'admin':
                return jsonify({'error': 'Bạn không thể tự hạ quyền Admin của chính mình'}), 400
            user.role = data['role']

    db.session.commit()

    log = SystemLog(
        action='ADMIN_UPDATE_USER',
        description=f'Quản trị viên cập nhật user #{user.id} ({user.username}) - Role: {user.role}, Active: {user.is_active}',
        user_id=current_admin_id
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({'message': 'Cập nhật người dùng thành công', 'user': user.to_dict(include_private=True)}), 200

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    current_admin_id = int(get_jwt_identity())
    if user_id == current_admin_id:
        return jsonify({'error': 'Không thể xóa tài khoản Admin đang đăng nhập'}), 400

    user = User.query.get_or_404(user_id)
    username = user.username

    # Delete physical image files owned by this user
    for img in user.images:
        if os.path.exists(img.file_path):
            try:
                os.remove(img.file_path)
            except Exception:
                pass

    db.session.delete(user)
    db.session.commit()

    log = SystemLog(
        action='ADMIN_DELETE_USER',
        description=f'Quản trị viên xóa người dùng {username} (#{user_id})',
        user_id=current_admin_id
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({'message': f'Đã xóa người dùng {username} thành công'}), 200

@admin_bp.route('/logs', methods=['GET'])
@admin_required
def list_logs():
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 100)

    pagination = SystemLog.query.order_by(SystemLog.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'logs': [l.to_dict() for l in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200
