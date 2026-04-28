# Project Code Overview

## High-Level Architecture

This is a **NASA HUNCH** (High Schools United with NASA to Create Hardware) Deep Space Logistics Module (DSLM) inventory management system. It tracks items through a complete supply chain: **Vendor → Ground → Crew (ISS)**.

### 1. **NASA-HUNCH Frontend** (`nasa-hunch/`)

React 19 + TypeScript + Vite SPA with three user roles:

- **Ground View** — Warehouse operations at KSC: receive shipments, tag RFID, pack into CTBs, move items, stow into the 3D DSLM module, place purchase orders to vendors
- **Crew View** — Astronaut terminal on ISS: take out items, put back, dispose
- **Vendor View** — External supplier portal: view purchase orders from Ground, pick items, tag RFID, ship to Ground with invoices

### 2. **Edge Server Backend** (`dlsm-temp/dlsm-inv-sys-client-main/services/edge-server/`)

Fastify-based Node.js server:

- In-memory inventory (NO_DB=1 mode) or SQLite
- RFID tag management, stow locations, shipment tracking
- X-400/X-500 messaging system
- Badge authentication
- Purchase order and vendor ship APIs
- Runs on port 8080, Vite proxies from 5173

---

## Project Structure

```
nasa-hunch/                         # Primary React 19 + TypeScript app
├── src/
│   ├── App.tsx                     # BrowserRouter shell, routes
│   ├── main.tsx                    # Entry: StrictMode > ErrorBoundary > ThemeProvider > ParamsProvider > App
│   ├── index.css                   # CSS custom property theme system (dark/light)
│   ├── views/
│   │   ├── CrewView.tsx            # Crew: take out, put back, dispose
│   │   ├── GroundView.tsx          # Ground: dashboard, orders, receive, tag, pack, move, 3D module
│   │   ├── VendorView.tsx          # Vendor: orders from ground, pick, tag RFID, ship, invoices
│   │   └── WarehouseView.tsx       # Warehouse aggregate view
│   ├── screens/
│   │   ├── Login.tsx               # Badge scanner authentication (RFID wedge)
│   │   ├── ModuleView3D.tsx        # Three.js interactive DSLM 3D module (theme-aware)
│   │   ├── ReceiveScreen.tsx       # Count inbound items against manifest
│   │   ├── TagScreen.tsx           # Pair RFID tags to items
│   │   ├── PackScreen.tsx          # Nest items into CTBs with capacity check
│   │   ├── MoveScreen.tsx          # Relocate items with audit trail
│   │   └── space/
│   │       ├── AddScreen.tsx       # Crew: put back item
│   │       ├── RemoveScreen.tsx    # Crew: take out item
│   │       └── TrashScreen.tsx     # Crew: dispose item
│   ├── lib/
│   │   ├── theme.tsx               # ThemeProvider + useTheme hook (dark/light toggle, localStorage)
│   │   ├── api.ts                  # HTTP client & typed API calls
│   │   ├── apiBase.ts              # Base URL helper
│   │   ├── types.ts                # TypeScript interfaces
│   │   ├── store.ts                # Client-side mock data (legacy)
│   │   ├── ParamsContext.tsx        # Mission config provider (fetches /api/config)
│   │   └── useKeyboardWedgeScan.ts # RFID barcode scanner hook
│   └── styles/
│       └── global.css              # Additional global styles
├── vite.config.ts                  # Vite config, proxy → http://127.0.0.1:8080
├── index.html                      # Pre-react loader, crash display, error handlers
└── package.json

dlsm-temp/dlsm-inv-sys-client-main/
├── services/edge-server/           # Fastify backend
│   ├── src/                        # Server source
│   ├── db/                         # SQLite migrations/seeds
│   └── tests/                      # API tests
├── shared/
│   ├── openapi/mission-inventory.yaml
│   └── schemas/                    # JSON Schema definitions
└── dev-server/server.mjs           # Legacy mock server
```

---

## Core Components & Features

### Theme System (`src/lib/theme.tsx` + `src/index.css`)

- **CSS Custom Properties**: All colors defined as `--t-*` variables on `:root` / `[data-theme="dark"]` / `[data-theme="light"]`
- **Dark mode**: True black base (`#0b0e14`), light text, Nord-inspired accents
- **Light mode**: Clean white (`#f4f5f7`), dark text, deeper accent tones
- **Accent**: Orange (`#d08770` dark / `#c06a3c` light)
- **ThemeProvider**: React context, persists to localStorage, sets `data-theme` on `<html>`
- **Glass utility**: `.glass` class with `backdrop-filter: blur(16px)` + `@supports` fallback
- **RGB variants**: Every color has a `-rgb` companion for rgba() usage

