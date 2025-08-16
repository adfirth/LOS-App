# PowerShell script to update HTML file references to new folder structure

$htmlFiles = @(
    "pages/login.html",
    "pages/register.html", 
    "pages/admin.html",
    "pages/rules.html",
    "pages/table.html"
)

foreach ($file in $htmlFiles) {
    if (Test-Path $file) {
        Write-Host "Updating $file..."
        
        # Read file content
        $content = Get-Content $file -Raw
        
        # Update CSS reference
        $content = $content -replace 'href="style\.css"', 'href="../assets/style.css"'
        $content = $content -replace 'href="style\.css\?v=1\.1"', 'href="../assets/style.css?v=1.1"'
        
        # Update image references
        $content = $content -replace 'src="images/', 'src="../assets/images/'
        
        # Update script references
        $content = $content -replace 'src="config/', 'src="../config/'
        $content = $content -replace 'src="src/', 'src="../src/'
        
        # Write updated content back
        Set-Content $file $content -Encoding UTF8
        
        Write-Host "Updated $file"
    }
}

Write-Host "All HTML files updated!"
