# PhotoVault - Hệ Thống Thư Viện Ảnh Trực Tuyến

> **Đề tài:** Xây dựng và triển khai hệ thống thư viện ảnh trực tuyến sử dụng Docker, kết hợp quản trị cơ sở dữ liệu, sao lưu và giám sát hệ thống.  
> **Mục tiêu:** Xây dựng ứng dụng Gallery có khả năng quản lý ảnh trực tuyến, phân quyền người dùng, triển khai bằng Docker, quản trị cơ sở dữ liệu, sao lưu và phục hồi dữ liệu, đồng thời giám sát tình trạng hoạt động của hệ thống.

---

## 1. Công Nghệ Sử Dụng

| Thành phần | Công nghệ | Chi tiết sử dụng |
| :--- | :--- | :--- |
| **Giao diện người dùng** | **React + Vite** | Giao diện hiện đại (Cyber Indigo Dark Mode, Glassmorphism), Masonry/Grid, xem trước ảnh toàn màn hình, tải ảnh kéo thả |
| **Backend / API** | **Python Flask** | RESTful API, xác thực JWT, phân quyền Role-based (Admin/User), xử lý ảnh & sinh thumbnail WebP (Pillow) |
| **Cơ sở dữ liệu** | **PostgreSQL 16** | Bảng quan hệ: `users`, `photos`, `albums`, `tags`, `photo_tags`, `system_logs` |
| **Máy chủ trung gian** | **Nginx** | Reverse Proxy điều hướng `/` sang Frontend, `/api/` sang Backend, bảo vệ Security Headers & cache |
| **Triển khai** | **Docker + Docker Compose** | Đóng gói toàn bộ 6 dịch vụ độc lập, quản lý mạng bridge nội bộ và persistent volumes |
| **Giám sát** | **Prometheus + Grafana** | Thu thập chỉ số thời gian thực (`/metrics`) và trực quan hóa Dashboard trực quan |
| **Quản lý mã nguồn** | **Git + GitHub** | Kiểm soát phiên bản mã nguồn chuẩn |

---

## 2. Chiến Lược Triển Khai (Lưu ý dòng cuối)

> *"Chúng ta sẽ ưu tiên hoàn thành phiên bản chạy được trước, sau đó bổ sung bảo mật, sao lưu và giám sát."*

Hệ thống được thiết kế theo 2 giai đoạn mạch lạc:

### 🌟 Giai Đoạn 1: Phiên Bản Hoạt Động Cốt Lõi (Working MVP)
- [x] Khởi tạo backend Python Flask hoàn chỉnh với đầy đủ các API: Đăng ký, Đăng nhập, Tải ảnh đơn/đa tệp, Xem chi tiết, Phân trang, Tìm kiếm từ khóa, Lọc theo thẻ tag, Quản lý album.
- [x] Giao diện React + Vite thiết kế chỉn chu, hiệu ứng mượt mà, hỗ trợ kéo thả ảnh (Drag-and-drop), xem ảnh Lightbox độ phân giải cao.
- [x] Cơ chế phân quyền tài khoản (Admin toàn quyền quản lý, User quản lý ảnh cá nhân).
- [x] Thiết lập CSDL PostgreSQL và script tự động tạo dữ liệu mẫu (Seed Data) sẵn sàng chạy ngay.

### 🛡️ Giai Đoạn 2: Bảo Mật, Sao Lưu & Giám Sát Hệ Thống
- [x] **Bảo mật:** Băm mật khẩu bằng `bcrypt`, bảo vệ API bằng JSON Web Token (JWT), kiểm duyệt loại tệp ảnh (MIME & Pillow verification), giới hạn dung lượng tải lên (30MB), cấu hình HTTP Security Headers trên Nginx.
- [x] **Quản trị CSDL & Sao lưu (Backup & Restore):** Kịch bản tự động sao lưu cả CSDL (`pg_dump`) và thư mục ảnh vật lý (`backup.sh` / `backup.bat`), chính sách dọn dẹp sao lưu cũ hơn 7 ngày, kịch bản phục hồi khi gặp sự cố (`restore.sh` / `restore.bat`).
- [x] **Giám sát hệ thống (Monitoring):** Tích hợp `prometheus_client` xuất metrics `/metrics` (đếm số request HTTP, đo độ trễ API, đo dung lượng lưu trữ trên đĩa, số lượng ảnh trong DB), cấu hình Prometheus Server và Grafana Dashboard tự động nạp (Auto-provisioning).

---

## 3. Kiến Trúc Hệ Thống (Architecture)

