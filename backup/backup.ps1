# ==============================================================================
# POWERSHELL SCRIPT SAO LƯU HỆ THỐNG THƯ VIỆN ẢNH (WINDOWS NATIVE)
# Hỗ trợ sao lưu cả khi chạy qua Docker lẫn chạy trực tiếp cục bộ!
# ==============================================================================

$BackupDir = Join-Path $PSScriptRoot "..\backups"
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupName = "gallery_backup_$Timestamp"
$TempDir = Join-Path $BackupDir $BackupName
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🚀 ĐANG TIẾN HÀNH SAO LƯU HỆ THỐNG..." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Sao lưu SQLite nếu chạy offline hoặc copy SQLite
$SqliteFile = Join-Path $PSScriptRoot "..\backend\gallery_local.db"
if (Test-Path $SqliteFile) {
    Write-Host "💾 Đang sao lưu cơ sở dữ liệu SQLite..." -ForegroundColor Yellow
    Copy-Item $SqliteFile -Destination (Join-Path $TempDir "gallery_local.db")
}

# 2. Sao lưu qua Docker PostgreSQL nếu docker đang chạy
$DockerRunning = (docker info 2>&1) -match "Server:"
if ($DockerRunning) {
    Write-Host "🐘 Đang trích xuất cơ sở dữ liệu PostgreSQL từ Docker..." -ForegroundColor Yellow
    docker exec gallery_postgres pg_dump -U gallery_user -d gallery_db -F c -f /tmp/backup.dump 2>$null
    docker cp gallery_postgres:/tmp/backup.dump (Join-Path $TempDir "database.dump") 2>$null
}

# 3. Sao lưu thư mục Uploads
$UploadsDir = Join-Path $PSScriptRoot "..\backend\uploads"
if (Test-Path $UploadsDir) {
    Write-Host "📁 Đang sao lưu thư mục ảnh uploads..." -ForegroundColor Yellow
    Copy-Item -Path $UploadsDir -Destination (Join-Path $TempDir "uploads") -Recurse -Force
}

# 4. Nén thành file zip / tar.gz
$ZipFile = Join-Path $BackupDir "$BackupName.zip"
Write-Host "📦 Đang nén tệp sao lưu: $ZipFile..." -ForegroundColor Yellow
Compress-Archive -Path "$TempDir\*" -DestinationPath $ZipFile -Force
Remove-Item -Path $TempDir -Recurse -Force

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ SAO LƯU THÀNH CÔNG!" -ForegroundColor Green
Write-Host "Tệp lưu trữ: $ZipFile" -ForegroundColor White
Write-Host "=========================================" -ForegroundColor Cyan
