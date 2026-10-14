# ==============================================================================
# HỆ THỐNG THƯ VIỆN ẢNH TRỰC TUYẾN - CHẠY TRỰC TIẾP KHÔNG CẦN DOCKER
# Hỗ trợ chạy cả Online và Offline hoàn toàn (Tự động fallback SQLite)
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 ĐANG KHỞI CHẠY HỆ THỐNG THƯ VIỆN ẢNH TRỰC TUYẾN..." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

$WorkspaceRoot = $PSScriptRoot
Set-Location $WorkspaceRoot

# 1. Kiểm tra Python
Write-Host "`n[1/4] Kiểm tra môi trường Python..." -ForegroundColor Yellow
$PythonCmd = if (Get-Command python -ErrorAction SilentlyContinue) { "python" } else { "py" }
& $PythonCmd --version

# Cài đặt thư viện Python nếu chưa cài
Write-Host "Kiểm tra và cài đặt thư viện Backend..." -ForegroundColor Yellow
& $PythonCmd -m pip install -q -r "$WorkspaceRoot\backend\requirements.txt"

# 2. Kiểm tra Node.js & Frontend
Write-Host "`n[2/4] Kiểm tra môi trường Node.js & Frontend..." -ForegroundColor Yellow
Set-Location "$WorkspaceRoot\frontend"
if (-not (Test-Path "node_modules")) {
    Write-Host "Đang cài đặt thư viện Frontend..." -ForegroundColor Yellow
    npm install
}

# 3. Khởi động Backend trong nền (Port 5001)
Write-Host "`n[3/4] Đang khởi động Backend API tại http://localhost:5001..." -ForegroundColor Yellow
Set-Location "$WorkspaceRoot\backend"
$BackendJob = Start-Process $PythonCmd -ArgumentList "run.py" -PassThru -WindowStyle Hidden

# Đợi backend khởi tạo (2 giây)
Start-Sleep -Seconds 2

# 4. Khởi động Frontend Dev Server (Port 5173)
Write-Host "`n[4/4] Đang khởi động Frontend UI tại http://localhost:5173..." -ForegroundColor Yellow
Set-Location "$WorkspaceRoot\frontend"
Start-Process npm -ArgumentList "run", "dev" -WindowStyle Hidden

# Đợi 2 giây và mở trình duyệt
Start-Sleep -Seconds 2
$AppUrl = "http://localhost:5173"
Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "🎉 HỆ THỐNG ĐÃ SẴN SÀNG!" -ForegroundColor Green
Write-Host "🌐 Link ứng dụng: $AppUrl" -ForegroundColor White
Write-Host "🔑 Tài khoản Admin mặc định : admin / Admin@123" -ForegroundColor Magenta
Write-Host "🔑 Tài khoản User mặc định  : user1 / User@123" -ForegroundColor Magenta
Write-Host "📊 Metrics Prometheus      : http://localhost:5001/metrics" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

# Mở trình duyệt
Start-Process $AppUrl
