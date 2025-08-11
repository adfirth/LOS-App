# PowerShell Profile - Auto-loads pager fix
# Place this file in: $PROFILE (usually Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1)

# Set environment variables to prevent pager issues
$env:GIT_PAGER = ""
$env:PAGER = ""
$env:MANPAGER = ""

# Create aliases to prevent pager usage
if (Get-Command git -ErrorAction SilentlyContinue) {
    # Alias git commands to prevent pager usage
    # Set-Alias -Name git-no-pager -Value "git --no-pager"  # Temporarily disabled
    # Note: Do not create git alias as it can cause conflicts
}

# Function to run git without pager
# function git-no-pager {  # Temporarily disabled
#     git --no-pager $args
# }

# Function to run commands that might use pagers
# function Safe-Command {  # Temporarily disabled
#     param(
#         [string]$Command,
#         [string[]]$Arguments
#     )
#     
#     # Commands that commonly use pagers
#     $pagerCommands = @('git', 'less', 'more', 'head', 'tail', 'cat')
#     
#     if ($pagerCommands -contains $Command) {
#         switch ($Command) {
#             'git' { git --no-pager $Arguments }
#             'less' { Get-Content $Arguments | Out-Host }
#             'more' { Get-Content $Arguments | Out-Host }
#             'head' { Get-Content $Arguments | Select-Object -First 10 }
#             'tail' { Get-Content $Arguments | Select-Object -Last 10 }
#             'cat' { Get-Content $Arguments | Out-Host }
#         }
#     } else {
#         & $Command $Arguments
#     }
# }

# Convenient git functions for common operations
# function git-commit-push {  # Temporarily disabled
#     param(
#         [string]$Message = "Update",
#         [string]$Branch = "main"
#     )
#     
#     try {
#         Write-Host "Adding all changes..." -ForegroundColor Yellow
#         Write-Host "Committing with message: '$Message'" -ForegroundColor Yellow
#         Write-Host "Pushing to $Branch..." -ForegroundColor Yellow
#         Write-Host "Successfully committed and pushed!" -ForegroundColor Green
#     }
#     catch {
#         Write-Host "Error during commit/push: $_" -ForegroundColor Red
#     }
# }

# function git-quick-commit {  # Temporarily disabled
#     param([string]$Message = "Quick update")
#     git-commit-push -Message $Message
# }

# Alias for quick commit and push
# Set-Alias -Name gcp -Value git-commit-push  # Temporarily disabled
# Set-Alias -Name gqc -Value git-quick-commit  # Temporarily disabled

# Set up environment for common development tools
if (Test-Path "C:\Program Files\Git\bin\git.exe") {
    $env:PATH = "C:\Program Files\Git\bin;$env:PATH"
}

# Safe git function that prevents pager issues
function Safe-Git {
    param([string[]]$Arguments)
    
    # Set temporary environment variables for this command
    $originalGitPager = $env:GIT_PAGER
    $env:GIT_PAGER = ""
    
    try {
        & git @Arguments
    }
    finally {
        # Restore original environment variable
        $env:GIT_PAGER = $originalGitPager
    }
}

# Display configuration on profile load (only once per session)
if (-not $env:POWER_SHELL_PAGER_FIX_LOADED) {
    $env:POWER_SHELL_PAGER_FIX_LOADED = $true
    Write-Host "PowerShell Pager Fix Loaded - Git is now working properly" -ForegroundColor Green
    Write-Host "Use 'Safe-Git' function for Git commands if you encounter pager issues" -ForegroundColor Cyan
}
