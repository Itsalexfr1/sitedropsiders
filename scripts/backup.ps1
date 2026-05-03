$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$backupPath = "backups\backup_dropsiders_$timestamp.zip"
Write-Host "Starting backup to $backupPath..."
$items = Get-ChildItem -Exclude "node_modules", ".git", "dist", ".wrangler", "backups"
Compress-Archive -Path $items.FullName -DestinationPath $backupPath -Force
Write-Host "Backup completed successfully."
