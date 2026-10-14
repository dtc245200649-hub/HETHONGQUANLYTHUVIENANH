from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100))
    avatar = db.Column(db.String(255))
    role = db.Column(db.String(20), default='user')  # 'admin' or 'user'
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    images = db.relationship('Image', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    albums = db.relationship('Album', backref='owner', lazy='dynamic', cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_private=False):
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name or self.username,
            'avatar': self.avatar or f"https://api.dicebear.com/7.x/identicon/svg?seed={self.username}",
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'image_count': self.images.count(),
            'album_count': self.albums.count()
        }
        if include_private:
            data['is_admin'] = (self.role == 'admin')
        return data
