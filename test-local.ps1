# LOS App - Local Testing PowerShell Script
# This script provides local testing without requiring npm to be in PATH

Write-Host "🧪 LOS App - Local Testing" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📍 Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Check for Node.js
Write-Host "🔍 Checking for Node.js installation..." -ForegroundColor Yellow
try {
    $nodePath = Get-Command node -ErrorAction Stop
    Write-Host "✅ Node.js found at: $($nodePath.Source)" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Solutions:" -ForegroundColor Yellow
    Write-Host "  1. Install Node.js from https://nodejs.org/" -ForegroundColor White
    Write-Host "  2. Use the simple HTML test file instead" -ForegroundColor White
    Write-Host "  3. Open test-local-simple.html in your browser" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to continue"
    exit 1
}

Write-Host ""

# Check for npm
Write-Host "🔍 Checking for npm..." -ForegroundColor Yellow
try {
    $npmPath = Get-Command npm -ErrorAction Stop
    Write-Host "✅ npm found at: $($npmPath.Source)" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Solutions:" -ForegroundColor Yellow
    Write-Host "  1. Reinstall Node.js (includes npm)" -ForegroundColor White
    Write-Host "  2. Use the simple HTML test file instead" -ForegroundColor White
    Write-Host "  3. Open test-local-simple.html in your browser" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to continue"
    exit 1
}

Write-Host ""

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found in current directory" -ForegroundColor Red
    Write-Host "   Please run this script from your project root directory" -ForegroundColor Yellow
    Read-Host "Press Enter to continue"
    exit 1
}

Write-Host "✅ package.json found" -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    try {
        npm install
        Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to continue"
        exit 1
    }
    Write-Host ""
}

Write-Host "🚀 Starting local development server..." -ForegroundColor Green
Write-Host ""
Write-Host "💡 This will open your browser to http://localhost:9000" -ForegroundColor Cyan
Write-Host "💡 Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host ""

try {
    npm run test:serve
} catch {
    Write-Host "❌ Failed to start development server" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Read-Host "Press Enter to continue"


