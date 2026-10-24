#!/bin/bash
# ==============================================================================
# PhotoVault Linux/macOS Restore Script
# Usage: ./restore.sh <path_to_db_sql_gz> [path_to_media_tar_gz]
# ==============================================================================

set -e

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <path_to_db_backup.sql.gz> [path_to_media_backup.tar.gz]"
    exit 1
fi

DB_FILE="$1"
MEDIA_FILE="$2"
DB_USER=${POSTGRES_USER:-"gallery_user"}
DB_NAME=${POSTGRES_DB:-"gallery_db"}

echo "=========================================="
echo " Starting PhotoVault Restore"
echo "=========================================="

echo "[1] Restoring database from $DB_FILE..."
if [[ "$DB_FILE" == *.gz ]]; then
    gunzip -c "$DB_FILE" | docker compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME"
else
    cat "$DB_FILE" | docker compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME"
fi
echo "✓ Database restore completed."

if [ -n "$MEDIA_FILE" ] && [ -f "$MEDIA_FILE" ]; then
    echo "[2] Restoring media files into container from $MEDIA_FILE..."
    cat "$MEDIA_FILE" | docker compose exec -T backend tar -xzf - -C /app
    echo "✓ Media restore completed."
fi

echo "=========================================="
echo " Restore Completed Successfully!"
echo "=========================================="