```
[ Khách hàng / Trình duyệt ]
             │
             ▼
[ Nginx Gateway :80 / :8080 ]
      │                   │
      ▼ (/)               ▼ (/api/)
[ React Frontend :3000 ]  [ Flask Backend :5000 ] ◄──► [ PostgreSQL :5432 ]
                                 │
                                 ▼ (/metrics)
                          [ Prometheus :9090 ]
                                 ▲
                                 │
                          [ Grafana :3001 ]
```

---

## 4. Hướng Dẫn Khởi Chạy Nhanh (1 Lệnh Docker)

### Bước 1: Khởi động toàn bộ hệ thống bằng Docker Compose
Mở PowerShell hoặc Terminal tại thư mục dự án và chạy:
```bash
docker compose up --build -d
```

### Bước 2: Truy cập các dịch vụ
Sau khi các container khởi động hoàn tất (chỉ mất khoảng 1-2 phút lần đầu để build):

| Dịch vụ | Địa chỉ truy cập IP | Ghi chú |
| :--- | :--- | :--- |
| **Ứng dụng PhotoVault (Nginx)** | `http://127.0.0.1:8080` (hoặc LAN: `http://192.168.1.104:8080`) | Cổng Nginx phân phối hệ thống |
| **Giao diện Frontend (Dev)**| `http://127.0.0.1:3000` (hoặc LAN: `http://192.168.1.104:3000`) | Giao diện React + Vite UI |
| **Backend REST API** | `http://127.0.0.1:5000/api/health` | Kiểm tra trạng thái API |
| **Prometheus Raw Metrics** | `http://127.0.0.1:5000/metrics` | Chỉ số giám sát thời gian thực |
| **Prometheus Server UI** | `http://127.0.0.1:9090` | Truy vấn PromQL |
| **Grafana Dashboard** | `http://127.0.0.1:3001` | Đăng nhập: `admin` / `admin` |

---

## 5. Tài Khoản Thử Nghiệm Tích Hợp Sẵn

Hệ thống đã tự động kích hoạt CSDL với 2 tài khoản mẫu (Có nút **"Đăng nhập nhanh 1 chạm"** ngay trên giao diện Web):

| Tài khoản | Username | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản Trị Viên (Admin)** | `admin` | `AdminPassword123!` | Xem toàn bộ ảnh (kể cả ảnh riêng tư), đổi quyền hạn người dùng (User ⇄ Admin), khóa tài khoản, xem thống kê hệ thống và audit logs. |
| **Nhiếp Ảnh Gia (User)** | `photographer` | `UserPassword123!` | Tải ảnh lên, gắn thẻ tag, tạo album, quản lý ảnh công khai / riêng tư của bản thân. |

---

## 6. Hướng Dẫn Sao Lưu & Phục Hồi Dữ Liệu

### Sao lưu nhanh:
- **Trên Windows:** Chạy file `backup\backup.bat`
- **Trên Linux/macOS:** Chạy lệnh `./backup/backup.sh`

Các file nén `.sql.gz` và `.tar.gz` (hoặc `.zip`) sẽ được lưu tự động trong thư mục `backup/archives/`.

### Phục hồi nhanh:
- **Trên Windows:** Chạy `backup\restore.bat backup\archives\db_backup_xxxx.sql`
- **Trên Linux/macOS:** Chạy `./backup/restore.sh backup/archives/db_backup_xxxx.sql.gz backup/archives/media_backup_xxxx.tar.gz`

Xem chi tiết hướng dẫn thiết lập Cronjob tự động tại [backup/README.md](file:///d:/HETHONGQUANLYTHUVIENANH/backup/README.md).

---

## 7. Giám Sát Hiệu Năng Với Grafana & Prometheus

1. Mở trình duyệt vào `http://localhost:3001`
2. Đăng nhập tài khoản Grafana: `admin` / mật khẩu `admin`
3. Vào mục **Dashboards** -> Chọn **"Photo Gallery System Overview"**
4. Các biểu đồ tự động hiển thị:
   - Số người dùng trực tuyến
   - Tổng dung lượng đĩa sử dụng cho ảnh (MB)
   - Tần suất request HTTP / giây
   - Độ trễ phản hồi của API (Latency Percentile p95)
   - Lượt upload ảnh thành công / thất bại.

---

## 8. Chạy Độc Lập Cho Môi Trường Phát Triển (Local Dev Không Dùng Docker)

Nếu muốn phát triển hoặc chỉnh sửa trực tiếp không qua Docker:

### Khởi chạy Backend (Flask):
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
# Đặt biến môi trường sử dụng SQLite cho local dev:
set USE_SQLITE=true
python run.py
```

### Khởi chạy Frontend (React + Vite):
```bash
cd frontend
npm install
npm run dev
```
Truy cập `http://localhost:3000`.
