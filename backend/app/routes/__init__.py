from app.routes.auth import auth_bp
from app.routes.images import images_bp
from app.routes.albums import albums_bp
from app.routes.tags import tags_bp
from app.routes.admin import admin_bp
from app.routes.backup import backup_bp

__all__ = ['auth_bp', 'images_bp', 'albums_bp', 'tags_bp', 'admin_bp', 'backup_bp']