### Views

#### GroundView (`src/views/GroundView.tsx`)

Ground control sidebar navigation with 7 operations:

1. **Dashboard** — Supply chain workflow diagram, live RFID activity feed, X-400/X-500 messages
2. **Orders** — Place purchase orders to vendor (creating POs with line items)
3. **Receive** — Count inbound items against shipment manifest
4. **Tag** — Pair RFID tags to item identities
5. **Pack** — Nest items into CTBs with capacity checking
6. **Move** — Relocate items with full audit trail
7. **3D Module** — Interactive Three.js DSLM visualization (stow items into slots)

#### CrewView (`src/views/CrewView.tsx`)

Astronaut terminal with 3 operations:

1. **Take out** — Remove item from module (RemoveScreen)
2. **Put back** — Return item to module (AddScreen)
3. **Throw away** — Dispose item with auto-scan (TrashScreen)

#### VendorView (`src/views/VendorView.tsx`)

External vendor portal with 4 tabs:

1. **My Orders** — View POs from Ground, pick items line by line, tag RFID, ship
2. **Invoices to Ground** — Auto-generated when shipping, tracks acknowledgment
3. **My Shipments** — Outbound shipment tracking
4. **Packing Rules** — NASA CTB requirements and order flow reference

### 3D Module (`src/screens/ModuleView3D.tsx`)

- **Three.js** via @react-three/fiber + @react-three/drei
- **Real DSLM geometry**: 3.7m diameter × 4m cylinder, stacks S-1/S-2/S-3, columns C1/C2, S-4 lockers
- **Theme-aware**: Dual dark/light color palettes, switches with app theme toggle
- **Live data**: Polls `/stow/locations` API every 4s, no hardcoded mock data
- **Ground mode**: Click empty slot → stow item via API
- **Features**: Search, filter (empty/occupied/reserved), activity feed, slot inspection, container tree viewer, receive dock, disposal zone
- **Starts empty**: Module has nothing until ground crew stows items

### Login (`src/screens/Login.tsx`)

- Badge scanner authentication via RFID keyboard wedge
- 120ms debounce for auto-submit on scan
- Falls back to hardcoded badges if server unreachable
- Test badges: crew `0003070837`, ground `0003104127`, vendor `0003200001`

### Error Handling (`src/main.tsx` + `index.html`)

- React ErrorBoundary wraps the app tree
- Pre-React `#crash-display` div with `window.onerror` + `window.onunhandledrejection` handlers
- Loading indicator shown before React boots

---

## Supply Chain Data Flow

```
Vendor                    Ground (KSC)              Crew (ISS)
──────                    ────────────              ──────────
                      ┌─ Place PO ──────→ (vendor sees order)
(pick items)          │
(tag RFID)            │
(ship to Ground) ────→│  Receive & count
                      │  Tag remaining
                      │  Pack into CTBs
                      │  Stow in 3D module
                      │  (launch to ISS) ──────→  Take out
                      │                           Put back
                      │                           Dispose
                      │                              │
                      │← X-400/X-500 messages ──────┘
```

### API Surface (Edge Server, port 8080)

```
Authentication:
  POST /auth/badge              Badge scan → actor + uiMode

Inventory:
  GET  /api/items               All items
  GET  /api/locations           Storage locations
  GET  /api/stocks              Stock records
  GET  /api/logs                Activity logs
  GET  /api/config              Mission configuration

RFID:
  GET  /rfid/active             Live RFID tag feed
  POST /rfid/scan               Process scan
  POST /rfid/map                Map tag → item
  GET  /rfid/unknown            Unmapped scans

Stow:
  GET  /stow/locations          All stow slots (for 3D module)
  POST /stow                    Stow item into slot

Shipments:
  GET  /shipments               All shipments
  GET  /shipments/inbound       Inbound shipments
  POST /vendor/ship             Vendor ships PO to Ground

Orders:
  GET  /ground/orders           Purchase orders
  POST /ground/orders           Create new PO
  PATCH /ground/orders/:id/status  Update order status

Messages:
  GET  /messages                X-400/X-500 messages

Containers:
  GET  /containers/:id/tree     Container contents tree
```

---

## Running the Project

```bash
# Terminal 1: Start backend (edge server)
cd dlsm-temp/dlsm-inv-sys-client-main/services/edge-server
NO_DB=1 SERVE_STATIC=1 node src/index.js    # port 8080

# Terminal 2: Start frontend (Vite dev server)
cd nasa-hunch
npm run dev                                  # port 5173, proxies to 127.0.0.1:8080

# Build & deploy to edge server
cd nasa-hunch
npm run build
# Copy dist/* to edge-server/static/
```

