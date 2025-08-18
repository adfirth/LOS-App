@echo off
echo 🧪 LOS App - Local Testing
echo ================================
echo.

echo 📍 Current directory: %CD%
echo.

echo 🔍 Checking for Node.js installation...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found in PATH
    echo.
    echo 💡 Solutions:
    echo   1. Install Node.js from https://nodejs.org/
    echo   2. Use the simple HTML test file instead
    echo   3. Open test-local-simple.html in your browser
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

echo 🔍 Checking for npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not found in PATH
    echo.
    echo 💡 Solutions:
    echo   1. Reinstall Node.js (includes npm)
    echo   2. Use the simple HTML test file instead
    echo   3. Open test-local-simple.html in your browser
    echo.
    pause
    exit /b 1
)

echo ✅ npm found
echo.

echo 🚀 Starting local development server...
echo.
echo 💡 This will open your browser to http://localhost:9000
echo 💡 Press Ctrl+C to stop the server
echo.

npm run test:serve

pause


