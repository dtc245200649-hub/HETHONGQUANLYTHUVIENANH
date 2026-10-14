@echo off
REM ==============================================================================
REM Photo Gallery Windows Backup Batch Script
REM ==============================================================================

setlocal enabledelayedexpansion
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%

set BACKUP_DIR=%~dp0archives
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

set DB_USER=gallery_user
set DB_NAME=gallery_db
set DB_FILE=%BACKUP_DIR%\db_backup_%TIMESTAMP%.sql

echo ==========================================
echo Starting Gallery Windows Backup: %TIMESTAMP%
echo ==========================================

echo [1/2] Backing up PostgreSQL database (%DB_NAME%)...
docker compose exec -T postgres pg_dump -U %DB_USER% %DB_NAME% > "%DB_FILE%"

if exist "%DB_FILE%" (
    echo [✓] Database backup saved to: %DB_FILE%
) else (
    echo [X] Failed to create database backup!
)

echo [2/2] Backing up uploads folder...
powershell -Command "Compress-Archive -Path '%~dp0..\backend\uploads' -DestinationPath '%BACKUP_DIR%\media_backup_%TIMESTAMP%.zip' -Force"
echo [✓] Media backup saved to: %BACKUP_DIR%\media_backup_%TIMESTAMP%.zip

echo ==========================================
echo Backup Completed Successfully!
echo ==========================================
pause
