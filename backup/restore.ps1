# ==============================================================================
# POWERSHELL SCRIPT PHỤC HỒI DỮ LIỆU TỪ BẢN SAO LƯU (WINDOWS NATIVE)
# ==============================================================================
param (
    [string]$BackupFile
)

if (-not $BackupFile) {
    Write-Host "Vui lòng nhập đường dẫn file sao lưu (.zip hoặc .tar.gz)!" -ForegroundColor Red
    Write-Host "Ví dụ: .\restore.ps1 -BackupFile ..\backups\gallery_backup_xxxx.zip" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $BackupFile)) {
    Write-Host "Không tìm thấy file: $BackupFile" -ForegroundColor Red
    exit 1
}

$TempExtract = Join-Path $env:TEMP "gallery_restore_$(Get-Random)"
New-Item -ItemType Directory -Path $TempExtract -Force | Out-Null

Write-Host "Đang giải nén file sao lưu: $BackupFile..." -ForegroundColor Cyan
Expand-Archive -Path $BackupFile -DestinationPath $TempExtract -Force

# Phục hồi SQLite nếu có
$RestoredSqlite = Join-Path $TempExtract "gallery_local.db"
if (Test-Path $RestoredSqlite) {
    Write-Host "Đang phục hồi database SQLite..." -ForegroundColor Yellow
    Copy-Item $RestoredSqlite -Destination (Join-Path $PSScriptRoot "..\backend\gallery_local.db") -Force
}

# Phục hồi Uploads
$RestoredUploads = Join-Path $TempExtract "uploads"
if (Test-Path $RestoredUploads) {
    Write-Host "Đang phục hồi thư mục ảnh uploads..." -ForegroundColor Yellow
    $TargetUploads = Join-Path $PSScriptRoot "..\backend\uploads"
    Copy-Item -Path "$RestoredUploads\*" -Destination $TargetUploads -Recurse -Force
}

Remove-Item -Path $TempExtract -Recurse -Force
Write-Host "✅ Phục hồi hoàn tất thành công!" -ForegroundColor Green
