@echo off
chcp 65001 >nul
title Khởi Chạy Thư Viện Ảnh Trực Tuyến (Trực tiếp không cần Docker)
echo ==========================================================
echo  🚀 ĐANG KHỞI CHẠY HỆ THỐNG THƯ VIỆN ẢNH TRỰC TUYẾN...
echo ==========================================================

powershell -ExecutionPolicy Bypass -File "%~dp0run_local.ps1"

pause
