# Command Reference

## Prereqs

- Node.js 22.12+ (or 20.19+)
- PowerShell

## Start (repo root)

```powershell
./start-frontend.ps1
./start-server.ps1
```

## Manual start

### Frontend (Vite)

```powershell
cd nasa-hunch
npm install
npm run dev
```

### API server (edge-server, NO_DB)

```powershell
cd dlsm-temp/dlsm-inv-sys-client-main/services/edge-server
npm install
$env:NO_DB = "1"
node src/server.mjs
```

## Ports

- Frontend: http://localhost:5173
- API: http://localhost:8080

## Git: new branch + sync

```powershell
git checkout -b <new-branch-name>
git add -A
git commit -m "Sync full workspace"
git push -u origin <new-branch-name>
```
