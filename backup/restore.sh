#!/bin/bash
# ==============================================================================
# Photo Gallery Restore Script
# Usage: ./restore.sh <path_to_db_sql_or_gz> <optional_path_to_media_tar_gz>
# ==============================================================================

set -e

DB_BACKUP=$1
MEDIA_BACKUP=$2

DB_USER=${POSTGRES_USER:-"gallery_user"}
DB_NAME=${POSTGRES_DB:-"gallery_db"}

if [ -z "$DB_BACKUP" ]; then
    echo "Usage: $0 <path_to_db_backup.sql[.gz]> [path_to_media_backup.tar.gz]"
    exit 1
fi

echo "=========================================="
echo " Starting System Restore"
echo " Database File: $DB_BACKUP"
echo "=========================================="

# 1. Restore Database
echo "[1/2] Restoring PostgreSQL database..."
if [[ "$DB_BACKUP" == *.gz ]]; then
    gunzip -c "$DB_BACKUP" | docker compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME"
else
    cat "$DB_BACKUP" | docker compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME"
fi
echo "✓ Database restored successfully!"

# 2. Restore Media Files (if provided)
if [ -n "$MEDIA_BACKUP" ] && [ -f "$MEDIA_BACKUP" ]; then
    echo "[2/2] Restoring media files..."
    tar -xzf "$MEDIA_BACKUP" -C "./backend"
    echo "✓ Media files restored successfully!"
fi

echo "=========================================="
echo " System Restore Completed Successfully!"
echo "=========================================="
