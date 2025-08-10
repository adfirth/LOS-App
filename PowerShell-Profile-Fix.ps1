# PowerShell Profile Fix for Pager Issues
# This script fixes common pager problems in PowerShell

# Set environment variables to prevent pager issues
$env:GIT_PAGER = ""
$env:PAGER = ""
$env:MANPAGER = ""

# Create aliases to prevent pager usage
if (Get-Command git -ErrorAction SilentlyContinue) {
    # Alias git commands to prevent pager usage
    Set-Alias -Name git -Value "git --no-pager"
}

# Function to run git without pager
function git-no-pager {
    git --no-pager $args
}

# Function to run commands that might use pagers
function Safe-Command {
    param(
        [string]$Command,
        [string[]]$Arguments
    )
    
    # Commands that commonly use pagers
    $pagerCommands = @('git', 'less', 'more', 'head', 'tail', 'cat')
    
    if ($pagerCommands -contains $Command) {
        switch ($Command) {
            'git' { git --no-pager $Arguments }
            'less' { Get-Content $Arguments | Out-Host }
            'more' { Get-Content $Arguments | Out-Host }
            'head' { Get-Content $Arguments | Select-Object -First 10 }
            'tail' { Get-Content $Arguments | Select-Object -Last 10 }
            'cat' { Get-Content $Arguments | Out-Host }
        }
    } else {
        & $Command $Arguments
    }
}

# Set up environment for common development tools
if (Test-Path "C:\Program Files\Git\bin\git.exe") {
    $env:PATH = "C:\Program Files\Git\bin;$env:PATH"
}

# Display current configuration
Write-Host "PowerShell Pager Fix Applied:" -ForegroundColor Green
Write-Host "GIT_PAGER: $env:GIT_PAGER" -ForegroundColor Yellow
Write-Host "PAGER: $env:PAGER" -ForegroundColor Yellow
Write-Host "MANPAGER: $env:MANPAGER" -ForegroundColor Yellow
Write-Host ""
Write-Host "Use 'git-no-pager' command or 'Safe-Command' function for pager-free operations" -ForegroundColor Cyan
Write-Host "Example: git-no-pager log --oneline" -ForegroundColor White
Write-Host "Example: Safe-Command head filename.txt" -ForegroundColor White
