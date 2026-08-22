@echo off
title Douyin Downloader Server
echo ==================================================
echo   Dang khoi dong Douyin Downloader Web App...
echo ==================================================

:: Mo trinh duyet web sau 2 giay
start "" "http://localhost:3000"

:: Chay Python Server bang executable Python da cai tren may
"C:\Users\Admin\AppData\Local\Programs\Python\Python310\python.exe" server.py

pause
