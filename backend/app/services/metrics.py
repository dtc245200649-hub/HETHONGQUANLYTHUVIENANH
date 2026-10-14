import time
from flask import request, Response
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

# Prometheus Metrics Definitions
HTTP_REQUESTS_TOTAL = Counter(
    'gallery_http_requests_total',
    'Total HTTP requests processed by Gallery backend',
    ['method', 'endpoint', 'status']
)

HTTP_REQUEST_DURATION_SECONDS = Histogram(
    'gallery_http_request_duration_seconds',
    'HTTP request latency in seconds',
    ['method', 'endpoint'],
    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0)
)

TOTAL_IMAGES_GAUGE = Gauge(
    'gallery_images_total',
    'Total number of images stored in the gallery'
)

TOTAL_USERS_GAUGE = Gauge(
    'gallery_users_total',
    'Total number of registered users'
)

TOTAL_STORAGE_BYTES_GAUGE = Gauge(
    'gallery_storage_bytes_total',
    'Total storage used for images in bytes'
)

def init_metrics(app):
    @app.before_request
    def start_timer():
        request._prometheus_start_time = time.time()

    @app.after_request
    def record_metrics(response):
        if hasattr(request, '_prometheus_start_time'):
            resp_time = time.time() - request._prometheus_start_time
            endpoint = request.endpoint or 'unknown'
            HTTP_REQUEST_DURATION_SECONDS.labels(
                method=request.method,
                endpoint=endpoint
            ).observe(resp_time)

            HTTP_REQUESTS_TOTAL.labels(
                method=request.method,
                endpoint=endpoint,
                status=response.status_code
            ).inc()
        return response

    @app.route('/metrics', methods=['GET'])
    def metrics():
        from app.models.image import Image
        from app.models.user import User
        from app import db
        from sqlalchemy import func

        try:
            total_imgs = Image.query.count()
            TOTAL_IMAGES_GAUGE.set(total_imgs)

            total_usrs = User.query.count()
            TOTAL_USERS_GAUGE.set(total_usrs)

            storage_sum = db.session.query(func.sum(Image.file_size)).scalar() or 0
            TOTAL_STORAGE_BYTES_GAUGE.set(storage_sum)
        except Exception:
            pass

        return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)
