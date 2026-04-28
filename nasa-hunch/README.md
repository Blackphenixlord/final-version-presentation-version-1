# NASA HUNCH Inventory UI

Nord-themed warehouse UI with Crew, Ground, and Warehouse views. The frontend runs in the nasa-hunch folder and connects to a mock backend in dlsm-temp/dlsm-inv-sys-client-main.

## Features

- Nord color theme across Login, Crew, Ground, and Warehouse views.
- Receive, Tag, Pack, Stow, and Move workflows.
- Badge-based login routing (Crew/Ground).
- Mock backend with seeded items, locations, and RFID tags.
- Responsive layout and consistent UI patterns.

## Project Structure

- Frontend: nasa-hunch
  - src/views: CrewView, GroundView, WarehouseView
  - src/screens: Receive/Tag/Pack/Stow/Move screens
  - src/screens/Login.tsx: badge login
- Backend: dlsm-temp/dlsm-inv-sys-client-main
  - dev-server/server.mjs: mock API and tag seeding

## Prerequisites

- Node.js 22.12+ or 20.19+ (Vite requirement)
- npm

## Quick Start (PowerShell)

Start the backend:

```powershell
cd "c:\Users\joshu\Downloads\full-NASA-final-straw-version (1)\full-NASA-final-straw-version"
./start-server.ps1
```

Start the frontend:

```powershell
cd "c:\Users\joshu\Downloads\full-NASA-final-straw-version (1)\full-NASA-final-straw-version"
./start-frontend.ps1
```

Open:

- Frontend: http://localhost:5173
- Ground view: http://localhost:5173/ground

## Manual Start

Backend:

```powershell
cd "c:\Users\joshu\Downloads\full-NASA-final-straw-version (1)\full-NASA-final-straw-version\dlsm-temp\dlsm-inv-sys-client-main\services\edge-server"
$env:NO_DB = "1"
node src/server.mjs
```

Frontend:

```powershell
cd "c:\Users\joshu\Downloads\full-NASA-final-straw-version (1)\full-NASA-final-straw-version\nasa-hunch"
npm run dev
```

## Configuration

The frontend calls /api and is proxied to the backend in dev. To override the API base, set:

```powershell
$env:VITE_API_BASE="http://127.0.0.1:8080/api"
```

## Badge and Item Tags

- Login badge IDs are in src/screens/Login.tsx (BADGES map).
- Backend badge exclusions are in dev-server/server.mjs (BADGE_TAGS).
- Item tag seeds are in dev-server/server.mjs (SEED_ITEM_TAGS), with a merge from REQUESTED_ITEM_TAGS.

## Routes

- / (Login)
- /crew
- /ground
- /warehouse

## Troubleshooting

- Vite warning about Node version: upgrade to Node 22.12+ or 20.19+.
- Blank page: verify backend on http://localhost:8080 and frontend on http://localhost:5173.
- Port in use: stop any process on 5173 or choose a different port.

## Development Scripts

- npm run dev: start frontend dev server
- npm run build: build for production
- npm run preview: preview build

## Quality Gates

From `nasa-hunch`:

- `npm run lint`
- `npm run build`

From `dlsm-temp/dlsm-inv-sys-client-main/services/edge-server`:

- `npm test`

CI now runs these checks automatically via `.github/workflows/ci.yml`.
