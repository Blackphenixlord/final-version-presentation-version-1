# start-production.ps1 — Build frontend, then start the backend serving everything.
# The backend serves the built frontend at / and API at /api.
# Works with Tailscale: any device on your tailnet can reach the app.
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Join-Path $repoRoot "nasa-hunch"
$serverPath = Join-Path $repoRoot "dlsm-temp\dlsm-inv-sys-client-main\services\edge-server"

# ── 1. Build the frontend ──────────────────────────
Write-Host "`n=== Building frontend ===" -ForegroundColor Cyan
Set-Location $frontendPath

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..."
    npm install
}
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Frontend built to: $(Join-Path $frontendPath 'dist')" -ForegroundColor Green

# ── 2. Start the backend (serves API + frontend) ───
Write-Host "`n=== Starting production server ===" -ForegroundColor Cyan
Set-Location $serverPath

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..."
    npm install
}

# Load .env if present
$envPath = Join-Path $serverPath ".env"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $name = $parts[0].Trim()
            $value = $parts[1]
            if ($name) { Set-Item -Path "Env:$name" -Value $value }
        }
    }
}

$env:NO_DB = "1"

# Detect Tailscale
try {
    $tsStatus = & tailscale status --json 2>$null | ConvertFrom-Json
    if ($tsStatus -and $tsStatus.Self -and $tsStatus.Self.TailscaleIPs) {
        $tsIP = $tsStatus.Self.TailscaleIPs[0]
        $env:TAILSCALE_HOST = $tsIP
        Write-Host "`nTailscale active!" -ForegroundColor Cyan
        Write-Host "  Local:     http://localhost:$($env:PORT ?? '8080')/" -ForegroundColor White
        Write-Host "  Tailscale: http://${tsIP}:$($env:PORT ?? '8080')/" -ForegroundColor Green
        Write-Host "  Share that Tailscale URL with anyone on your tailnet.`n" -ForegroundColor Gray
    }
} catch {
    Write-Host "(Tailscale not detected — using localhost only)" -ForegroundColor Yellow
}

$port = if ($env:PORT) { $env:PORT } else { "8080" }
Write-Host "Server starting on port $port..."
Write-Host "  All routes: /, /crew, /ground, /demo, /trifold"
Write-Host "  API:        /api/*`n"

node src/server.mjs
