$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Join-Path $repoRoot "nasa-hunch"
Set-Location $frontendPath

Write-Host "Starting frontend (Vite dev server)..."
Write-Host "URL: http://localhost:5173/"

npm run dev
