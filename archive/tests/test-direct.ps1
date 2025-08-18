# PowerShell script to open LOS App Direct Testing
# No npm or Node.js required!

Write-Host "🧪 Opening LOS App Direct Testing..." -ForegroundColor Cyan
Write-Host ""

# Check if test-direct.html exists
if (-not (Test-Path "test-direct.html")) {
    Write-Host "❌ Error: test-direct.html not found!" -ForegroundColor Red
    Write-Host "Make sure you're running this script from the project root directory." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Found test-direct.html" -ForegroundColor Green
Write-Host "🌐 Opening in your default browser..." -ForegroundColor Cyan

try {
    # Open the HTML file in default browser
    Start-Process "test-direct.html"
    Write-Host "✅ Test page opened successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Testing Tips:" -ForegroundColor Yellow
    Write-Host "   - Use the test controls on the page" -ForegroundColor White
    Write-Host "   - Check the browser console for errors" -ForegroundColor White
    Write-Host "   - Make changes to your source files and refresh" -ForegroundColor White
    Write-Host "   - No build process required!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Error opening test page: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Press Enter to exit..." -ForegroundColor Gray
Read-Host
