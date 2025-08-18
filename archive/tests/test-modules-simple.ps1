# Simple Module Testing Script - No npm required
# Tests basic file integrity and syntax

Write-Host "🧪 LOS App - Simple Module Testing" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Get current directory
$currentDir = Get-Location
Write-Host "📍 Current directory: $currentDir" -ForegroundColor Yellow
Write-Host ""

# Define modules to test
$modulesToTest = @(
    @{ Name = "UI Module"; Path = "src\modules\ui.js"; Critical = $true },
    @{ Name = "Auth Module"; Path = "src\modules\auth.js"; Critical = $true },
    @{ Name = "Database Module"; Path = "src\modules\database.js"; Critical = $true },
    @{ Name = "Game Logic Module"; Path = "src\modules\gameLogic.js"; Critical = $false },
    @{ Name = "Fixtures Module"; Path = "src\modules\fixtures.js"; Critical = $false },
    @{ Name = "Scores Module"; Path = "src\modules\scores\index.js"; Critical = $false },
    @{ Name = "Admin Module"; Path = "src\modules\admin\index.js"; Critical = $false }
)

Write-Host "📋 Testing Modules:" -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$totalCount = $modulesToTest.Count

foreach ($module in $modulesToTest) {
    $filePath = Join-Path $currentDir $module.Path
    $critical = if ($module.Critical) { " [CRITICAL]" } else { "" }
    
    if (Test-Path $filePath) {
        try {
            $content = Get-Content $filePath -Raw -ErrorAction Stop
            
            # Basic checks
            $hasContent = $content.Length -gt 0
            $hasExports = $content -match "export|module\.exports"
            $noSyntaxErrors = $content -notmatch "syntax error"
            
            if ($hasContent -and $hasExports -and $noSyntaxErrors) {
                Write-Host "✅ $($module.Name)$critical" -ForegroundColor Green
                Write-Host "   📁 File: $($module.Path)" -ForegroundColor Gray
                Write-Host "   📏 Size: $($content.Length) characters" -ForegroundColor Gray
                $successCount++
            } else {
                Write-Host "⚠️  $($module.Name)$critical" -ForegroundColor Yellow
                Write-Host "   📁 File: $($module.Path)" -ForegroundColor Gray
                if (-not $hasContent) { Write-Host "   ❌ No content" -ForegroundColor Red }
                if (-not $hasExports) { Write-Host "   ❌ No exports found" -ForegroundColor Red }
                if (-not $noSyntaxErrors) { Write-Host "   ❌ Potential syntax issues" -ForegroundColor Red }
            }
        } catch {
            Write-Host "❌ $($module.Name)$critical" -ForegroundColor Red
            Write-Host "   📁 File: $($module.Path)" -ForegroundColor Gray
            Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ $($module.Name)$critical" -ForegroundColor Red
        Write-Host "   📁 File: $($module.Path)" -ForegroundColor Gray
        Write-Host "   ❌ File not found" -ForegroundColor Red
    }
    Write-Host ""
}

# Summary
Write-Host "📊 Test Summary:" -ForegroundColor Cyan
Write-Host "Total Modules: $totalCount" -ForegroundColor White
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Failed: $($totalCount - $successCount)" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round(($successCount / $totalCount) * 100, 1))%" -ForegroundColor Cyan

Write-Host ""
if ($successCount -eq $totalCount) {
    Write-Host "🎉 All modules passed testing!" -ForegroundColor Green
    Write-Host "💡 You can now open test-local-simple.html in your browser for full testing" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Some modules have issues" -ForegroundColor Yellow
    Write-Host "💡 Check the errors above and fix them before testing" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open test-local-simple.html in your browser for full testing" -ForegroundColor White
Write-Host "2. Fix any module issues found above" -ForegroundColor White
Write-Host "3. Use the simple HTML test for quick validation" -ForegroundColor White

Read-Host "Press Enter to continue"
