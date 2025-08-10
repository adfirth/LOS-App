# PowerShell Profile - Auto-loads pager fix
# Place this file in: $PROFILE (usually Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1)

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

# Display configuration on profile load (only once per session)
if (-not $env:POWER_SHELL_PAGER_FIX_LOADED) {
    $env:POWER_SHELL_PAGER_FIX_LOADED = $true
    Write-Host "PowerShell Pager Fix Loaded" -ForegroundColor Green
    Write-Host "Use 'git-no-pager' or 'Safe-Command' for pager-free operations" -ForegroundColor Cyan
}
