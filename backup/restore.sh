#!/bin/bash
# ==============================================================================
# SCRIPT PHỤC HỒI DỮ LIỆU TỪ BẢN SAO LƯU (POSTGRESQL + UPLOADS)
# Cách dùng: ./restore.sh <tên_file_hoặc_đường_dẫn_tar.gz>
# ==============================================================================
set -e

if [ -z "$1" ]; then
    echo "[ERROR] Vui lòng chỉ định file sao lưu cần phục hồi!"
    echo "Ví dụ: ./restore.sh /backups/gallery_backup_20261014_120000.tar.gz"
    exit 1
fi

BACKUP_FILE="$1"
RESTORE_TMP="/tmp/restore_$(date +%s)"

echo "[INFO] Đang giải nén bản sao lưu: ${BACKUP_FILE}..."
mkdir -p "${RESTORE_TMP}"
tar -xzf "${BACKUP_FILE}" -C "${RESTORE_TMP}"

EXTRACTED_DIR=$(find "${RESTORE_TMP}" -mindepth 1 -maxdepth 1 -type d | head -n 1)

# 1. Phục hồi cơ sở dữ liệu
if [ -f "${EXTRACTED_DIR}/database.dump" ]; then
    echo "[INFO] Đang phục hồi cơ sở dữ liệu PostgreSQL..."
    PGPASSWORD="${POSTGRES_PASSWORD}" pg_restore \
        -h "${POSTGRES_HOST:-postgres}" \
        -p "${POSTGRES_PORT:-5432}" \
        -U "${POSTGRES_USER:-gallery_user}" \
        -d "${POSTGRES_DB:-gallery_db}" \
        --clean --if-exists -v "${EXTRACTED_DIR}/database.dump" || true
fi

# 2. Phục hồi uploads
if [ -d "${EXTRACTED_DIR}/uploads" ]; then
    echo "[INFO] Đang phục hồi thư mục ảnh uploads..."
    mkdir -p /app/uploads
    cp -r "${EXTRACTED_DIR}/uploads/"* /app/uploads/ 2>/dev/null || true
fi

rm -rf "${RESTORE_TMP}"
echo "[SUCCESS] Phục hồi toàn bộ hệ thống từ ${BACKUP_FILE} hoàn tất thành công!"
