# LOS App - Local Testing Server
# This script starts a local HTTP server to avoid CORS issues

Write-Host "🧪 LOS App - Local Testing Server" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check for Python
Write-Host "🔍 Checking for Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Solutions:" -ForegroundColor Yellow
    Write-Host "  1. Install Python from https://python.org/" -ForegroundColor White
    Write-Host "  2. Use the alternative testing approach below" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Alternative: Use the simple HTML test file" -ForegroundColor Yellow
    Write-Host "  1. Double-click test-local-simple.html" -ForegroundColor White
    Write-Host "  2. It will test module loading without CORS issues" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to continue"
    exit 1
}

Write-Host ""

# Check if we're in the project directory
if (-not (Test-Path "src")) {
    Write-Host "❌ 'src' directory not found!" -ForegroundColor Red
    Write-Host "   Please run this script from your project root directory" -ForegroundColor Yellow
    Read-Host "Press Enter to continue"
    exit 1
}

Write-Host "✅ Project directory confirmed" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Starting local server..." -ForegroundColor Green
Write-Host "💡 This will open your browser to the test app" -ForegroundColor Cyan
Write-Host "💡 Keep this window open while testing" -ForegroundColor Cyan
Write-Host "💡 Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host ""

try {
    # Start the Python server
    python start-local-server.py
} catch {
    Write-Host "❌ Failed to start server: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative: Use the simple HTML test file" -ForegroundColor Yellow
    Write-Host "  1. Double-click test-local-simple.html" -ForegroundColor White
    Write-Host "  2. It will test module loading without CORS issues" -ForegroundColor White
}

Read-Host "Press Enter to continue"


