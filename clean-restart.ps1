Write-Host "Starting cleanup process..." -ForegroundColor Cyan

# Stop any running Node.js processes
Write-Host "Stopping any running Node.js processes..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.ProcessName -eq "node" } | ForEach-Object { 
    try {
        $_.Kill()
        Write-Host "Killed process: $($_.Id)" -ForegroundColor Green
    } catch {
        Write-Host "Failed to kill process: $($_.Id)" -ForegroundColor Red
    }
}

# Clean up Next.js cache and build directories
Write-Host "Removing Next.js cache and build directories..." -ForegroundColor Yellow
$directories = @(
    ".next",
    "node_modules/.cache"
)

foreach ($dir in $directories) {
    if (Test-Path $dir) {
        try {
            Remove-Item -Path $dir -Recurse -Force
            Write-Host "Removed: $dir" -ForegroundColor Green
        } catch {
            Write-Host "Failed to remove: $dir" -ForegroundColor Red
            Write-Host $_.Exception.Message
        }
    } else {
        Write-Host "Directory not found: $dir" -ForegroundColor Gray
    }
}

# Clean up temporary files
Write-Host "Removing temporary files..." -ForegroundColor Yellow
$tempFiles = Get-ChildItem -Path "." -Include "*.log", "*.tmp", "*.temp" -File -Recurse
foreach ($file in $tempFiles) {
    try {
        Remove-Item -Path $file.FullName -Force
        Write-Host "Removed: $($file.FullName)" -ForegroundColor Green
    } catch {
        Write-Host "Failed to remove: $($file.FullName)" -ForegroundColor Red
    }
}

# Clear npm cache
Write-Host "Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Restart the development server
Write-Host "Starting development server..." -ForegroundColor Cyan
npm run dev:fast

Write-Host "Cleanup process completed!" -ForegroundColor Green 