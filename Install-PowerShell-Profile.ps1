# Install PowerShell Profile to Fix Pager Issues
# Run this script as Administrator if needed

Write-Host "Installing PowerShell Profile to Fix Pager Issues..." -ForegroundColor Green

# Get the profile path
$profilePath = $PROFILE
$profileDir = Split-Path $profilePath -Parent

Write-Host "Profile will be installed to: $profilePath" -ForegroundColor Yellow

# Create the profile directory if it doesn't exist
if (!(Test-Path $profileDir)) {
    Write-Host "Creating profile directory: $profileDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

# Copy the profile file
$sourceFile = Join-Path $PSScriptRoot "Microsoft.PowerShell_profile.ps1"
$targetFile = $profilePath

if (Test-Path $sourceFile) {
    Copy-Item -Path $sourceFile -Destination $targetFile -Force
    Write-Host "Profile installed successfully!" -ForegroundColor Green
} else {
    Write-Host "Error: Source profile file not found at: $sourceFile" -ForegroundColor Red
    Write-Host "Please ensure the Microsoft.PowerShell_profile.ps1 file is in the same directory as this script." -ForegroundColor Red
    exit 1
}

# Test if the profile loads correctly
Write-Host "Testing profile..." -ForegroundColor Yellow
try {
    . $profilePath
    Write-Host "Profile loaded successfully!" -ForegroundColor Green
} catch {
    Write-Host "Warning: Profile loaded with errors: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Close and reopen PowerShell for changes to take effect" -ForegroundColor White
Write-Host "2. Or run: . $profilePath" -ForegroundColor White
Write-Host "3. Test with: git --version" -ForegroundColor White
Write-Host ""
Write-Host "The profile will now automatically load every time you start PowerShell." -ForegroundColor Green
Write-Host "Use 'git-no-pager' or 'Safe-Command' for pager-free operations." -ForegroundColor Cyan
