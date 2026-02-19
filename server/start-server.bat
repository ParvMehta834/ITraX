@echo off
REM ITraX Backend Server Startup Script

echo.
echo ===============================================
echo ITraX Backend Server
echo ===============================================
echo.

cd /d "%~dp0"

REM Check if node is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Starting server on port 4000...
echo.

REM Start the server
node index.js

REM If server exited, show error
if errorlevel 1 (
    echo.
    echo ERROR: Server failed to start
    pause
)
