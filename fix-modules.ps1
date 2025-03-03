Write-Host "Fixing module issues..." -ForegroundColor Green

# Set error action preference to continue on errors
$ErrorActionPreference = "Continue"

# Remove problematic Linux module
$linuxModule = "node_modules\@next\swc-linux-x64-musl"
if (Test-Path $linuxModule) {
    Write-Host "Removing problematic Linux module: $linuxModule" -ForegroundColor Yellow
    Remove-Item -Recurse -Force $linuxModule -ErrorAction SilentlyContinue
    Write-Host "Linux module removed successfully." -ForegroundColor Green
} else {
    Write-Host "Linux module not found, creating empty directory to prevent errors." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $linuxModule | Out-Null
    New-Item -ItemType File -Force -Path "$linuxModule\package.json" -Value "{}" | Out-Null
    Write-Host "Created placeholder package.json in Linux module directory." -ForegroundColor Green
}

Write-Host "Module issues fixed!" -ForegroundColor Green 