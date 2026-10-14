# Quy Trình Sao Lưu & Phục Hồi Dữ Liệu (Backup & Restore Guide)

Tài liệu hướng dẫn quản trị cơ sở dữ liệu và dữ liệu tập tin hình ảnh cho hệ thống PhotoVault Gallery.

---

## 1. Thành Phần Dữ Liệu Cần Sao Lưu

Hệ thống lưu trữ 2 loại dữ liệu quan trọng:
1. **Cơ sở dữ liệu PostgreSQL (`gallery_db`)**: Chứa thông tin người dùng, quyền hạn, metadata hình ảnh (tiêu đề, độ phân giải, kích thước), album, thẻ tags và nhật ký hệ thống.
2. **Thư mục tập tin media (`backend/uploads/`)**: Chứa toàn bộ file ảnh gốc và ảnh thu nhỏ WebP tối ưu.

---

## 2. Kịch Bản Sao Lưu Tự Động (Backup)

### Trên Linux / macOS / WSL:
Chạy tập lệnh `backup.sh`:
```bash
chmod +x backup/backup.sh
./backup/backup.sh
```

### Trên Windows:
Nhấp đúp chuột hoặc chạy file `backup.bat` trong command prompt:
```cmd
backup\backup.bat
```

### Kết quả sau khi chạy:
- Tệp `backup/archives/db_backup_<timestamp>.sql.gz`: Bản sao lưu CSDL nén gzip.
- Tệp `backup/archives/media_backup_<timestamp>.tar.gz` (hoặc `.zip` trên Windows): Bản sao lưu toàn bộ ảnh.
- Tự động xóa các bản sao lưu cũ hơn 7 ngày để tối ưu dung lượng đĩa.

---

## 3. Quy Trình Phục Hồi Dữ Liệu (Restore)

Khi hệ thống gặp sự cố hoặc cần chuyển dữ liệu sang máy chủ mới:

### Bước 1: Khởi động container PostgreSQL
```bash
docker compose up -d postgres
```

### Bước 2: Chạy script phục hồi

**Trên Linux / macOS:**
```bash
chmod +x backup/restore.sh
./backup/restore.sh backup/archives/db_backup_<tên_file>.sql.gz backup/archives/media_backup_<tên_file>.tar.gz
```

**Trên Windows:**
```cmd
backup\restore.bat backup\archives\db_backup_<tên_file>.sql
```
Giải nén file `.zip` media vào thư mục `backend/uploads/`.

---

## 4. Thiết Lập Sao Lưu Định Kỳ Tự Động (Cronjob / Task Scheduler)

### Cấu hình Cronjob (Linux):
Mở bảng lịch trình:
```bash
crontab -e
```
Thêm dòng sau để tự động sao lưu lúc **02:00 sáng hàng ngày**:
```bash
0 2 * * * /bin/bash /đường_dẫn_dự_án/backup/backup.sh >> /đường_dẫn_dự_án/backup/backup.log 2>&1
```

### Cấu hình Windows Task Scheduler:
1. Mở `Task Scheduler` trên Windows.
2. Chọn `Create Basic Task...` đặt tên `PhotoVault_Daily_Backup`.
3. Chọn trigger: `Daily` vào `02:00 AM`.
4. Chọn Action: `Start a program`, trỏ đến `d:\HETHONGQUANLYTHUVIENANH\backup\backup.bat`.
