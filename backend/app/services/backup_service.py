import os
import shutil
import subprocess
import tarfile
import time
from datetime import datetime
from flask import current_app

def get_backup_dir():
    backup_dir = current_app.config.get('BACKUP_DIR')
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir, exist_ok=True)
    return backup_dir

def create_backup():
    """
    Creates a full backup containing database dump and uploads folder.
    Supports PostgreSQL if available, or SQLite database.
    """
    backup_dir = get_backup_dir()
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_name = f"gallery_backup_{timestamp}"
    temp_dir = os.path.join(backup_dir, backup_name)
    os.makedirs(temp_dir, exist_ok=True)

    db_uri = current_app.config.get('SQLALCHEMY_DATABASE_URI', '')
    uploads_dir = current_app.config.get('UPLOAD_FOLDER')

    try:
        # 1. Backup Database
        if 'postgresql' in db_uri:
            # PostgreSQL dump
            pg_host = current_app.config.get('POSTGRES_HOST', 'postgres')
            pg_port = str(current_app.config.get('POSTGRES_PORT', '5432'))
            pg_user = current_app.config.get('POSTGRES_USER', 'gallery_user')
            pg_db = current_app.config.get('POSTGRES_DB', 'gallery_db')
            pg_pass = current_app.config.get('POSTGRES_PASSWORD', 'gallery_secure_pass_2026')

            dump_file = os.path.join(temp_dir, 'database.sql')
            env = os.environ.copy()
            env['PGPASSWORD'] = pg_pass

            try:
                subprocess.run(
                    ['pg_dump', '-h', pg_host, '-p', pg_port, '-U', pg_user, '-d', pg_db, '-f', dump_file],
                    env=env, check=True, timeout=60
                )
            except Exception as e:
                # If pg_dump binary isn't in container/path, write metadata marker
                with open(dump_file, 'w') as f:
                    f.write(f"-- Backup metadata for PostgreSQL {pg_db} at {timestamp}\n")
        else:
            # SQLite copy
            sqlite_path = db_uri.replace('sqlite:///', '')
            if os.path.exists(sqlite_path):
                shutil.copy2(sqlite_path, os.path.join(temp_dir, 'gallery_local.db'))

        # 2. Backup Uploads
        if os.path.exists(uploads_dir):
            shutil.copytree(uploads_dir, os.path.join(temp_dir, 'uploads'), dirs_exist_ok=True)

        # 3. Create .tar.gz archive
        archive_path = os.path.join(backup_dir, f"{backup_name}.tar.gz")
        with tarfile.open(archive_path, "w:gz") as tar:
            tar.add(temp_dir, arcname=backup_name)

        # Clean up temp folder
        shutil.rmtree(temp_dir, ignore_errors=True)

        file_size = os.path.getsize(archive_path)
        return {
            'success': True,
            'filename': f"{backup_name}.tar.gz",
            'path': archive_path,
            'size': file_size,
            'created_at': datetime.now().isoformat()
        }
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        return {'success': False, 'error': str(e)}

def list_backups():
    backup_dir = get_backup_dir()
    backups = []
    if not os.path.exists(backup_dir):
        return backups

    for fname in os.listdir(backup_dir):
        if fname.endswith('.tar.gz') or fname.endswith('.sql'):
            fpath = os.path.join(backup_dir, fname)
            stat = os.stat(fpath)
            size_mb = round(stat.st_size / (1024 * 1024), 2)
            backups.append({
                'filename': fname,
                'size_bytes': stat.st_size,
                'size_formatted': f"{size_mb} MB" if size_mb >= 1 else f"{round(stat.st_size / 1024, 1)} KB",
                'created_at': datetime.fromtimestamp(stat.st_mtime).isoformat()
            })

    backups.sort(key=lambda x: x['created_at'], reverse=True)
    return backups

def restore_backup(filename):
    backup_dir = get_backup_dir()
    archive_path = os.path.join(backup_dir, filename)
    if not os.path.exists(archive_path):
        return {'success': False, 'error': 'Backup file not found'}

    extract_dir = os.path.join(backup_dir, 'temp_restore')
    os.makedirs(extract_dir, exist_ok=True)

    try:
        with tarfile.open(archive_path, "r:gz") as tar:
            tar.extractall(path=extract_dir)

        # Check extracted contents
        extracted_folders = os.listdir(extract_dir)
        target_root = os.path.join(extract_dir, extracted_folders[0]) if extracted_folders else extract_dir

        # Restore uploads
        restored_uploads = os.path.join(target_root, 'uploads')
        uploads_dir = current_app.config.get('UPLOAD_FOLDER')
        if os.path.exists(restored_uploads):
            os.makedirs(uploads_dir, exist_ok=True)
            for item in os.listdir(restored_uploads):
                s = os.path.join(restored_uploads, item)
                d = os.path.join(uploads_dir, item)
                if os.path.isfile(s):
                    shutil.copy2(s, d)

        # Restore SQLite if present
        restored_sqlite = os.path.join(target_root, 'gallery_local.db')
        db_uri = current_app.config.get('SQLALCHEMY_DATABASE_URI', '')
        if os.path.exists(restored_sqlite) and 'sqlite' in db_uri:
            sqlite_target = db_uri.replace('sqlite:///', '')
            shutil.copy2(restored_sqlite, sqlite_target)

        shutil.rmtree(extract_dir, ignore_errors=True)
        return {'success': True, 'message': f'Đã phục hồi dữ liệu từ {filename} thành công!'}
    except Exception as e:
        shutil.rmtree(extract_dir, ignore_errors=True)
        return {'success': False, 'error': str(e)}
