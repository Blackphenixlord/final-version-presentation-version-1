# DSLM Supply Chain Backend — README for an Autonomous Builder (AI)

You are an AI language model tasked with building the backend for a logistics + inventory system used to manage **nested containers** and **stowage locations** (regular slots + irregular footprints) aboard a Deep Space Logistics Module (DSLM). The frontend you integrate with is **currently a mock** and will evolve into a real operational UI. This README is meant to replace missing human context: it defines **what the backend must do**, what is **placeholder**, what is **real**, and what standards you must follow so the system can transition from mock → production without rewrites.

This document is intentionally explicit. If you implement what’s here, the frontend can become “real” by swapping mock scan → backend scan, and by gradually enforcing more domain constraints (capacity rules, scan verification, etc.) without changing core data structures.

---

## 0) Non-negotiable mindset

### You are building two things at once

1. **A mock-compatible backend** that can power the existing UI today.
2. **A production-shaped backend** whose data model and APIs won’t collapse when real inventory + scanning arrive.

Your default policy when uncertain:

- **Do not corrupt state**
- **Always audit**
- **Prefer deterministic behavior**
- **Keep UI unblocked** (synthetic fallback allowed early)
- **Make constraints configurable** (so later rules don’t require schema changes)

---

## 1) Domain in plain English

The DSLM contains storage areas. Items can be placed directly in a location or inside containers that are placed in a location. Containers can contain other containers. So the inventory forms a tree:

**Slot → CTB → CTB → BOB → MEAL** (example)

The system must track:

- **What exists** (nodes)
- **How nodes nest** (parent/children relationships)
- **Where nodes are stowed** (regular slot vs irregular footprint vs not stowed)
- **How nodes move** (atomic move operations with audit)
- **Whether destinations are blocked** (reserved / occupied behaves the same: block + warning)

---

## 2) Key terms

### Node (inventory entity)

A unique object in the inventory graph. Nodes have kinds:

- `CTB` — container
- `BOB` — container-like grouping unit
- `PKG` — container-like package
- `MEAL` — item leaf (may carry food metadata)
- `ITEM` — generic leaf

### Location

Two major regimes:

#### Regular slot (discrete)

A top-level location key like: `S1-L11`  
(Think “Shelf 1, Location 11” or similar.)

A regular slot may hold one **top-level** container (typically CTB) which then contains nested contents.

#### Irregular footprint (grid)

A shelf like `C1` or `C2` with a grid of cells (row/col) at a depth.
Irregular items occupy a **footprint** (a set of cells), not a single slot.

### Blocked location states

- `available`
- `reserved` (blocked)
- `occupied` (blocked)

**Required behavior:** reserved and occupied behave the same: **cannot be chosen** + show big warning. Backend must enforce this too.

---

## 3) What the current frontend is doing (IMPORTANT)

### 3.1 Location paths as strings

The UI currently represents a “deep selection” as a string path:

`S1-L15/CTB-6299/CTB-0720/PKG-4499/ITM-3902`

Meaning:

- top-level slot is `S1-L15`
- within that slot is `CTB-6299`
- inside that is `CTB-0720`
- inside that is `PKG-4499`
- inside that is `ITM-3902`

**The UI expects that paths can go “as deep as needed.”**

### 3.2 “Scan” is currently fake

