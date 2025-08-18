# Simple Module Testing - No npm required
Write-Host "Testing LOS App modules..." -ForegroundColor Green

# Get current directory
$currentDir = Get-Location
Write-Host "Current directory: $currentDir" -ForegroundColor Yellow

# Define modules to test
$modules = @(
    "src\modules\ui.js",
    "src\modules\auth.js", 
    "src\modules\database.js",
    "src\modules\gameLogic.js",
    "src\modules\fixtures.js"
)

Write-Host "Testing $($modules.Count) modules..." -ForegroundColor Cyan
Write-Host ""

$successCount = 0

foreach ($modulePath in $modules) {
    $fullPath = Join-Path $currentDir $modulePath
    
    if (Test-Path $fullPath) {
        try {
            $content = Get-Content $fullPath -Raw -ErrorAction Stop
            
            if ($content.Length -gt 0) {
                Write-Host "OK: $modulePath" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host "WARNING: $modulePath (empty file)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "ERROR: $modulePath - $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "MISSING: $modulePath" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Summary: $successCount of $($modules.Count) modules OK" -ForegroundColor Cyan

if ($successCount -eq $modules.Count) {
    Write-Host "All modules found and readable!" -ForegroundColor Green
    Write-Host "You can now open test-local-simple.html in your browser" -ForegroundColor Yellow
} else {
    Write-Host "Some modules have issues - check above" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


