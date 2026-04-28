# Full NASA HUNCH + DLSM Workspace

This repository contains the full workspace used in the NASA HUNCH inventory UI work along with the DLSM reference systems and mock services. It is organized as a multi-folder repo with separate frontend apps and a mock server.

## Contents

- **nasa-hunch/** – Main React + TypeScript + Vite UI (Ground/Crew/Warehouse views).
- **dlsm-temp/** – DLSM client + mock server and schemas (includes dev-server and edge-server services).
- **DLSM-FINAL-SYSTEM/** – Reference UI used for visual and UX alignment.
- **start-frontend.ps1** – Starts the main UI from `nasa-hunch`.
- **start-server.ps1** – Starts the edge-server API from `dlsm-temp/dlsm-inv-sys-client-main/services/edge-server` (NO_DB mode).
- **PROJECT_OVERVIEW.md** – High-level project notes.

## Requirements

- **Node.js**: 22.12+ (or 20.19+). Node 22.12 was used in development.
- **Windows PowerShell** (for the provided `.ps1` scripts).

## Quick Start

### 1) Start the frontend UI

Run from the repo root:

```powershell
./start-frontend.ps1
```

This runs the Vite dev server for the main UI in `nasa-hunch`.

### 2) Start the mock server

Run from the repo root:

```powershell
./start-server.ps1
```

This starts the API server used by the UI (memory mode).

### Linux (Jetson/Raspberry Pi)

```bash
chmod +x ./setup-linux.sh
./setup-linux.sh --role jetson
# unattended mode
./setup-linux.sh --role jetson --yes
```

For Raspberry Pi client setup:

```bash
./setup-linux.sh --role pi
```

See `SETUP_REQUIREMENTS.md` and `LINUX_SETUP_AND_CONNECT.md` for Jetson host + Raspberry Pi client topology over Tailscale.

## Manual Start (Optional)

### Frontend

```powershell
cd nasa-hunch
npm install
npm run dev
```

### Mock Server

```powershell
cd dlsm-temp/dlsm-inv-sys-client-main/services/edge-server
npm install
$env:NO_DB = "1"
node src/server.mjs
```

## Project Highlights

- **Nord-themed UI** across Ground/Crew/Warehouse views.
- **Consistent top bar time** and sidebar navigation with icon buttons.
- **Warehouse flow screens** (Receive/Tag/Pack/Stow/Move) updated for spacing, layout, and responsiveness.
- **Tag seed data** managed in the mock server to limit visible badges in the UI.

## Folder Notes

- `nasa-hunch/src/views/` contains `GroundView`, `CrewView`, and `WarehouseView`.
- `nasa-hunch/src/screens/` contains warehouse operational screens.
- `dlsm-temp/dlsm-inv-sys-client-main/services/edge-server/src/server.mjs` hosts the API.
- `DLSM-FINAL-SYSTEM/frontend-dslm-main` is reference-only.

## Ports

- Frontend (Vite): http://localhost:5173
- API server: http://localhost:8080

## Subproject Docs

- NASA HUNCH UI docs: [nasa-hunch/README.md](nasa-hunch/README.md)
- DLSM client + services: [dlsm-temp/README.md](dlsm-temp/README.md)
- Reference UI: [DLSM-FINAL-SYSTEM/frontend-dslm-main/README.md](DLSM-FINAL-SYSTEM/frontend-dslm-main/README.md)

## Troubleshooting

- If the UI shows a blank page, make sure Node is 22.12+ and dependencies are installed.
- If ports are in use, stop the old process or update the port in the corresponding Vite or server config.

## License

See individual subfolders for their respective licenses.
