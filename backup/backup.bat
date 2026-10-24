@echo off
REM ==============================================================================
REM PhotoVault Windows Backup Script (Docker Volume Aware)
REM ==============================================================================

setlocal enabledelayedexpansion
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set datetime=%%I
if "%datetime%"=="" (
    for /f "tokens=1-6 delims=/:. " %%a in ("%date% %time%") do set TIMESTAMP=%%c%%b%%a_%%d%%e%%f
) else (
    set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%
)

set BACKUP_DIR=%~dp0archives
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

set DB_USER=gallery_user
set DB_NAME=gallery_db
set DB_FILE=%BACKUP_DIR%\db_backup_%TIMESTAMP%.sql
set MEDIA_ZIP=%BACKUP_DIR%\media_backup_%TIMESTAMP%.zip
set TEMP_UPLOADS=%BACKUP_DIR%\temp_uploads_%TIMESTAMP%

echo =======================================================
echo  PhotoVault: Starting System Backup [%TIMESTAMP%]
echo =======================================================

echo [1/2] Backing up PostgreSQL database (%DB_NAME%)...
docker compose exec -T postgres pg_dump -U %DB_USER% %DB_NAME% > "%DB_FILE%"

if exist "%DB_FILE%" (
    echo [OK] Database backup saved to: %DB_FILE%
) else (
    echo [ERROR] Failed to export database!
)

echo [2/2] Backing up uploaded media from Docker container...
docker cp gallery_backend:/app/uploads "%TEMP_UPLOADS%" >nul 2>&1
if exist "%TEMP_UPLOADS%" (
    powershell -Command "Compress-Archive -Path '%TEMP_UPLOADS%\*' -DestinationPath '%MEDIA_ZIP%' -Force; Remove-Item -Recurse -Force '%TEMP_UPLOADS%'"
    echo [OK] Media files backup saved to: %MEDIA_ZIP%
) else (
    echo [WARNING] Could not copy uploads from container, trying fallback...
    if exist "%~dp0..\backend\uploads" (
        powershell -Command "Compress-Archive -Path '%~dp0..\backend\uploads\*' -DestinationPath '%MEDIA_ZIP%' -Force"
        echo [OK] Media files backup saved to: %MEDIA_ZIP%
    )
)

echo =======================================================
echo  Backup Completed Successfully!
echo  Archives location: %BACKUP_DIR%
echo =======================================================
pause
