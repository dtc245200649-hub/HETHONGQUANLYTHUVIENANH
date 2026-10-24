import os
import subprocess
import zipfile
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from sqlalchemy import func, desc
from ..models import db, User, Photo, Album, SystemLog
from ..utils.auth_middleware import token_required, admin_required, log_activity
from ..utils.file_handler import delete_image_files

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

    # Remove photo files from storage
    upload_folder = current_app.config['UPLOAD_FOLDER']
    thumb_folder = current_app.config['THUMBNAIL_FOLDER']
    for p in user.photos:
        delete_image_files(upload_folder, thumb_folder, p.filename, p.thumbnail_filename)

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

def get_backup_dir():
    backup_dir = os.getenv('BACKUP_DIR', '/app/backups')
    if not os.path.exists(backup_dir):
        # Fallback for local development
        base_dir = current_app.config.get('BASE_DIR', os.getcwd())
        backup_dir = os.path.join(os.path.dirname(base_dir), 'backup', 'archives')
    os.makedirs(backup_dir, exist_ok=True)
    return backup_dir

@admin_bp.route('/backups', methods=['GET'])
@token_required
@admin_required
def list_backups(current_user):
    backup_dir = get_backup_dir()
    files = []
    if os.path.exists(backup_dir):
        for f in os.listdir(backup_dir):
            fp = os.path.join(backup_dir, f)
            if os.path.isfile(fp) and (f.endswith('.sql') or f.endswith('.sql.gz') or f.endswith('.zip') or f.endswith('.tar.gz')):
                stat = os.stat(fp)
                files.append({
                    'filename': f,
                    'size_bytes': stat.st_size,
                    'size_mb': round(stat.st_size / (1024 * 1024), 2),
                    'created_at': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    'type': 'database' if 'db_' in f or f.endswith('.sql') or f.endswith('.sql.gz') else 'media'
                })
    
    files.sort(key=lambda x: x['created_at'], reverse=True)
    return jsonify({
        'success': True,
        'backups': files
    }), 200

@admin_bp.route('/backups/create', methods=['POST'])
@token_required
@admin_required
def create_backup(current_user):
    backup_dir = get_backup_dir()
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    created_files = []
    errors = []

    # 1. Backup Database
    db_filename = f"db_backup_{timestamp}.sql"
    db_path = os.path.join(backup_dir, db_filename)
    
    db_host = os.getenv('POSTGRES_HOST', 'postgres')
    db_port = os.getenv('POSTGRES_PORT', '5432')
    db_user = os.getenv('POSTGRES_USER', 'gallery_user')
    db_password = os.getenv('POSTGRES_PASSWORD', 'gallery_secret')
    db_name = os.getenv('POSTGRES_DB', 'gallery_db')

    try:
        env = os.environ.copy()
        env['PGPASSWORD'] = db_password
        cmd = ['pg_dump', '-h', db_host, '-p', str(db_port), '-U', db_user, '-d', db_name, '-f', db_path]
        proc = subprocess.run(cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
        if proc.returncode == 0 and os.path.exists(db_path):
            created_files.append(db_filename)
        else:
            errors.append(f"pg_dump error: {proc.stderr.decode('utf-8', errors='ignore')}")
    except Exception as e:
        errors.append(f"DB backup exception: {str(e)}")

    # 2. Backup Media Files
    media_filename = f"media_backup_{timestamp}.zip"
    media_path = os.path.join(backup_dir, media_filename)
    
    try:
        base_dir = current_app.config.get('BASE_DIR', '/app')
        uploads_root = os.path.join(base_dir, 'uploads')
        if not os.path.exists(uploads_root):
            uploads_root = '/app/uploads'

        with zipfile.ZipFile(media_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            if os.path.exists(uploads_root):
                for root, dirs, files in os.walk(uploads_root):
                    for file in files:
                        file_full = os.path.join(root, file)
                        rel_path = os.path.relpath(file_full, uploads_root)
                        zipf.write(file_full, arcname=rel_path)
        created_files.append(media_filename)
    except Exception as e:
        errors.append(f"Media backup exception: {str(e)}")

    log_activity(current_user.id, 'BACKUP_CREATE', f"Tạo bản sao lưu hệ thống: {', '.join(created_files)}")

    return jsonify({
        'success': len(created_files) > 0,
        'message': f"Đã tạo thành công {len(created_files)} bản sao lưu!" if created_files else "Không thể tạo bản sao lưu",
        'created_files': created_files,
        'errors': errors
    }), (200 if created_files else 500)

@admin_bp.route('/backups/download/<path:filename>', methods=['GET'])
@token_required
@admin_required
def download_backup(current_user, filename):
    safe_filename = os.path.basename(filename)
    backup_dir = get_backup_dir()
    file_path = os.path.join(backup_dir, safe_filename)
    if not os.path.exists(file_path):
        return jsonify({'success': False, 'message': 'Không tìm thấy tệp sao lưu'}), 404
    return send_from_directory(backup_dir, safe_filename, as_attachment=True)

@admin_bp.route('/backups/<path:filename>', methods=['DELETE'])
@token_required
@admin_required
def delete_backup(current_user, filename):
    safe_filename = os.path.basename(filename)
    backup_dir = get_backup_dir()
    file_path = os.path.join(backup_dir, safe_filename)
    if not os.path.exists(file_path):
        return jsonify({'success': False, 'message': 'Không tìm thấy tệp sao lưu'}), 404
    try:
        os.remove(file_path)
        log_activity(current_user.id, 'BACKUP_DELETE', f"Xóa bản sao lưu {safe_filename}")
        return jsonify({'success': True, 'message': f'Đã xóa tệp sao lưu {safe_filename}'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Lỗi khi xóa tệp: {str(e)}'}), 500

