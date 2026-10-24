@echo off
REM ==============================================================================
REM PhotoVault Windows Restore Script
REM Usage: restore.bat <path_to_sql_file> [path_to_media_zip]
REM ==============================================================================

if "%~1"=="" (
    echo =======================================================
    echo  PhotoVault Database & Media Restore Utility
    echo =======================================================
    echo  Usage:   restore.bat ^<path_to_backup.sql^> [path_to_media.zip]
    echo  Example: restore.bat archives\db_backup_20261016.sql archives\media_backup_20261016.zip
    echo =======================================================
    exit /b 1
)

set DB_FILE=%~1
set MEDIA_ZIP=%~2
set DB_USER=gallery_user
set DB_NAME=gallery_db

echo =======================================================
echo  PhotoVault: Starting System Restore
echo =======================================================

echo [1] Restoring PostgreSQL database from %DB_FILE%...
docker compose exec -T postgres psql -U %DB_USER% -d %DB_NAME% < "%DB_FILE%"
echo [OK] Database restore finished!

if not "%MEDIA_ZIP%"=="" (
    if exist "%MEDIA_ZIP%" (
        echo [2] Restoring media files from %MEDIA_ZIP%...
        set TEMP_RESTORE=%~dp0archives\temp_restore_%RANDOM%
        powershell -Command "Expand-Archive -Path '%MEDIA_ZIP%' -DestinationPath '!TEMP_RESTORE!' -Force"
        docker cp "!TEMP_RESTORE!\." gallery_backend:/app/uploads/
        powershell -Command "Remove-Item -Recurse -Force '!TEMP_RESTORE!'"
        echo [OK] Media files restored to Docker volume!
    ) else (
        echo [WARNING] Media zip file '%MEDIA_ZIP%' not found!
    )
)

echo =======================================================
echo  Restore Completed!
echo =======================================================
pause
