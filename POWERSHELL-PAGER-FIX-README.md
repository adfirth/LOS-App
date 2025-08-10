# PowerShell Pager Issue Fix

## Problem Description
PowerShell often has issues with commands that use pagers (like `git`, `less`, `more`, `head`, `tail`, etc.). These commands can hang, crash, or behave unexpectedly in PowerShell environments.

## Common Symptoms
- Git commands hang or don't display output
- Commands like `less`, `more`, `head`, `tail` don't work properly
- PowerShell becomes unresponsive when running certain commands
- Error messages about pagers or terminal issues

## Solutions Provided

### 1. Quick Fix Script (`PowerShell-Profile-Fix.ps1`)
Run this script in your current PowerShell session for immediate relief:
```powershell
.\PowerShell-Profile-Fix.ps1
```

### 2. Permanent Profile Fix (`Microsoft.PowerShell_profile.ps1`)
This file should be placed in your PowerShell profile directory to automatically fix the issue every time PowerShell starts.

### 3. Automatic Installation (`Install-PowerShell-Profile.ps1`)
Run this script to automatically install the profile fix:
```powershell
.\Install-PowerShell-Profile.ps1
```

## What the Fix Does

1. **Sets Environment Variables:**
   - `GIT_PAGER = ""` - Disables Git's pager
   - `PAGER = ""` - Disables system pager
   - `MANPAGER = ""` - Disables manual page pager

2. **Creates Aliases:**
   - `git` → `git --no-pager` (automatically disables pager for all git commands)

3. **Provides Helper Functions:**
   - `git-no-pager` - Explicitly run git without pager
   - `Safe-Command` - Run any command safely without pager issues

## Usage Examples

### Before Fix (Problematic):
```powershell
git log --oneline  # Might hang or crash
git diff           # Could cause issues
less filename.txt  # Won't work properly
```

### After Fix (Working):
```powershell
git log --oneline  # Works normally
git diff           # Works normally
git-no-pager log   # Explicitly no pager
Safe-Command less filename.txt  # Safe alternative
```

## Manual Installation

If you prefer to install manually:

1. **Find your profile path:**
   ```powershell
   echo $PROFILE
   ```

2. **Copy the profile file:**
   ```powershell
   Copy-Item "Microsoft.PowerShell_profile.ps1" $PROFILE
   ```

3. **Reload PowerShell or run:**
   ```powershell
   . $PROFILE
   ```

## Troubleshooting

### Profile Not Loading
- Check if execution policy allows scripts: `Get-ExecutionPolicy`
- If restricted, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Git Still Has Issues
- Ensure Git is properly installed and in PATH
- Try running: `git --no-pager --version`

### Commands Still Hanging
- Use the `Safe-Command` function for problematic commands
- Check if the command has its own pager settings

## Alternative Solutions

### For Git Only:
```powershell
git config --global core.pager ""
```

### For Specific Commands:
```powershell
# Always append | cat to force output
git log --oneline | cat
```

## Files Created
- `PowerShell-Profile-Fix.ps1` - Immediate fix script
- `Microsoft.PowerShell_profile.ps1` - Profile configuration
- `Install-PowerShell-Profile.ps1` - Automatic installer
- `POWERSHELL-PAGER-FIX-README.md` - This documentation

## Support
If you continue to have issues after applying these fixes, the problem may be:
1. Git installation issues
2. PowerShell version compatibility
3. System-specific configuration conflicts

Try running the installation script first, as it handles most common scenarios automatically.
