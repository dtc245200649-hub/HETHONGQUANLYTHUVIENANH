from flask import Blueprint, jsonify
from app import db
from app.models.tag import Tag, image_tags
from sqlalchemy import func

tags_bp = Blueprint('tags', __name__)

@tags_bp.route('', methods=['GET'])
def list_tags():
    # Return tags ordered by image count descending
    results = db.session.query(
        Tag.id,
        Tag.name,
        func.count(image_tags.c.image_id).label('count')
    ).outerjoin(image_tags, Tag.id == image_tags.c.tag_id)\
     .group_by(Tag.id, Tag.name)\
     .order_by(func.count(image_tags.c.image_id).desc(), Tag.name.asc())\
     .all()

    tag_list = [{'id': r[0], 'name': r[1], 'count': r[2]} for r in results]
    return jsonify({'tags': tag_list}), 200
