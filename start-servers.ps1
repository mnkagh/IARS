$ErrorActionPreference = 'Continue'
$root = 'C:\Users\Monika\Projects\IARS'
$node = 'C:\Program Files\nodejs\node.exe'
$npm = 'C:\Program Files\nodejs\npm.cmd'

function Stop-Port($port) {
  $pids = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -ErrorAction SilentlyContinue
  foreach ($id in $pids) {
    if ($id) { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue }
  }
}

Stop-Port 4000
Stop-Port 5173
Start-Sleep -Seconds 2

$beOut = Join-Path $root 'backend\out.log'
$beErr = Join-Path $root 'backend\err.log'
$feOut = Join-Path $root 'frontend\out.log'
$feErr = Join-Path $root 'frontend\err.log'
foreach ($f in @($beOut, $beErr, $feOut, $feErr)) { if (Test-Path $f) { Remove-Item $f -Force } }

Start-Process -FilePath $node -ArgumentList 'dist/server.js' -WorkingDirectory (Join-Path $root 'backend') `
  -RedirectStandardOutput $beOut -RedirectStandardError $beErr -WindowStyle Hidden | Out-Null

Start-Process -FilePath $npm -ArgumentList 'run', 'dev' -WorkingDirectory (Join-Path $root 'frontend') `
  -RedirectStandardOutput $feOut -RedirectStandardError $feErr -WindowStyle Hidden | Out-Null

Start-Sleep -Seconds 9

Write-Host '--- listeners ---'
foreach ($port in 4000, 5173) {
  $up = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  Write-Host ("port {0}: {1}" -f $port, ($(if ($up) { 'LISTENING' } else { 'DOWN' })))
}
Write-Host '--- backend health ---'
try { (Invoke-RestMethod 'http://localhost:4000/health' -TimeoutSec 4).message } catch { Write-Host "down: $($_.Exception.Message)" }
Write-Host '--- frontend ---'
try { $r = Invoke-WebRequest 'http://localhost:5173' -UseBasicParsing -TimeoutSec 4; Write-Host "HTTP $($r.StatusCode)" } catch { Write-Host "down: $($_.Exception.Message)" }