# Script to reset PostgreSQL 'postgres' superuser password to 'root'
param(
  [string]$NewPassword = "root"
)

$dataPath = "C:\Program Files\PostgreSQL\18\data"
$binPath = "C:\Program Files\PostgreSQL\18\bin"
$hbaFile = "$dataPath\pg_hba.conf"
$hbaBak = "$dataPath\pg_hba.conf.bak"
$serviceName = "postgresql-x64-18"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " PostgreSQL Password Reset Tool -> $NewPassword" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Backup if not already backed up
if (-not (Test-Path $hbaBak)) {
  Copy-Item $hbaFile $hbaBak -Force
  Write-Host "✓ Created backup of pg_hba.conf" -ForegroundColor Green
}

# 2. Modify pg_hba.conf to trust localhost
Write-Host "Updating pg_hba.conf to trust mode..." -ForegroundColor Cyan
$content = Get-Content $hbaFile -Raw
$newContent = $content -replace "host\s+all\s+all\s+127\.0\.0\.1/32\s+scram-sha-256", "host    all             all             127.0.0.1/32            trust"
$newContent = $newContent -replace "host\s+all\s+all\s+::1/128\s+scram-sha-256", "host    all             all             ::1/128                 trust"
[IO.File]::WriteAllText($hbaFile, $newContent)

# 3. Restart service with trust mode
Write-Host "Restarting PostgreSQL service..." -ForegroundColor Cyan
Restart-Service -Name $serviceName -Force
Start-Sleep -Seconds 2

# 4. Alter user password to target
Write-Host "Setting password for user 'postgres' to '$NewPassword'..." -ForegroundColor Cyan
$sql = "ALTER USER postgres WITH PASSWORD '$NewPassword';"
& "$binPath\psql.exe" -U postgres -h localhost -w -c $sql
if ($LASTEXITCODE -eq 0) {
  Write-Host "✓ Password successfully changed to '$NewPassword'!" -ForegroundColor Green
} else {
  Write-Host "✗ Failed to alter user password via psql" -ForegroundColor Red
}

# 5. Restore original scram-sha-256 config
Write-Host "Restoring authentication mode to scram-sha-256..." -ForegroundColor Cyan
if (Test-Path $hbaBak) {
  Copy-Item $hbaBak $hbaFile -Force
}

# 6. Restart service again to enforce new password
Write-Host "Restarting PostgreSQL service to enforce authentication..." -ForegroundColor Cyan
Restart-Service -Name $serviceName -Force
Start-Sleep -Seconds 2

# 7. Verify new password
Write-Host "Verifying connection with new password '$NewPassword'..." -ForegroundColor Cyan
$env:PGPASSWORD = $NewPassword
& "$binPath\psql.exe" -U postgres -h localhost -w -c "SELECT 'Connection Verified! User:' as status, current_user;"
if ($LASTEXITCODE -eq 0) {
  Write-Host "==========================================" -ForegroundColor Green
  Write-Host " SUCCESS! PostgreSQL password is now: $NewPassword" -ForegroundColor Green
  Write-Host "==========================================" -ForegroundColor Green
} else {
  Write-Host "Verification failed. Please check service status." -ForegroundColor Red
}

Write-Host "Press any key to close..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
