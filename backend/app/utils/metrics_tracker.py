import os
import time
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from flask import request

# Prometheus Metrics Definitions
HTTP_REQUESTS_TOTAL = Counter(
    'http_requests_total',
    'Total count of HTTP requests processed',
    ['method', 'endpoint', 'status_code']
)

HTTP_REQUEST_DURATION_SECONDS = Histogram(
    'http_request_duration_seconds',
    'Histogram of HTTP request processing duration in seconds',
    ['method', 'endpoint']
)

PHOTO_UPLOADS_TOTAL = Counter(
    'gallery_photo_uploads_total',
    'Total count of photo uploads',
    ['status']
)

PHOTO_DOWNLOADS_TOTAL = Counter(
    'gallery_photo_downloads_total',
    'Total count of photo downloads'
)

PHOTOS_COUNT_GAUGE = Gauge(
    'gallery_photos_total_count',
    'Current number of photos stored in the database'
)

USERS_COUNT_GAUGE = Gauge(
    'gallery_users_total_count',
    'Current number of registered users in the database'
)

STORAGE_BYTES_GAUGE = Gauge(
    'gallery_storage_used_bytes',
    'Total bytes of disk storage used by uploaded photos'
)

def track_request_start():
    request._prometheus_start_time = time.time()

def track_request_end(response):
    if hasattr(request, '_prometheus_start_time'):
        latency = time.time() - request._prometheus_start_time
        endpoint = request.endpoint or 'unknown'
        method = request.method
        status = str(response.status_code)
        
        HTTP_REQUESTS_TOTAL.labels(method=method, endpoint=endpoint, status_code=status).inc()
        HTTP_REQUEST_DURATION_SECONDS.labels(method=method, endpoint=endpoint).observe(latency)
    return response

def update_system_gauges(db_session, user_model, photo_model, upload_folder):
    try:
        users_count = db_session.query(user_model).count()
        USERS_COUNT_GAUGE.set(users_count)
        
        photos_count = db_session.query(photo_model).count()
        PHOTOS_COUNT_GAUGE.set(photos_count)

        # Calculate upload folder size
        total_size = 0
        if os.path.exists(upload_folder):
            for dirpath, dirnames, filenames in os.walk(upload_folder):
                for f in filenames:
                    fp = os.path.join(dirpath, f)
                    if os.path.exists(fp):
                        total_size += os.path.getsize(fp)
        STORAGE_BYTES_GAUGE.set(total_size)
    except Exception as e:
        print(f"Error updating Prometheus gauges: {e}")
