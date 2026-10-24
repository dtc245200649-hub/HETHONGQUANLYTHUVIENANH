from functools import wraps
from datetime import datetime, timezone
import jwt
from flask import request, jsonify, current_app
from ..models import User, SystemLog, db

def generate_token(user):
    payload = {
        'user_id': user.id,
        'username': user.username,
        'role': user.role,
        'exp': datetime.now(timezone.utc) + current_app.config['JWT_ACCESS_TOKEN_EXPIRES'],
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

def decode_token(token):
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return {'error': 'Token đã hết hạn, vui lòng đăng nhập lại'}
    except jwt.InvalidTokenError:
        return {'error': 'Token không hợp lệ'}
    except Exception as e:
        return {'error': 'Token không hợp lệ hoặc bị lỗi'}

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        token = None
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == 'bearer':
                token = parts[1]
        elif request.args.get('token'):
            token = request.args.get('token')

        if not token:
            return jsonify({'success': False, 'message': 'Thiếu token xác thực!'}), 401
        decoded = decode_token(token)
        if 'error' in decoded:
            return jsonify({'success': False, 'message': decoded['error']}), 401

        current_user = db.session.get(User, decoded['user_id'])
        if not current_user or not current_user.is_active:
            return jsonify({'success': False, 'message': 'Người dùng không tồn tại hoặc đã bị vô hiệu hóa'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

def optional_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        current_user = None
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == 'bearer':
                decoded = decode_token(parts[1])
                if 'user_id' in decoded:
                    current_user = db.session.get(User, decoded['user_id'])
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'admin':
            return jsonify({'success': False, 'message': 'Quyền truy cập bị từ chối. Chỉ dành cho Quản trị viên (Admin)'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

def log_activity(user_id, action, details='', status='SUCCESS'):
    try:
        ip = request.headers.get('X-Forwarded-For', request.remote_addr or '127.0.0.1')
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()
        log = SystemLog(
            user_id=user_id,
            action=action,
            details=details,
            ip_address=ip,
            status=status
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        print(f"Failed to log system activity: {e}")
        db.session.rollback()
