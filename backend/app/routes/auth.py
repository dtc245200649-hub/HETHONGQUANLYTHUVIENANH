from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.log import SystemLog

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    full_name = data.get('full_name', '').strip()

    if not username or not email or not password:
        return jsonify({'error': 'Vui lòng cung cấp đầy đủ tên đăng nhập, email và mật khẩu'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Tên đăng nhập đã tồn tại'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email đã được sử dụng'}), 400

    # First user registered can be automatically admin if no users exist
    is_first = User.query.count() == 0
    role = 'admin' if is_first else 'user'

    user = User(
        username=username,
        email=email,
        full_name=full_name or username,
        role=role
    )
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    # Log action
    log = SystemLog(action='USER_REGISTER', description=f'Đăng ký tài khoản: {username}', user_id=user.id)
    db.session.add(log)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({
        'message': 'Đăng ký thành công',
        'token': token,
        'user': user.to_dict(include_private=True)
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': 'Vui lòng điền tên đăng nhập và mật khẩu'}), 400

    user = User.query.filter((User.username == username) | (User.email == username)).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Tên đăng nhập hoặc mật khẩu không chính xác'}), 401

    if not user.is_active:
        return jsonify({'error': 'Tài khoản của bạn đã bị khóa bởi Quản trị viên'}), 403

    token = create_access_token(identity=str(user.id))

    # Log action
    log = SystemLog(action='USER_LOGIN', description=f'Đăng nhập: {user.username}', user_id=user.id)
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'message': 'Đăng nhập thành công',
        'token': token,
        'user': user.to_dict(include_private=True)
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Không tìm thấy người dùng'}), 404
    return jsonify({'user': user.to_dict(include_private=True)}), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Không tìm thấy người dùng'}), 404

    data = request.get_json() or {}
    if 'full_name' in data:
        user.full_name = data['full_name'].strip()
    if 'email' in data:
        new_email = data['email'].strip().lower()
        if new_email != user.email:
            if User.query.filter_by(email=new_email).first():
                return jsonify({'error': 'Email đã được sử dụng'}), 400
            user.email = new_email
    if 'avatar' in data:
        user.avatar = data['avatar']

    db.session.commit()
    return jsonify({'message': 'Cập nhật thông tin thành công', 'user': user.to_dict(include_private=True)}), 200

@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Không tìm thấy người dùng'}), 404

    data = request.get_json() or {}
    old_password = data.get('old_password', '')
    new_password = data.get('new_password', '')

    if not user.check_password(old_password):
        return jsonify({'error': 'Mật khẩu hiện tại không đúng'}), 400

    if len(new_password) < 6:
        return jsonify({'error': 'Mật khẩu mới phải có ít nhất 6 ký tự'}), 400

    user.set_password(new_password)
    db.session.commit()
    return jsonify({'message': 'Đổi mật khẩu thành công'}), 200
