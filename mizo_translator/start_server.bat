@echo off
title Mizo-English Translation Server
echo ==========================================================
echo 🚀 STARTING PRODUCTION TRANSLATION API SERVER (FastAPI)
echo ==========================================================
echo.
echo Virtual Environment: L:\LushaiSql\.venv
echo Port: 8000
echo Address: http://127.0.0.1:8000
echo.
echo Press Ctrl+C in this terminal window to stop the server.
echo.
L:\LushaiSql\.venv\Scripts\python.exe -m app.main
pause
