# HỆ THỐNG THƯ VIỆN ẢNH TRỰC TUYẾN (ONLINE GALLERY SYSTEM)

> **Đề tài:** Xây dựng và triển khai hệ thống thư viện ảnh trực tuyến sử dụng Docker, kết hợp quản trị cơ sở dữ liệu, sao lưu và giám sát hệ thống.

---

## 1. Mục Tiêu Dự Án
- **Quản lý ảnh trực tuyến:** Tải lên ảnh (kéo thả, nhiều ảnh), phân loại theo album, gắn nhãn thẻ (tags), đặt chế độ riêng tư/công khai, xem chi tiết kích thước & độ phân giải, tải về ảnh gốc.
- **Phân quyền người dùng (Role-Based Access Control):** 
  - **Admin:** Quản lý người dùng (khóa/mở khóa, cấp quyền, xóa), theo dõi thống kê hệ thống, tạo và phục hồi bản sao lưu, giám sát hiệu năng.
  - **User:** Tải ảnh cá nhân, tạo và quản lý Album, tương tác xem ảnh trong thư viện.
- **Triển khai chuẩn Docker:** Đóng gói toàn bộ các dịch vụ bằng Docker và Docker Compose.
- **Quản trị cơ sở dữ liệu:** Thiết kế cơ sở dữ liệu quan hệ PostgreSQL 16 chuẩn, hỗ trợ tự động khởi tạo và seed dữ liệu.
- **Sao lưu & Phục hồi:** Cơ chế sao lưu toàn diện cả cơ sở dữ liệu và thư mục ảnh tải lên (Uploads), hỗ trợ phục hồi 1-click từ giao diện hoặc script dòng lệnh.
- **Giám sát hệ thống:** Tích hợp Prometheus trích xuất metrics từ Flask API và Grafana hiển thị biểu đồ trực quan hóa.

---

## 2. Công Nghệ Sử Dụng

| Thành phần | Công nghệ | Chi tiết |
| :--- | :--- | :--- |
| **Giao diện người dùng (Frontend)** | React 18 + Vite | Giao diện Dark/Light Glassmorphism, Responsive, 100% Offline (Không phụ thuộc CDN ngoài) |
| **Backend / API** | Python Flask | RESTful API, Flask-SQLAlchemy, Flask-JWT-Extended, Pillow, Prometheus-Client |
| **Cơ sở dữ liệu** | PostgreSQL 16 | Lưu trữ thông tin người dùng, album, ảnh, thẻ tags và audit logs |
| **Máy chủ trung gian** | Nginx Reverse Proxy | Điều hướng request, cân bằng tải, nén gzip và bảo mật |
| **Triển khai (Deployment)** | Docker + Docker Compose | Điều phối 7 dịch vụ độc lập trong cùng mạng nội bộ |
| **Giám sát (Monitoring)** | Prometheus + Grafana | Thu thập số liệu hiệu năng (req/s, latency) và trực quan hóa dashboard |
| **Quản lý mã nguồn** | Git + GitHub | Cấu trúc source code rõ ràng, phân nhánh chuẩn mực |

---

## 3. Cấu Hình Cổng (Đã Tự Động Đổi Tránh Xung Đột)

Do máy chủ có các cổng mặc định đang được hệ thống lắng nghe, các dịch vụ đã được chuyển đổi sang các cổng không xung đột như sau:

