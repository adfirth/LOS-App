@echo off
echo 🧪 LOS App - Local Testing Server
echo ==================================
echo.

echo 🔍 Checking for Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found!
    echo.
    echo 💡 Solutions:
    echo   1. Install Python from https://python.org/
    echo   2. Use the alternative testing approach below
    echo.
    echo 🚀 Alternative: Use the simple HTML test file
    echo   1. Double-click test-local-simple.html
    echo   2. It will test module loading without CORS issues
    echo.
    pause
    exit /b 1
)

echo ✅ Python found
echo.

echo 🚀 Starting local server...
echo 💡 This will open your browser to the test app
echo 💡 Keep this window open while testing
echo 💡 Press Ctrl+C to stop the server
echo.

python start-local-server.py

pause


