import re
from flask import Blueprint, request, jsonify
from ..models import db, User
from ..utils.auth_middleware import generate_token, token_required, log_activity

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

EMAIL_REGEX = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    full_name = data.get('full_name', '').strip()

    if not username or len(username) < 3:
        return jsonify({'success': False, 'message': 'Tên đăng nhập phải có ít nhất 3 ký tự'}), 400

    if not email or not re.match(EMAIL_REGEX, email):
        return jsonify({'success': False, 'message': 'Email không đúng định dạng'}), 400

    if not password or len(password) < 6:
        return jsonify({'success': False, 'message': 'Mật khẩu phải chứa ít nhất 6 ký tự'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': 'Tên đăng nhập đã được sử dụng'}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Email đã được đăng ký tài khoản'}), 409

    # Determine role: first registered user is admin, others default to 'user'
    is_first_user = User.query.count() == 0
    role = 'admin' if is_first_user else 'user'

    new_user = User(
        username=username,
        email=email,
        full_name=full_name or username,
        role=role
    )
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    token = generate_token(new_user)
    log_activity(new_user.id, 'USER_REGISTER', f"Tài khoản {username} đăng ký thành công (role: {role})")

    return jsonify({
        'success': True,
        'message': 'Đăng ký tài khoản thành công!',
        'token': token,
        'user': new_user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not identifier or not password:
        return jsonify({'success': False, 'message': 'Vui lòng nhập tên đăng nhập và mật khẩu'}), 400

    user = User.query.filter((User.username == identifier) | (User.email == identifier.lower())).first()

    if not user or not user.check_password(password):
        log_activity(None, 'LOGIN_FAILED', f"Đăng nhập thất bại với tài khoản: {identifier}", status='FAILED')
        return jsonify({'success': False, 'message': 'Tên đăng nhập hoặc mật khẩu không chính xác'}), 401

    if not user.is_active:
        return jsonify({'success': False, 'message': 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'}), 403

    token = generate_token(user)
    log_activity(user.id, 'USER_LOGIN', f"Người dùng {user.username} đăng nhập thành công")

    return jsonify({
        'success': True,
        'message': 'Đăng nhập thành công!',
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({
        'success': True,
        'user': current_user.to_dict()
    }), 200

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json() or {}
    full_name = data.get('full_name')
    avatar_url = data.get('avatar_url')

    if full_name is not None:
        current_user.full_name = full_name.strip()
    if avatar_url is not None:
        current_user.avatar_url = avatar_url.strip()

    db.session.commit()
    log_activity(current_user.id, 'UPDATE_PROFILE', f"Người dùng {current_user.username} cập nhật hồ sơ")

    return jsonify({
        'success': True,
        'message': 'Cập nhật thông tin thành công!',
        'user': current_user.to_dict()
    }), 200

@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    data = request.get_json() or {}
    old_password = data.get('old_password', '')
    new_password = data.get('new_password', '')

    if not current_user.check_password(old_password):
        return jsonify({'success': False, 'message': 'Mật khẩu hiện tại không chính xác'}), 400

    if not new_password or len(new_password) < 6:
        return jsonify({'success': False, 'message': 'Mật khẩu mới phải có ít nhất 6 ký tự'}), 400

    current_user.set_password(new_password)
    db.session.commit()
    log_activity(current_user.id, 'CHANGE_PASSWORD', f"Người dùng {current_user.username} đổi mật khẩu")

    return jsonify({
        'success': True,
        'message': 'Đổi mật khẩu thành công!'
    }), 200
