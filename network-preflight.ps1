param(
    [int]$Port = 8080
)

$ErrorActionPreference = "Stop"

function Test-Endpoint {
    param([string]$Url)
    try {
        $resp = Invoke-RestMethod -Uri $Url -TimeoutSec 5
        return @{ ok = $true; body = $resp }
    }
    catch {
        return @{ ok = $false; error = $_.Exception.Message }
    }
}

Write-Host "== Network Preflight ==" -ForegroundColor Cyan
Write-Host "Target Port: $Port"

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    $pids = $listener | Select-Object -ExpandProperty OwningProcess -Unique
    Write-Host "Listening on $Port by PID(s): $($pids -join ', ')" -ForegroundColor Green
}
else {
    Write-Host "No listener detected on port $Port" -ForegroundColor Yellow
}

$local = Test-Endpoint -Url ("http://localhost:{0}/api/health" -f $Port)
if ($local.ok) {
    Write-Host "Local health: OK" -ForegroundColor Green
}
else {
    Write-Host "Local health: FAIL ($($local.error))" -ForegroundColor Red
}

$tsIP = $null
try {
    $ts = tailscale status --json | ConvertFrom-Json
    if ($ts.BackendState -eq "Running") {
        Write-Host "Tailscale: Running" -ForegroundColor Green
    }
    else {
        Write-Host "Tailscale backend state: $($ts.BackendState)" -ForegroundColor Yellow
    }
    if ($ts.Self -and $ts.Self.TailscaleIPs -and $ts.Self.TailscaleIPs.Count -gt 0) {
        $tsIP = $ts.Self.TailscaleIPs[0]
        Write-Host "Tailnet IP: $tsIP"
    }
}
catch {
    Write-Host "Tailscale status unavailable: $($_.Exception.Message)" -ForegroundColor Yellow
}

if ($tsIP) {
    $tail = Test-Endpoint -Url ("http://{0}:{1}/api/health" -f $tsIP, $Port)
    if ($tail.ok) {
        Write-Host "Tailnet health: OK" -ForegroundColor Green
    }
    else {
        Write-Host "Tailnet health: FAIL ($($tail.error))" -ForegroundColor Red
    }
}

Write-Host "== Preflight Complete ==" -ForegroundColor Cyan
