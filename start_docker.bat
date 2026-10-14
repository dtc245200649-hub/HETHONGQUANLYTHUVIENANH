@echo off
chcp 65001 >nul
title Khởi Chạy Thư Viện Ảnh Bằng Docker Compose
echo ==========================================================
echo  🐳 ĐANG KHỞI CHẠY HỆ THỐNG QUA DOCKER COMPOSE...
echo ==========================================================

cd /d "%~dp0"
docker compose up -d --build

echo.
echo ==========================================================
echo  🎉 HỆ THỐNG DOCKER ĐÃ KHỞI CHẠY THÀNH CÔNG!
echo ==========================================================
echo  🌐 Cổng Web Chính (Nginx)  : http://localhost:8088
echo  ⚙️ Backend API             : http://localhost:5001/api
echo  📈 Prometheus Monitoring   : http://localhost:9090
echo  📊 Grafana Dashboards      : http://localhost:3001
echo  🔑 Đăng nhập Admin        : admin / Admin@123
echo  🔑 Đăng nhập User         : user1 / User@123
echo  🔑 Đăng nhập Grafana      : admin / admin123
echo ==========================================================

timeout /t 3 >nul
start http://localhost:8088
pause
