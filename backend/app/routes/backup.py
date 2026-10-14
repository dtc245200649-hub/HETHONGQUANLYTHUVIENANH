import os
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import get_jwt_identity
from app.routes.admin import admin_required
from app.services.backup_service import create_backup, list_backups, restore_backup, get_backup_dir
from app.models.log import SystemLog
from app import db

backup_bp = Blueprint('backup', __name__)

@backup_bp.route('/create', methods=['POST'])
@admin_required
def trigger_backup():
    user_id = int(get_jwt_identity())
    result = create_backup()

    if result.get('success'):
        log = SystemLog(
            action='DATABASE_BACKUP',
            description=f'Tạo bản sao lưu hệ thống: {result.get("filename")}',
            user_id=user_id
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({'message': 'Sao lưu cơ sở dữ liệu và tệp thành công!', 'backup': result}), 201
    else:
        return jsonify({'error': result.get('error', 'Lỗi khi tạo bản sao lưu')}), 500

@backup_bp.route('/list', methods=['GET'])
@admin_required
def get_backup_list():
    backups = list_backups()
    return jsonify({'backups': backups}), 200

@backup_bp.route('/download/<filename>', methods=['GET'])
@admin_required
def download_backup_file(filename):
    backup_dir = get_backup_dir()
    safe_filename = os.path.basename(filename)
    filepath = os.path.join(backup_dir, safe_filename)

    if not os.path.exists(filepath):
        return jsonify({'error': 'Tệp sao lưu không tồn tại'}), 404

    return send_file(filepath, as_attachment=True, download_name=safe_filename)

@backup_bp.route('/restore', methods=['POST'])
@admin_required
def trigger_restore():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    filename = data.get('filename')

    if not filename:
        return jsonify({'error': 'Vui lòng chỉ định tệp sao lưu cần phục hồi'}), 400

    result = restore_backup(os.path.basename(filename))

    if result.get('success'):
        log = SystemLog(
            action='DATABASE_RESTORE',
            description=f'Phục hồi hệ thống từ bản sao lưu: {filename}',
            user_id=user_id
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({'message': result.get('message')}), 200
    else:
        return jsonify({'error': result.get('error', 'Lỗi khi phục hồi')}), 500
