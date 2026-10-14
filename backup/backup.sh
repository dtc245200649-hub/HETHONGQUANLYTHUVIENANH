#!/bin/bash
# ==============================================================================
# SCRIPT TỰ ĐỘNG SAO LƯU CƠ SỞ DỮ LIỆU VÀ TỆP ẢNH (POSTGRESQL + UPLOADS)
# ==============================================================================
set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="gallery_backup_${TIMESTAMP}"
TEMP_DIR="${BACKUP_DIR}/${BACKUP_NAME}"

mkdir -p "${TEMP_DIR}"
mkdir -p "${BACKUP_DIR}"

echo "[INFO] Đang bắt đầu sao lưu hệ thống: ${BACKUP_NAME}..."

# 1. Sao lưu Cơ sở dữ liệu PostgreSQL
echo "[INFO] Đang trích xuất cơ sở dữ liệu PostgreSQL (${POSTGRES_DB})..."
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    -h "${POSTGRES_HOST:-postgres}" \
    -p "${POSTGRES_PORT:-5432}" \
    -U "${POSTGRES_USER:-gallery_user}" \
    -d "${POSTGRES_DB:-gallery_db}" \
    -F c -b -v \
    -f "${TEMP_DIR}/database.dump" || true

# 2. Sao lưu Thư mục ảnh Uploads
echo "[INFO] Đang sao chép thư mục ảnh tải lên..."
if [ -d "/app/uploads" ]; then
    cp -r /app/uploads "${TEMP_DIR}/uploads"
fi

# 3. Nén thành file .tar.gz
echo "[INFO] Đang nén toàn bộ bản sao lưu..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"
rm -rf "${TEMP_DIR}"

echo "[SUCCESS] Bản sao lưu đã hoàn tất thành công: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

# 4. Tự động dọn dẹp các bản sao lưu cũ hơn RETENTION ngày
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
echo "[INFO] Đang dọn dẹp các bản sao lưu cũ hơn ${RETENTION_DAYS} ngày..."
find "${BACKUP_DIR}" -type f -name "gallery_backup_*.tar.gz" -mtime +"${RETENTION_DAYS}" -exec rm {} + 2>/dev/null || true
echo "[INFO] Hoàn thành quy trình sao lưu!"
