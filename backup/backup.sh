#!/bin/bash
# ==============================================================================
# PhotoVault Linux/macOS Backup Script (Docker Volume Aware)
# ==============================================================================

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$(dirname "$0")/archives"
mkdir -p "$BACKUP_DIR"

DB_CONTAINER="gallery_postgres"
DB_USER=${POSTGRES_USER:-"gallery_user"}
DB_NAME=${POSTGRES_DB:-"gallery_db"}

echo "=========================================="
echo " Starting PhotoVault Backup: $TIMESTAMP"
echo "=========================================="

# 1. Backup PostgreSQL Database
DB_BACKUP_FILE="$BACKUP_DIR/db_backup_${TIMESTAMP}.sql"
echo "[1/2] Backing up PostgreSQL database ($DB_NAME)..."
docker compose exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" > "$DB_BACKUP_FILE"
gzip -f "$DB_BACKUP_FILE"
echo "✓ Database backup saved to: ${DB_BACKUP_FILE}.gz"

# 2. Backup Uploaded Media Files directly from Container
MEDIA_BACKUP_FILE="$BACKUP_DIR/media_backup_${TIMESTAMP}.tar.gz"
echo "[2/2] Backing up media uploads from container..."
docker compose exec -T backend tar -czf - -C /app uploads > "$MEDIA_BACKUP_FILE" 2>/dev/null || {
    echo "! Fallback copying from container..."
    docker cp gallery_backend:/app/uploads "$BACKUP_DIR/temp_uploads"
    tar -czf "$MEDIA_BACKUP_FILE" -C "$BACKUP_DIR" temp_uploads
    rm -rf "$BACKUP_DIR/temp_uploads"
}
echo "✓ Media backup saved to: $MEDIA_BACKUP_FILE"

# 3. Clean up old backups (keep last 7 days)
echo "Cleaning up backups older than 7 days..."
find "$BACKUP_DIR" -type f -name "*.gz" -mtime +7 -delete 2>/dev/null || true

echo "=========================================="
echo " Backup Completed Successfully!"
echo " Archives: $BACKUP_DIR"
echo "=========================================="
