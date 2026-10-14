import os
from flask import Flask, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.config import config

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_name=None):
    if not config_name:
        config_name = os.environ.get('FLASK_ENV', 'default')

    app = Flask(__name__, static_folder='../static')
    app.config.from_object(config.get(config_name, config['default']))

    # Ensure uploads & backups directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['BACKUP_DIR'], exist_ok=True)

    # Initialize CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Test database connectivity and auto-fallback to SQLite if PostgreSQL fails
    db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
    if 'postgresql' in db_uri:
        from sqlalchemy import create_engine
        try:
            test_engine = create_engine(db_uri, connect_args={'connect_timeout': 2})
            with test_engine.connect():
                pass
            print(f"[DATABASE] Connected to PostgreSQL: {db_uri.split('@')[-1]}")
        except Exception as e:
            print(f"[DATABASE NOTICE] Cannot connect to PostgreSQL ({e}).")
            print(f"[DATABASE NOTICE] Automatically switching to local SQLite database for offline/standalone execution.")
            app.config['SQLALCHEMY_DATABASE_URI'] = app.config.get('SQLITE_URL', 'sqlite:///gallery_local.db')

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)

    # JWT error handlers
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return jsonify({'error': 'Yêu cầu mã xác thực Token'}), 401

    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        return jsonify({'error': 'Mã xác thực Token không hợp lệ hoặc đã hết hạn'}), 401

    # Initialize Prometheus Metrics
    from app.services.metrics import init_metrics
    init_metrics(app)

    # Register Blueprints
    from app.routes.auth import auth_bp
    from app.routes.images import images_bp
    from app.routes.albums import albums_bp
    from app.routes.tags import tags_bp
    from app.routes.admin import admin_bp
    from app.routes.backup import backup_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(images_bp, url_prefix='/api/images')
    app.register_blueprint(albums_bp, url_prefix='/api/albums')
    app.register_blueprint(tags_bp, url_prefix='/api/tags')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(backup_bp, url_prefix='/api/admin/backup')

    # Health check endpoint
    @app.route('/health', methods=['GET'])
    @app.route('/api/health', methods=['GET'])
    def health_check():
        db_status = "connected"
        try:
            db.session.execute(db.text('SELECT 1'))
        except Exception as e:
            db_status = f"error: {str(e)}"

        return jsonify({
            'status': 'healthy' if db_status == 'connected' else 'degraded',
            'database': db_status,
            'database_uri': app.config['SQLALCHEMY_DATABASE_URI'].split('@')[-1] if '@' in app.config['SQLALCHEMY_DATABASE_URI'] else 'sqlite',
            'upload_folder': app.config['UPLOAD_FOLDER']
        }), 200

    @app.route('/api', methods=['GET'])
    def api_index():
        return jsonify({
            'name': 'Hệ Thống Thư Viện Ảnh Trực Tuyến API',
            'version': '1.0.0',
            'status': 'running'
        }), 200

    # Ensure tables and seed data exist
    with app.app_context():
        try:
            db.create_all()
            from app.seed import seed_initial_data
            seed_initial_data()
        except Exception as e:
            print(f"[DATABASE NOTICE] Table creation / seed info: {e}")

    # Serve built frontend if dist exists (enables direct 1-port run!)
    frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'dist'))
    if os.path.exists(frontend_dist):
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve_frontend(path):
            if path != "" and os.path.exists(os.path.join(frontend_dist, path)):
                return send_from_directory(frontend_dist, path)
            return send_from_directory(frontend_dist, 'index.html')

    return app