| Dịch Vụ | Cổng Mặc Định Cũ | **Cổng Đang Chạy Mới** | Mô Tả & Link Truy Cập |
| :--- | :---: | :---: | :--- |
| **Nginx Web Gateway** | 80 | **8088** | [http://localhost:8088](http://localhost:8088) (Điểm truy cập chính khi chạy Docker) |
| **Frontend Dev** | 5173 | **5173** | [http://localhost:5173](http://localhost:5173) (Khi chạy dev trực tiếp không cần Docker) |
| **Backend API** | 5000 | **5001** | [http://localhost:5001/api](http://localhost:5001/api) (Backend API trực tiếp) |
| **PostgreSQL Host** | 5432 | **5433** | `localhost:5433` (Container 5432 map ra Host 5433) |
| **Grafana Dashboard** | 3000 | **3001** | [http://localhost:3001](http://localhost:3001) (Bảng giám sát trực quan) |
| **Prometheus** | 9090 | **9090** | [http://localhost:9090](http://localhost:9090) (Giao diện truy vấn metrics) |

---

## 4. Hướng Dẫn Chạy Hệ Thống

### Cách 1: Chạy trực tiếp 1-click (KHÔNG CẦN DOCKER & CHẠY ĐƯỢC CẢ OFFLINE)
> 💡 Hệ thống tự động phát hiện kết nối: Nếu PostgreSQL không chạy hoặc không có Internet, backend tự động fallback sang SQLite (`gallery_local.db`), chuẩn bị sẵn tài khoản admin và ảnh mẫu để bạn trải nghiệm ngay lập tức!

1. Nhấp đúp chuột vào file **`run_local.bat`** (hoặc chạy trong PowerShell):
   ```powershell
   .\run_local.ps1
   ```
2. Hệ thống sẽ tự động cài thư viện, khởi động Backend (5001) và Frontend (5173), đồng thời tự mở trình duyệt tại: **[http://localhost:5173](http://localhost:5173)**.

---

### Cách 2: Chạy toàn bộ hệ thống bằng Docker Compose
1. Khởi động Docker Desktop trên máy.
2. Nhấp đúp vào **`start_docker.bat`** hoặc mở terminal gõ:
   ```bash
   docker compose up -d --build
   ```
3. Sau khi khởi động xong:
   - **Giao diện Web Gallery:** [http://localhost:8088](http://localhost:8088)
   - **Backend API:** [http://localhost:5001/api](http://localhost:5001/api)
   - **Giám sát Prometheus:** [http://localhost:9090](http://localhost:9090)
   - **Trực quan hóa Grafana:** [http://localhost:3001](http://localhost:3001)

Để dừng Docker Compose:
```bash
docker compose down
```

---

## 5. Tài Khoản Đăng Nhập Mặc Định

Hệ thống tích hợp sẵn các nút **Đăng Nhập Nhanh 1-Click** ngay trên màn hình đăng nhập:

| Vai Trò | Tên Đăng Nhập | Mật Khẩu | Quyền Hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin` | `Admin@123` | Toàn quyền quản trị user, xem stats, sao lưu, phục hồi, giám sát |
| **Người dùng mẫu (User)** | `user1` | `User@123` | Đăng ảnh, tạo album, xem và tải ảnh |
| **Grafana Dashboard** | `admin` | `admin123` | Quản trị đồ thị giám sát |

---

## 6. Quản Trị Cơ Sở Dữ Liệu, Sao Lưu & Phục Hồi

### Sao lưu & Phục hồi trực tiếp trên Giao Diện (Admin Panel):
1. Đăng nhập bằng tài khoản `admin`.
2. Bấm vào menu **Quản Trị** -> chọn tab **Sao Lưu & Phục Hồi**.
3. Bấm **"Tạo Bản Sao Lưu Ngay"**: Hệ thống sẽ đóng gói cơ sở dữ liệu và toàn bộ ảnh tải lên thành file `.tar.gz` lưu trữ an toàn trong thư mục `backups/`.
4. Danh sách các bản sao lưu có sẵn nút **"Tải Về"** để lưu về máy cá nhân hoặc **"Phục Hồi"** để rollback dữ liệu khi cần!

### Sao lưu bằng dòng lệnh (Scripts):
- **Trên Windows (PowerShell):**
  ```powershell
  # Tạo sao lưu:
  .\backup\backup.ps1

  # Phục hồi dữ liệu:
  .\backup\restore.ps1 -BackupFile .\backups\gallery_backup_xxxx.zip
  ```
- **Trong Docker Container:**
  ```bash
  # Chạy sao lưu:
  docker exec -it gallery_backup /backup.sh
  ```

---

## 7. Giám Sát Hệ Thống (Prometheus & Grafana)
1. **Prometheus:** Truy cập [http://localhost:9090](http://localhost:9090) để xem các target đang được giám sát (`gallery_backend`). Các metrics quan trọng:
   - `gallery_http_requests_total`: Tổng số lượt truy vấn API
   - `gallery_http_request_duration_seconds`: Thời gian đáp ứng của hệ thống
   - `gallery_images_total`: Tổng số ảnh hiện có
   - `gallery_storage_bytes_total`: Tổng dung lượng đã sử dụng
2. **Grafana:** Truy cập [http://localhost:3001](http://localhost:3001) (đăng nhập `admin` / `admin123`). Bảng điều khiển **Online Gallery System Monitoring** đã được cấu hình tự động (Provisioning) sẵn sàng hiển thị biểu đồ thời gian thực.
