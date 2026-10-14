from datetime import datetime
from app import db
from app.models.tag import image_tags, Tag

class Image(db.Model):
    __tablename__ = 'images'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)  # in bytes
    mime_type = db.Column(db.String(50), nullable=False)
    width = db.Column(db.Integer, default=0)
    height = db.Column(db.Integer, default=0)
    is_public = db.Column(db.Boolean, default=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    album_id = db.Column(db.Integer, db.ForeignKey('albums.id', ondelete='SET NULL'), nullable=True, index=True)
    view_count = db.Column(db.Integer, default=0)
    download_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tags = db.relationship('Tag', secondary=image_tags, backref=db.backref('images', lazy='dynamic'))

    def format_size(self):
        bytes_val = self.file_size
        if bytes_val < 1024:
            return f"{bytes_val} B"
        elif bytes_val < 1024 * 1024:
            return f"{bytes_val / 1024:.1f} KB"
        else:
            return f"{bytes_val / (1024 * 1024):.2f} MB"

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'file_url': f"/api/images/{self.id}/file",
            'file_size': self.file_size,
            'file_size_formatted': self.format_size(),
            'mime_type': self.mime_type,
            'width': self.width,
            'height': self.height,
            'resolution': f"{self.width}x{self.height}" if self.width and self.height else "N/A",
            'is_public': self.is_public,
            'user_id': self.user_id,
            'author': self.author.username if self.author else 'Unknown',
            'author_name': self.author.full_name if self.author else 'Unknown',
            'author_avatar': self.author.avatar if self.author else None,
            'album_id': self.album_id,
            'album_title': self.album.title if self.album else None,
            'tags': [t.name for t in self.tags],
            'view_count': self.view_count,
            'download_count': self.download_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
