# LOS App - Local Testing Server (Network Drive Version)
# This script handles network drives and UNC paths properly

Write-Host "🧪 LOS App - Local Testing Server (Network Drive Version)" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

# Get current directory
$currentDir = Get-Location
Write-Host "📍 Current directory: $currentDir" -ForegroundColor Yellow
Write-Host ""

# Check if we're on a network drive
$isNetworkDrive = $currentDir.DriveType -eq "Network"
if ($isNetworkDrive) {
    Write-Host "🌐 Network drive detected" -ForegroundColor Yellow
    Write-Host "   This script is designed to handle network paths" -ForegroundColor White
} else {
    Write-Host "💾 Local drive detected" -ForegroundColor Green
}
Write-Host ""

# Check for Python
Write-Host "🔍 Checking for Python..." -ForegroundColor Yellow

$pythonPath = $null
$pythonFound = $false

# Try to find Python in PATH
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Python found in PATH: $pythonVersion" -ForegroundColor Green
        $pythonPath = "python"
        $pythonFound = $true
    }
} catch {
    # Python not in PATH, continue searching
}

# If not in PATH, search common locations
if (-not $pythonFound) {
    Write-Host "🔍 Searching for Python in common locations..." -ForegroundColor Yellow
    
    $commonPaths = @(
        "$env:LOCALAPPDATA\Programs\Python\Python*\python.exe",
        "C:\Program Files\Python*\python.exe",
        "C:\Program Files (x86)\Python*\python.exe",
        "C:\Python*\python.exe"
    )
    
    foreach ($path in $commonPaths) {
        $foundPaths = Get-ChildItem -Path $path -ErrorAction SilentlyContinue
        if ($foundPaths) {
            $pythonPath = $foundPaths[0].FullName
            Write-Host "✅ Python found at: $pythonPath" -ForegroundColor Green
            $pythonFound = $true
            break
        }
    }
}

if (-not $pythonFound) {
    Write-Host "❌ Python not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Solutions:" -ForegroundColor Yellow
    Write-Host "  1. Install Python from https://python.org/" -ForegroundColor White
    Write-Host "  2. Add Python to your PATH environment variable" -ForegroundColor White
    Write-Host "  3. Use the alternative testing approach below" -ForegroundColor White
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
    if ($pythonPath -eq "python") {
        python start-local-server.py
    } else {
        & $pythonPath start-local-server.py
    }
} catch {
    Write-Host "❌ Failed to start server: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative: Use the simple HTML test file" -ForegroundColor Yellow
    Write-Host "  1. Double-click test-local-simple.html" -ForegroundColor White
    Write-Host "  2. It will test module loading without CORS issues" -ForegroundColor White
}

Read-Host "Press Enter to continue"
