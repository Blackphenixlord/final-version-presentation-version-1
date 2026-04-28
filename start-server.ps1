param(
	[int]$PreferredPort = 8080,
	[switch]$AutoPortFallback = $true,
	[switch]$ReuseIfHealthy = $true
)

$ErrorActionPreference = "Stop"

function Test-ApiHealth {
	param(
		[string]$HostName,
		[int]$Port
	)
	try {
		$null = Invoke-RestMethod -Uri ("http://{0}:{1}/api/health" -f $HostName, $Port) -TimeoutSec 3
		return $true
	}
 catch {
		return $false
	}
}

function Get-FreePort {
	param([int]$StartPort)
	for ($p = $StartPort; $p -le ($StartPort + 40); $p++) {
		$inUse = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
		if (-not $inUse) { return $p }
	}
	throw "No free port found in range $StartPort-$($StartPort + 40)."
}

function Get-TailscaleIPv4 {
	try {
		$status = & tailscale status --json 2>$null | ConvertFrom-Json
		if ($status -and $status.Self -and $status.Self.TailscaleIPs) {
			foreach ($ip in $status.Self.TailscaleIPs) {
				if ($ip -match "^\d+\.\d+\.\d+\.\d+$") { return $ip }
			}
			return $status.Self.TailscaleIPs[0]
		}
	}
	catch {
		return $null
	}
	return $null
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverPath = Join-Path $repoRoot "dlsm-temp\dlsm-inv-sys-client-main\services\edge-server"
Set-Location $serverPath

if (-not $env:NO_DB) { $env:NO_DB = "1" }
if (-not $env:SERVE_STATIC) { $env:SERVE_STATIC = "1" }

# Load .env values into process env
$envPath = Join-Path $serverPath ".env"
if (Test-Path $envPath) {
	Get-Content $envPath | ForEach-Object {
		$line = $_.Trim()
		if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
			$parts = $line.Split("=", 2)
			$name = $parts[0].Trim()
			$value = $parts[1]
			if ($name) {
				Set-Item -Path "Env:$name" -Value $value
			}
		}
	}
}

$port = $PreferredPort
if ($env:PORT) {
	try { $port = [int]$env:PORT } catch { $port = $PreferredPort }
}

$tsIP = Get-TailscaleIPv4
if ($tsIP) {
	$env:TAILSCALE_HOST = $tsIP
}

$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($listener) {
	$ownerIds = $listener | Select-Object -ExpandProperty OwningProcess -Unique
	if ($ReuseIfHealthy -and (Test-ApiHealth -HostName "localhost" -Port $port)) {
		Write-Host "Backend already healthy on port $port; reusing existing process." -ForegroundColor Green
		Write-Host "URL: http://localhost:$port/"
		if ($tsIP) {
			Write-Host ("Tailnet URL: http://{0}:{1}/" -f $tsIP, $port) -ForegroundColor Cyan
		}
		return
	}

	if ($AutoPortFallback) {
		$newPort = Get-FreePort -StartPort ($port + 1)
		Write-Host "Port $port in use by PID(s): $($ownerIds -join ', '). Falling back to $newPort." -ForegroundColor Yellow
		$port = $newPort
	}
 else {
		throw "Port $port is already in use by PID(s): $($ownerIds -join ', ')."
	}
}

$env:PORT = [string]$port

if ($tsIP) {
	Write-Host "Tailscale detected: $tsIP" -ForegroundColor Cyan
}
else {
	Write-Host "(Tailscale not detected, using localhost only)" -ForegroundColor Yellow
}

Write-Host "Starting backend server..."
Write-Host "Local URL: http://localhost:$port/" -ForegroundColor Green
if ($tsIP) {
	Write-Host ("Tailnet URL: http://{0}:{1}/" -f $tsIP, $port) -ForegroundColor Cyan
}

node src/server.mjs
