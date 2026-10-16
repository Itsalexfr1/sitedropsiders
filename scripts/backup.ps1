$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$backupPath = "backups\backup_dropsiders_$timestamp.zip"
Write-Host "Starting backup to $backupPath..."

if (-not (Test-Path "backups")) {
    New-Item -ItemType Directory -Path "backups" | Out-Null
}

$items = (Get-ChildItem -Exclude "node_modules", ".git", "dist", ".wrangler", "backups").Name

if (Get-Command tar.exe -ErrorAction SilentlyContinue) {
    Write-Host "Using tar.exe for high-performance archiving..."
    & tar.exe -a -c -f $backupPath --exclude "node_modules" --exclude ".git" --exclude "dist" --exclude ".wrangler" --exclude "backups" $items
} else {
    Write-Host "Using Compress-Archive..."
    $fullPaths = (Get-ChildItem -Exclude "node_modules", ".git", "dist", ".wrangler", "backups").FullName
    Compress-Archive -Path $fullPaths -DestinationPath $backupPath -Force
}

if (Test-Path $backupPath) {
    $sizeBytes = (Get-Item $backupPath).Length
    $sizeMB = [math]::Round($sizeBytes / 1MB, 2)
    $sizeGB = [math]::Round($sizeBytes / 1GB, 2)
    Write-Host "Backup completed successfully: $backupPath"
    Write-Host "Backup size: $sizeMB MB ($sizeGB GB)"
} else {
    Write-Error "Backup file was not created!"
}