The Scan buttons generate random deep paths using synthetic IDs (CTB-####, BOB-####, etc). This is a placeholder.

Your backend must support:

- Resolving path strings into a consistent structured response
- Returning a tree context for the path so the UI can render “what container is this in and what else is in it?”

### 3.3 The UI needs trees for From and To

The Move screen shows:

- **From** card: a scanned deep path
- **To** card: a scanned deep path
- Bottom: shows “Source container tree” and “Destination container tree”
  Currently those trees are simplified to ID-only nodes.

If the backend can provide tree context, the UI can stop generating synthetic graphs.

---

## 4) Core requirements

### 4.1 Must support nested moves anywhere

A move may involve:

- top-level CTB to another slot
- a node inside a CTB to another CTB
- a node 4 layers deep to a node 4 layers deep across the ship

### 4.2 Moves must be atomic

A move must either fully apply or not apply at all, including:

- parent changes
- stowage changes
- slot/cell occupancy changes
- event log entry

### 4.3 Must be auditable

Every move creates an immutable event with:

- who performed it
- when
- reason
- before and after chain (parent + location)
- identifiers of moved node + old/new parents

### 4.4 Must enforce blocked destinations

If destination is reserved or occupied:

- reject with **409 Conflict**
- return structured error:
  - blockedBy: reserved|occupied
  - message: human-readable

Reserved/occupied must behave the same (blocked), only wording differs.

---

## 5) Recommended architecture

### Minimal production-shaped stack (recommended)

- REST API (OpenAPI spec)
- PostgreSQL
- One “write service” responsible for moves (transaction boundary)
- Append-only event log

Why:

- Transactional integrity is essential.
- Audit log becomes mission-grade traceability.
- REST is easy to integrate with the current frontend.

---

## 6) Data model (recommended)

### 6.1 nodes

All inventory entities.

Fields:

- `id` (PK, text or uuid) — global unique ID
- `kind` (enum) — CTB/BOB/PKG/MEAL/ITEM
- `label` (text) — human-readable
- `parent_id` (FK nodes.id nullable)
- `metadata` (jsonb) — type-specific info (expiry, size, storageClass, etc.)
- timestamps

Constraints:

- `parent_id != id`
- application must prevent cycles

### 6.2 regular_slots

Discrete slots such as `S1-L11`.

Fields:

- `slot_key` (PK)
- `status` (available/reserved/occupied)
- `occupied_by_node_id` (FK nodes.id nullable)
- `reserved_reason` (text nullable)
- `updated_at`

Constraints:

- occupied implies occupied_by_node_id is not null
- reserved implies occupied_by_node_id is null

### 6.3 irregular storage

Model shelves and cells.

#### irregular_shelves

- `shelf_id` (PK) (e.g. C1, C2)
- geometry metadata: rows, cols, depths

#### irregular_cells

- composite PK: (shelf_id, depth, row, col)
- `status` (available/reserved/occupied)
- `occupied_by_node_id` (FK nodes.id nullable)
- `reserved_reason` (text nullable)

### 6.4 stowage (current location of a node)

One row per node that is stowed (or in transit), else none.

Fields:

- `node_id` (PK, FK nodes.id)
- `mode` (enum: regular_slot, irregular_footprint, in_transit, unstowed)
- `regular_slot_key` (nullable)
- `irregular_shelf_id`, `irregular_depth` (nullable)
- `footprint` (jsonb nullable) — list of cells for irregular storage
- `updated_at`

### 6.5 events (append-only)

Fields:

- `event_id` (PK)
- `event_type` (MOVE, STOW, UNSTOW, TAG, PACK, RECEIVE, etc.)
- `actor_id` (text)
- `reason` (text)
- `payload` (jsonb) — before/after snapshots
- `created_at`

**Never update or delete events.**

---

## 7) Identity and roles (standards)

Even if you don’t implement full auth now, the model must exist.

### Actors

- Operators (crew) using UI
- Supervisors (review/audit)
- System processes (sync/import)

### Minimum required fields in events

- `actor_id`
- `actor_role` (optional, can be in payload)
- `source` (UI, API, import)

### Authentication (phased)

Phase 0 (mock):

- accept `actorId` in request body

Phase 1:

- JWT or session auth, backend derives actorId from token

Phase 2:

- role-based permissions:
  - `operator`: move within allowed regions
  - `supervisor`: override reserved areas (if later allowed)
  - `admin`: manage reservations / schema data

---

## 8) Path strings and resolution (critical for integration)

### 8.1 Parsing rules

A “path” is:

- first segment: `slotKey` (e.g. `S1-L11`)
- remaining segments: chain IDs (CTB/BOB/PKG/MEAL/ITM etc)

Example:
`S1-L11/CTB-4490/ITM-8381`

- slotKey = S1-L11
- chain = [CTB-4490, ITM-8381]

### 8.2 Backend must provide a resolver endpoint

`POST /resolve-path`

Request:

```json
{ "path": "S1-L15/CTB-6299/CTB-0720/PKG-4499/ITM-3902" }
```

Response:

```json
{
  "slotKey": "S1-L15",
  "chainIds": ["CTB-6299", "CTB-0720", "PKG-4499", "ITM-3902"],
  "targetNodeId": "ITM-3902",
  "rootContainerId": "CTB-6299",
  "tree": {
    "rootId": "CTB-6299",
    "nodesById": {
      "CTB-6299": { "id": "CTB-6299", "childrenIds": ["CTB-0720"] },
      "CTB-0720": { "id": "CTB-0720", "childrenIds": ["PKG-4499"] },
      "PKG-4499": { "id": "PKG-4499", "childrenIds": ["ITM-3902"] },
      "ITM-3902": { "id": "ITM-3902", "childrenIds": [] }
    }
  },
  "isSynthetic": false
}
```

### 8.3 Synthetic fallback (allowed initially)

If the chain contains IDs not present yet, you may return:

- a synthesized tree that includes the provided IDs
- `isSynthetic: true`

This keeps the UI functional while real inventory ingestion is incomplete.

**Rule:** synthetic responses must be obvious and removable later via config flag:

- `ALLOW_SYNTHETIC_RESOLVE=true` (dev only)

---

## 9) Move execution API (required behavior)

### 9.1 Endpoint

`POST /moves`

Request:

```json
{
  "from": { "path": "S1-L11/CTB-8847/CTB-8854/BOB-8874/MEAL-8884" },
  "to": { "path": "S1-L15/CTB-5586/CTB-5687/BOB-5889" },
  "reason": "Space constraint",
  "actorId": "jamie.operator"
}
```

Response (success):

```json
{
  "ok": true,
  "movedNodeId": "MEAL-8884",
  "eventId": "evt_...",
  "before": { "path": "...", "parentId": "BOB-8874" },
  "after": { "path": "...", "parentId": "BOB-5889" }
}
```

Response (blocked):

```json
{
  "ok": false,
  "code": "LOCATION_BLOCKED",
  "blockedBy": "reserved",
  "message": "This destination is reserved."
}
```

### 9.2 Required semantics

- Determine moved node = last ID in `from.chainIds`
- Determine destination container = last ID in `to.chainIds` (or top CTB if only CTB)
- Validate destination is not blocked
- Validate no cycles (cannot move into itself/descendant)
- Apply atomically:
  - update moved node parent
  - update stowage if moving across slots/irregular regimes
  - update slot occupancy if moving a top-level CTB
  - insert event

### 9.3 Frontend clearing behavior (“Execute move clears everything”)

Frontend requirement: after user clicks Execute move, UI clears From/To/Reason/CTB fields.

Backend support:

- return `ok:true` quickly
- optionally return:
  - `"recommendedUiReset": true`

But the UI clears locally regardless; backend must not require additional steps.

---

## 10) Stowage constraints (configure now, enforce later)

Real stowage has constraints (size classes, capacity, allowed nesting). You likely do not have full rules yet. So:

### Implement now (minimum)

- prevent cycles
- prevent moving CTB into irregular footprint unless allowed
- block reserved/occupied

### Scaffold for later

Add configurable fields in node.metadata:

- `storageClass`: `standard_ctb` | `irregular_item` | `either`
- `sizeClass`: string/int
- `maxChildren`: int
- `allowedChildKinds`: array

Then later you can enforce capacity without schema changes.

---

## 11) Error handling standard

All errors are JSON with:

- `ok: false`
- `code` (machine readable)
- `message` (human readable)
- `details` (optional)

Use HTTP codes:

- `400` invalid input/path parse
- `404` node not found (if synthetic disabled)
- `409` blocked location / conflict / cycle attempt
- `422` validation failed (type mismatch, etc.)
- `500` unexpected

---

## 12) Seeding and mock compatibility

### Seed strategy

For dev, seed enough to satisfy the Move UI:

- Regular slots `S1-L01..S1-L16` etc
- Some reserved, some occupied
- A nested chain including:
  - `CTB -> CTB -> BOB -> MEAL`
  - `CTB -> CTB -> PKG -> ITM`

Gate seeds behind:

- `SEED_MOCK_DATA=true`

Mark seeded nodes:

- `metadata.isMock=true`

---

## 13) Concurrency and transactions

### Must use transactions for moves

Within a single transaction:

- read/lock the relevant destination state (slot or cells)
- apply updates
- write event

Use either:

- `SELECT ... FOR UPDATE` on destination occupancy rows
- or application-level advisory locks by destination key

The important thing: two operators cannot place into the same location concurrently.

---

## 14) Observability and audit requirements

Minimum:

- log move requests/outputs (excluding sensitive fields)
- expose:
  - `GET /events?limit=100&before=...`
- include event payload snapshots:
  - before path
  - after path
  - moved node id
  - parent before/after
  - location before/after

---

## 15) Deployment and environment variables (standard)

### Suggested env vars

- `DATABASE_URL`
- `PORT`
- `NODE_ENV=development|production`
- `SEED_MOCK_DATA=true|false`
- `ALLOW_SYNTHETIC_RESOLVE=true|false`
- `LOG_LEVEL=debug|info|warn|error`

---

## 16) Testing checklist (minimum)

### Unit tests

- path parsing
- resolve-path synthetic fallback
- cycle prevention
- blocked destination rejection

### Integration tests

- move across parents within same CTB
- move across slots
- reserved/occupied both reject with 409
- event log created exactly once per successful move
- transaction rollback on failure

---

## 17) Future features (do not implement yet, but design for)

- Scan verification: “move created → verify scan → execute”
- Draft moves stored server-side
- Operator overrides (supervisor unlock)
- Offline mode + sync merges (events become source of truth)
- Full capacity rules (size classes, CTB geometry)
- Search by contents (find MEALs by expiration, etc.)

---

## 18) One question to ask a human (if forced)

If you only get one clarification:

> Is containment a strict tree (one parent) or can a node belong to multiple containers (DAG)?

Default: strict tree.

---

## Appendix A — Example canonical move

From:
`S1-L11/CTB-8847/CTB-8854/BOB-8874/MEAL-8884`

To:
`S1-L15/CTB-5586/CTB-5687/BOB-5889`

Backend action:

- parent(MEAL-8884) changes from BOB-8874 → BOB-5889
- location of MEAL-8884 is implicitly under S1-L15 via container ancestry
- write MOVE event including before/after full chain

---

## Appendix B — Minimum endpoint list

- `POST /resolve-path`
- `GET  /nodes/:id`
- `GET  /nodes/:id/tree?maxDepth=4`
- `GET  /regular-slots`
- `GET  /irregular-shelves/:shelfId?depth=1`
- `POST /moves`
- `GET  /events?limit=100`
