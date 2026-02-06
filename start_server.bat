@echo off
cd /d "%~dp0"
echo Starting XML-PDF Conversion Server...
echo URL: http://localhost:8001
echo.
python main.py
pause
