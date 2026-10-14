import os
from datetime import timedelta
from dotenv import load_dotenv

# Load root .env file if present
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
env_path = os.path.join(root_dir, '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'gallery_super_secret_key_prod_2026_xyz')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt_super_secret_key_gallery_2026_abc')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)

    # File uploads
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', os.path.join(BASE_DIR, 'uploads'))
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 32 * 1024 * 1024)) # 32 MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'}

    # Backups directory
    BACKUP_DIR = os.environ.get('BACKUP_DIR', os.path.join(root_dir, 'backups'))

    # Database resolution:
    # Priority:
    # 1. DATABASE_URL (if configured, e.g. postgresql://...)
    # 2. Local fallback sqlite
    pg_user = os.environ.get('POSTGRES_USER', 'gallery_user')
    pg_pass = os.environ.get('POSTGRES_PASSWORD', 'gallery_secure_pass_2026')
    pg_host = os.environ.get('POSTGRES_HOST', 'localhost')
    pg_port = os.environ.get('POSTGRES_PORT', '5432')
    pg_db = os.environ.get('POSTGRES_DB', 'gallery_db')

    # Default to DATABASE_URL or construct postgres url
    default_db_url = os.environ.get(
        'DATABASE_URL', 
        f"postgresql://{pg_user}:{pg_pass}@{pg_host}:{pg_port}/{pg_db}"
    )

    # Local SQLite fallback path
    sqlite_db_path = os.path.join(BASE_DIR, 'gallery_local.db')
    SQLITE_URL = f"sqlite:///{sqlite_db_path.replace(os.sep, '/')}"

    # Set SQLALCHEMY_DATABASE_URI
    # If explicitly set to SQLite or running standalone without postgres:
    if os.environ.get('USE_SQLITE', 'false').lower() in ('true', '1', 'yes'):
        SQLALCHEMY_DATABASE_URI = SQLITE_URL
    else:
        SQLALCHEMY_DATABASE_URI = default_db_url

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = ['*']

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
