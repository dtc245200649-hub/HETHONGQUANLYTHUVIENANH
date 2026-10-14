from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
import bcrypt

db = SQLAlchemy()

# Association table for many-to-many relationship between Photo and Tag
photo_tags = db.Table(
    'photo_tags',
    db.Column('photo_id', db.Integer, db.ForeignKey('photos.id', ondelete='CASCADE'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user', nullable=False)  # 'admin' or 'user'
    full_name = db.Column(db.String(120), default='')
    avatar_url = db.Column(db.String(255), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    photos = db.relationship('Photo', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    albums = db.relationship('Album', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    logs = db.relationship('SystemLog', backref='user', lazy='dynamic')

    def set_password(self, password):
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, password):
        if not self.password_hash:
            return False
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'full_name': self.full_name or self.username,
            'avatar_url': self.avatar_url or f"https://api.dicebear.com/7.x/identicon/svg?seed={self.username}",
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'photos_count': self.photos.count() if hasattr(self.photos, 'count') else 0
        }

class Photo(db.Model):
    __tablename__ = 'photos'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False, default='Untitled')
    description = db.Column(db.Text, default='')
    filename = db.Column(db.String(255), nullable=False)
    thumbnail_filename = db.Column(db.String(255), nullable=True)
    file_size = db.Column(db.Integer, default=0) # in bytes
    width = db.Column(db.Integer, default=0)
    height = db.Column(db.Integer, default=0)
    mime_type = db.Column(db.String(50), default='image/jpeg')
    is_public = db.Column(db.Boolean, default=True, index=True)
    is_favorite = db.Column(db.Boolean, default=False)
    views_count = db.Column(db.Integer, default=0)
    downloads_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    album_id = db.Column(db.Integer, db.ForeignKey('albums.id', ondelete='SET NULL'), nullable=True, index=True)

    tags = db.relationship('Tag', secondary=photo_tags, backref=db.backref('photos', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'filename': self.filename,
            'url': f"/api/photos/{self.id}/file",
            'thumbnail_url': f"/api/photos/{self.id}/thumbnail" if self.thumbnail_filename else f"/api/photos/{self.id}/file",
            'file_size': self.file_size,
            'width': self.width,
            'height': self.height,
            'mime_type': self.mime_type,
            'is_public': self.is_public,
            'is_favorite': self.is_favorite,
            'views_count': self.views_count,
            'downloads_count': self.downloads_count,
            'user_id': self.user_id,
            'author_name': self.author.full_name or self.author.username if self.author else 'Unknown',
            'album_id': self.album_id,
            'album_name': self.album.name if self.album else None,
            'tags': [t.name for t in self.tags],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Album(db.Model):
    __tablename__ = 'albums'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, default='')
    is_public = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    cover_image_url = db.Column(db.String(255), default='')

    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    photos = db.relationship('Photo', backref='album', lazy='dynamic')

    def to_dict(self):
        # find cover photo url if not explicitly set
        cover = self.cover_image_url
        if not cover:
            first_photo = self.photos.first()
            if first_photo:
                cover = f"/api/photos/{first_photo.id}/thumbnail"
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_public': self.is_public,
            'cover_image_url': cover,
            'user_id': self.user_id,
            'author_name': self.author.full_name or self.author.username if self.author else 'Unknown',
            'photos_count': self.photos.count() if hasattr(self.photos, 'count') else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Tag(db.Model):
    __tablename__ = 'tags'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'count': self.photos.count() if hasattr(self.photos, 'count') else 0
        }

class SystemLog(db.Model):
    __tablename__ = 'system_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    details = db.Column(db.Text, default='')
    ip_address = db.Column(db.String(50), default='')
    status = db.Column(db.String(20), default='SUCCESS')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else 'Anonymous/System',
            'action': self.action,
            'details': self.details,
            'ip_address': self.ip_address,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
