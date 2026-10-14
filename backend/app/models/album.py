from datetime import datetime
from app import db

class Album(db.Model):
    __tablename__ = 'albums'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_public = db.Column(db.Boolean, default=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    cover_image_id = db.Column(db.Integer, db.ForeignKey('images.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    images = db.relationship('Image', foreign_keys='Image.album_id', backref='album', lazy='dynamic')
    cover_image = db.relationship('Image', foreign_keys=[cover_image_id], post_update=True)

    def to_dict(self, include_images=False):
        cover_url = None
        if self.cover_image:
            cover_url = f"/api/images/{self.cover_image.id}/file"
        elif self.images.first():
            cover_url = f"/api/images/{self.images.first().id}/file"

        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'is_public': self.is_public,
            'user_id': self.user_id,
            'author': self.owner.username if self.owner else 'Unknown',
            'author_name': self.owner.full_name if self.owner else 'Unknown',
            'cover_url': cover_url,
            'image_count': self.images.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if include_images:
            data['images'] = [img.to_dict() for img in self.images.order_by(db.desc('created_at')).all()]

        return data
