import os
import sys
import time
from sqlalchemy import text
from app import create_app
from app.models import db
from app.init_db import seed_database

app = create_app(os.getenv('FLASK_ENV', 'development'))

def wait_for_db(max_retries=10, delay=2):
    """Wait for database to be ready (useful when starting with docker compose)"""
    with app.app_context():
        for i in range(max_retries):
            try:
                db.session.execute(text('SELECT 1'))
                print("Database connection verified!")
                return True
            except Exception as e:
                print(f"Waiting for database connection ({i+1}/{max_retries}): {e}")
                time.sleep(delay)
        print("Database connection failed after retries. Continuing anyway...")
        return False

if __name__ == '__main__':
    db_ready = wait_for_db()
    if db_ready:
        seed_database(app)
    else:
        print("WARNING: Could not connect to database. Seeding skipped. If running locally without PostgreSQL, set USE_SQLITE=true in .env")
    
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'true').lower() == 'true'
    print(f"Server starting on http://0.0.0.0:{port}...")
    app.run(host='0.0.0.0', port=port, debug=debug)

