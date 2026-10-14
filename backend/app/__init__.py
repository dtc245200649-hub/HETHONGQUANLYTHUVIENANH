import os
from flask import Flask, jsonify
from flask_cors import CORS
from .config import config_by_name
from .models import db
from .routes.auth import auth_bp
from .routes.photos import photos_bp
from .routes.albums import albums_bp
from .routes.admin import admin_bp
from .routes.metrics import metrics_bp
from .utils.metrics_tracker import track_request_start, track_request_end

def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'default')

    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name['default']))

    # Setup CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize extensions
    db.init_app(app)

    # Ensure uploads folders exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['THUMBNAIL_FOLDER'], exist_ok=True)

    # Register Prometheus request trackers
    app.before_request(track_request_start)
    app.after_request(track_request_end)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(photos_bp)
    app.register_blueprint(albums_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(metrics_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'photo-gallery-api',
            'version': '1.0.0'
        }), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'success': False, 'message': 'Không tìm thấy tài nguyên yêu cầu (404)'}), 404

    @app.errorhandler(413)
    def request_entity_too_large(e):
        return jsonify({'success': False, 'message': 'Kích thước tập tin quá lớn (Tối đa 30MB)'}), 413

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'success': False, 'message': 'Lỗi máy chủ nội bộ (500)'}), 500

    return app
