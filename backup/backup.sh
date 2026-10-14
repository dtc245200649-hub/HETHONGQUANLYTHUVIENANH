#!/bin/bash
# ==============================================================================
# Photo Gallery Backup Script (Database & Media Files)
# ==============================================================================

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$(dirname "$0")/archives"
mkdir -p "$BACKUP_DIR"

DB_CONTAINER="gallery_postgres"
DB_USER=${POSTGRES_USER:-"gallery_user"}
DB_NAME=${POSTGRES_DB:-"gallery_db"}
MEDIA_DIR="./backend/uploads"

echo "=========================================="
echo " Starting Gallery System Backup: $TIMESTAMP"
echo "=========================================="

# 1. Backup PostgreSQL Database
DB_BACKUP_FILE="$BACKUP_DIR/db_backup_${TIMESTAMP}.sql"
echo "[1/2] Backing up PostgreSQL database ($DB_NAME)..."
docker compose exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" > "$DB_BACKUP_FILE"

# Compress database dump
gzip "$DB_BACKUP_FILE"
echo "✓ Database backup saved to: ${DB_BACKUP_FILE}.gz"

# 2. Backup Uploaded Media Files
MEDIA_BACKUP_FILE="$BACKUP_DIR/media_backup_${TIMESTAMP}.tar.gz"
echo "[2/2] Backing up uploaded photos directory..."
if [ -d "$MEDIA_DIR" ]; then
    tar -czf "$MEDIA_BACKUP_FILE" -C "./backend" uploads
    echo "✓ Media backup saved to: $MEDIA_BACKUP_FILE"
else
    echo "! Warning: Media directory not found, skipping media archive."
fi

# 3. Clean up old backups (keep last 7 days)
echo "Cleaning up backups older than 7 days..."
find "$BACKUP_DIR" -type f -name "*.gz" -mtime +7 -delete

echo "=========================================="
echo " Backup Completed Successfully!"
echo " Directory: $BACKUP_DIR"
echo "=========================================="