### Badge IDs for Testing

| Badge ID   | Role   | View       |
| ---------- | ------ | ---------- |
| 0003070837 | Crew   | CrewView   |
| 0003104127 | Ground | GroundView |
| 0003200001 | Vendor | VendorView |

---

## Key Technologies

### Frontend

- **React 19.1.1**: UI framework
- **TypeScript 5.9.3**: Type safety
- **Vite 7.1.7**: Lightning-fast bundler
- **React Router 7.9.4**: Client-side routing

### Backend

- **Node.js**: Runtime
- **Serialport 13.0.0**: RFID scanner hardware integration
- **PostgreSQL**: Optional database (for edge-server)
- **OpenAPI 3.0**: API schema definition

### Development

- **ESLint 9.38.0**: Code linting
- **Prettier 3.6.2**: Code formatting

---

## Screenshots Map (From Attachments)

1. **Receive Screen** - Shows inbound shipments (SHIP-8841, SHIP-8910, etc.)
   - Status indicators (In progress, Discrepancy, Waiting)
   - Expected vs Counted items
   - Manifest breakdown by meal type
   - Verify section with discrepancy flag

2. **Tag Screen** - RFID card scanning interface
   - UID input field with "Scan RFID or type UID" prompt
   - Selection pane showing items (MEAL-0001, MEAL-0002, BLOB-0001)
   - Pair + Verify section for pairing cards to items
   - Status: "Waiting" for scan input

3. **Pack Screen** - Container packing workflow
   - Outside/Inside scanning panes (Nothing selected)
   - Scan buttons for RFID/ID
   - Verify section with Outside/Inside contents counters
   - Room left / Inside size metrics
   - Pack & Clear all action buttons

4. **Stow Screen** - Storage location management
   - Stow tab selection (Top-level CTB / Irregular item)
   - Location grid (Shelf, Depth dimensions)
   - Warehouse layout visualization (L1-L16 slots)
   - Status: Standard CTB
   - Mark stowed action button

5. **Move Screen** - Item relocation
   - From/To location selection panels
   - Scan buttons for source & destination
   - Move reason dropdown (Space constraint)
   - Source & Destination container context
   - Execute move action button

---

## Current Status & Notes

### Implemented Features

✅ Two-role UI (Crew & Ground)
✅ RFID scanning support (keyboard wedge)
✅ Badge-based authentication
✅ Real-time inventory search
✅ IN/OUT transaction logging
✅ Item-to-location mapping
✅ Mock backend with REST API
✅ Dark theme UI

### Known Limitations

- Backend is in-memory (no persistence)
- RFID controller is placeholder UI
- No real database integration (yet)
- Limited error handling on some endpoints
- No user roles/permissions system (basic actor tracking only)

### Next Steps

- Integrate real database (PostgreSQL edge-server)
- Implement real RFID hardware drivers
- Add comprehensive error handling & validation
- Build admin dashboard for tag management
- Add mission-specific workflows (packing, stowing)
- Implement audit trail & compliance reporting

---

## How to Run

### Development

```bash
# Install dependencies
npm install
# or (in dlsm-temp root)
npm install

# Start dev server
npm run dev:server       # Backend (port 8080)
npm run dev              # Frontend (port 5173)

# Navigate
http://localhost:5173/   # Login page
http://localhost:5173/crew   # After crew badge scan
http://localhost:5173/ground # After ground badge scan
```

### Build

```bash
npm run build            # Frontend production bundle
npm run openapi:lint     # Validate OpenAPI schema
npm run fixtures:all     # Run test fixtures
```

---

## Code Quality & Patterns

### Component Patterns

- **Functional components** with hooks
- **useEffect** for side effects (API calls, event listeners)
- **useMemo** for expensive computations (lookups, filtering)
- **useState** for local UI state
- **Custom hooks** for reusable logic (useKeyboardWedgeScan, useParamsSafe)

### Error Handling

- Try-catch in async functions
- Error messages displayed in UI
- Console logging for debugging
- Graceful fallbacks for missing data

### Styling

- Inline CSS objects (no external CSS framework)
- Responsive grid layouts
- Dark theme throughout
- Consistent spacing & typography

### State Management

- Local component state for UI
- Context API for shared config
- Mock store for inventory data
- Backend as source of truth for persistence

---

This overview provides a complete picture of the codebase architecture, UI flows, and current implementation status.
