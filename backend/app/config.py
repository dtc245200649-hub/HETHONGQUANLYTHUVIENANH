import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'photo-gallery-super-secret-key-change-in-production')
    
    # Database config: prefer Postgres if provided, fallback to sqlite for standalone testing
    DB_USER = os.getenv('POSTGRES_USER', 'gallery_user')
    DB_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'gallery_secret')
    DB_HOST = os.getenv('POSTGRES_HOST', 'localhost')
    DB_PORT = os.getenv('POSTGRES_PORT', '5432')
    DB_NAME = os.getenv('POSTGRES_DB', 'gallery_db')
    
    DATABASE_URL = os.getenv('DATABASE_URL')
    if DATABASE_URL:
        SQLALCHEMY_DATABASE_URI = DATABASE_URL
    elif os.getenv('USE_SQLITE', 'false').lower() == 'true':
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'gallery.db')}"
    else:
        SQLALCHEMY_DATABASE_URI = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Uploads settings
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads', 'originals')
    THUMBNAIL_FOLDER = os.path.join(BASE_DIR, 'uploads', 'thumbnails')
    MAX_CONTENT_LENGTH = 30 * 1024 * 1024  # 30 MB max
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}

    # JWT Config
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)

    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
