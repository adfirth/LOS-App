@echo off
echo 🧪 LOS App - Local Testing Server (Network Drive Version)
echo ========================================================
echo.

echo 📍 Current directory: %CD%
echo.

echo 🔍 Checking for Python...
echo.

REM Try to find Python in common locations
set PYTHON_FOUND=0

REM Check if python is in PATH
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Python found in PATH
    set PYTHON_FOUND=1
    goto :start_server
)

REM Check common Python installation paths
if exist "C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python*\python.exe" (
    echo ✅ Python found in user directory
    set PYTHON_PATH=C:\Users\%USERNAME%\AppData\Local\Programs\Python\Python*\python.exe
    set PYTHON_FOUND=1
    goto :start_server
)

if exist "C:\Program Files\Python*\python.exe" (
    echo ✅ Python found in Program Files
    set PYTHON_PATH=C:\Program Files\Python*\python.exe
    set PYTHON_FOUND=1
    goto :start_server
)

if exist "C:\Program Files (x86)\Python*\python.exe" (
    echo ✅ Python found in Program Files (x86)
    set PYTHON_PATH=C:\Program Files (x86)\Python*\python.exe
    set PYTHON_FOUND=1
    goto :start_server
)

if exist "C:\Python*\python.exe" (
    echo ✅ Python found in C:\Python
    set PYTHON_PATH=C:\Python*\python.exe
    set PYTHON_FOUND=1
    goto :start_server
)

echo ❌ Python not found in common locations
echo.
echo 💡 Solutions:
echo   1. Install Python from https://python.org/
echo   2. Add Python to your PATH environment variable
echo   3. Use the alternative testing approach below
echo.
echo 🚀 Alternative: Use the simple HTML test file
echo   1. Double-click test-local-simple.html
echo   2. It will test module loading without CORS issues
echo.
pause
exit /b 1

:start_server
echo.
echo 🚀 Starting local server...
echo 💡 This will open your browser to the test app
echo 💡 Keep this window open while testing
echo 💡 Press Ctrl+C to stop the server
echo.

if defined PYTHON_PATH (
    echo Using Python at: %PYTHON_PATH%
    "%PYTHON_PATH%" start-local-server.py
) else (
    python start-local-server.py
)

pause
