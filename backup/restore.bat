@echo off
REM ==============================================================================
REM Photo Gallery Windows Restore Batch Script
REM Usage: restore.bat <path_to_sql_file>
REM ==============================================================================

if "%~1"=="" (
    echo Usage: restore.bat ^<path_to_backup.sql^>
    exit /b 1
)

set DB_FILE=%~1
set DB_USER=gallery_user
set DB_NAME=gallery_db

echo ==========================================
echo Starting Database Restore from: %DB_FILE%
echo ==========================================

docker compose exec -T postgres psql -U %DB_USER% -d %DB_NAME% < "%DB_FILE%"

echo ==========================================
echo Database Restore Completed!
echo ==========================================
pause
