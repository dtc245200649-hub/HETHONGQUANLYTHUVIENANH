from flask import Blueprint, Response, current_app
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from ..models import db, User, Photo
from ..utils.metrics_tracker import update_system_gauges

metrics_bp = Blueprint('metrics', __name__)

@metrics_bp.route('/metrics', methods=['GET'])
def prometheus_metrics():
    # Update latest live gauge counts
    upload_folder = current_app.config['UPLOAD_FOLDER']
    update_system_gauges(db.session, User, Photo, upload_folder)
    
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)
