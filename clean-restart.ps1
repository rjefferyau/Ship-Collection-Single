Write-Host "Cleaning Next.js cache and restarting server..." -ForegroundColor Green

# Set error action preference to continue on errors
$ErrorActionPreference = "Continue"

# Kill all Node.js processes
Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow
taskkill /f /im node.exe 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Node.js processes terminated successfully." -ForegroundColor Green
} else {
    Write-Host "No Node.js processes were running." -ForegroundColor Yellow
}

# Wait a moment to ensure processes are fully terminated
Start-Sleep -Seconds 2

# Remove Next.js build directories
Write-Host "Removing Next.js build directories..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dev-build -ErrorAction SilentlyContinue

# Clear webpack cache
Write-Host "Clearing webpack cache..." -ForegroundColor Yellow
$webpackCacheDirs = @(
    ".next/cache",
    "dev-build/cache",
    "node_modules/.cache"
)

foreach ($dir in $webpackCacheDirs) {
    if (Test-Path $dir) {
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
        Write-Host "Cleared cache in $dir" -ForegroundColor Green
    }
}

# Fix problematic modules
Write-Host "Fixing problematic modules..." -ForegroundColor Yellow
$linuxModule = "node_modules\@next\swc-linux-x64-musl"
if (Test-Path $linuxModule) {
    Remove-Item -Recurse -Force $linuxModule -ErrorAction SilentlyContinue
    Write-Host "Removed problematic Linux module." -ForegroundColor Green
    # Create empty directory with package.json to prevent errors
    New-Item -ItemType Directory -Force -Path $linuxModule | Out-Null
    New-Item -ItemType File -Force -Path "$linuxModule\package.json" -Value "{}" | Out-Null
}

# Clear npm cache (optional, can be commented out for faster restarts)
# Write-Host "Clearing npm cache..." -ForegroundColor Yellow
# npm cache clean --force

# Wait a moment to ensure file handles are released
Start-Sleep -Seconds 2

# Install dependencies (optional, uncomment if needed)
# Write-Host "Reinstalling dependencies..." -ForegroundColor Yellow
# npm install

# Start the development server
Write-Host "Starting Next.js development server..." -ForegroundColor Green
npm run dev 