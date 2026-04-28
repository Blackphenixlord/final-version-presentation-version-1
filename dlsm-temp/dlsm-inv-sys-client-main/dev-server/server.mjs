// dev-server/server.mjs
import http from "node:http";

/* ===================== Helpers (define BEFORE data) ===================== */
function _lcg(seed = 0xC0FFEE) {
  let s = seed >>> 0;
  return () => ((s = (1103515245 * s + 12345) >>> 0) / 0xffffffff);
}
const _rand = _lcg(0xC0FFEE);
const _pad = (n, w = 3) => String(n).padStart(w, "0");
const _pick = (arr) => arr[Math.floor(_rand() * arr.length)];
const _int = (min, max) => Math.floor(_rand() * (max - min + 1)) + min;

function normalizeHex(s) {
  return String(s || "").trim().toUpperCase().replace(/^0x/i, "");
}

/* ===================== Mock data (64 items) ===================== */
// Locations
const inventoryLocations = [
  { id: "LOC-A1", code: "A1", description: "Main bench left drawer" },
  { id: "LOC-R1", code: "R1", description: "Rack 1, Bin 3" },
  { id: "LOC-A2", code: "A2", description: "Main bench right drawer" },
  { id: "LOC-B1", code: "B1", description: "Aux bench top shelf" },
  { id: "LOC-B2", code: "B2", description: "Aux bench cabinet" },
  { id: "LOC-R2", code: "R2", description: "Rack 1, Bin 4" },
  { id: "LOC-R3", code: "R3", description: "Rack 2, Bin 1" },
  { id: "LOC-R4", code: "R4", description: "Rack 2, Bin 2" },
  { id: "LOC-R5", code: "R5", description: "Rack 3, Bin 1" },
  { id: "LOC-C1", code: "C1", description: "Cold storage crate 1" },
  { id: "LOC-C2", code: "C2", description: "Cold storage crate 2" },
  { id: "LOC-S1", code: "S1", description: "Spare parts wall hooks" },
];

// Items (seed 2 known, then generate to 64)
const inventoryItems = [
  { id: "ITEM-001", sku: "WRENCH-SET", name: "Wrench Set" },
  { id: "ITEM-002", sku: "BOLT-M6", name: "M6 Bolt (stainless)" },
  { id: "ITEM-003", sku: "SCREW-M6", name: "Machine Screw (M6)" },
  { id: "ITEM-004", sku: "WASHER-M8", name: "Flat Washer (M8)" },
  { id: "ITEM-005", sku: "GASKET-M10", name: "Silicone Gasket (M10)" },
  { id: "ITEM-006", sku: "O-RING-12", name: "O-Ring (12mm)" },
  { id: "ITEM-007", sku: "CLAMP-16", name: "Hose Clamp (16mm)" },
  { id: "ITEM-008", sku: "HOSE-1M", name: "Braided Hose (1m)" },
  { id: "ITEM-009", sku: "VALVE-1/4", name: "Check Valve (1/4\")" },
  { id: "ITEM-010", sku: "FILTER-10", name: "Inline Filter (10µm)" },
  { id: "ITEM-011", sku: "CABLE-2M", name: "Shielded Cable (2m)" },
  { id: "ITEM-012", sku: "TIE-100", name: "Cable Tie (100pcs)" },
  { id: "ITEM-013", sku: "FUSE-5A", name: "Blade Fuse (5A)" },
  { id: "ITEM-014", sku: "GAUGE-PSI", name: "Pressure Gauge (PSI)" },
  { id: "ITEM-015", sku: "BOLT-M4", name: "Bolt M4" }, // This is the one for 0004536987
];

// Per-location stock
const inventoryStocks = [
  { itemId: "ITEM-001", locationId: "LOC-A1", qty: 1, expiresAt: null },
  { itemId: "ITEM-002", locationId: "LOC-R1", qty: 87, expiresAt: null },
];

// Activity log
const activityLogs = [
  {
    id: "LOG-1001",
    timestamp: new Date().toISOString(),
    itemId: "ITEM-002",
    locationId: "LOC-R1",
    mode: "OUT",
    qty: 5,
    actor: "max",
    reason: "prototype build",
    workOrder: "WO-17",
  },
  {
    id: "LOG-1002",
    timestamp: new Date().toISOString(),
    itemId: "ITEM-002",
    locationId: "LOC-R1",
    mode: "IN",
    qty: 2,
    actor: "max",
  },
];

/* ===================== RFID mapping (card hex -> item + lastLocation) ===================== */
// Tag maps to an ITEM. Location is dynamic: whatever location you scan at.
// We remember lastLocationId so if Crew doesn’t choose a location, it still “follows” its last known place.
const rfidMap = new Map([
  ["3D00D51E2C", { itemId: "ITEM-001", lastLocationId: "LOC-A1" }], // WRENCH-SET
  ["3D00D51E2D", { itemId: "ITEM-002", lastLocationId: "LOC-R1" }], // BOLT-M6
]);

// ------------------------------------------------------------------
// Tag / Item seeding (dev-friendly)
// - BADGE_TAGS: reserved badge tags that should NOT be used for inventory
// - SEED_ITEM_TAGS: start with the user's provided 10 IDs, then generate
// - TAG_MAP: simple object mapping tag -> itemId for quick resolution
// We also mirror seeds into `rfidMap` with a lastLocationId for visibility.
// ------------------------------------------------------------------
const BADGE_TAGS = [
  "BADGE-MAX-1A2B",
  "BADGE-JOSH-3C4D",
  "BADGE-BEN-5E6F",
  "BADGE-CREW4-7A8B",
  "BADGE-GROUND-9C0D",
  // user RFIDs used as badges (confirm or change)
  "0004726482", // max
  "0004704735", // josh
  "0004661610", // ben
  "0004721084", // ground (added)
];

// create a normalized badge set for quick comparisons
const BADGE_SET = new Set(BADGE_TAGS.map((b) => normalizeHex(b)));

// Allowed CORS origins (helps when serving UI from different host/ips)
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://192.168.1.50:5173", // <-- add your PC IP:5173 if you access via IP
]);

function corsOrigin(req) {
  const o = req.headers?.origin;
  return o && ALLOWED_ORIGINS.has(o) ? o : null;
}

// Seeded item tag IDs (from your list, excluding crew/ground/login badges)
let SEED_ITEM_TAGS = [
  "0000939873", "0021038140", "0004647394", "0004713968", "0020963325",
  "0004753912", "0004557808", "0004647914", "0004745933", "0004713796",
  "0021062789", "0004727638", "0020956196", "0004610500", "0004559102",
  "0004645381", "0004757103", "0004609889", "0004646785", "0004754438",
  "0004630068", "0004435432", "0004425272", "0004545073", "0004634487",
  "0004518470", "0004435082", "0004630838", "0004411969", "0004714575",
  "0021100208", "0020828300", "0000826265", "0004539060", "0004719606",
  "0004748442", "0021004259", "0004714026", "0021028512", "0021045757",
  "0004705963", "0004631172", "0004753310", "0004752080", "0004553214",
  "0004740067", "0004719829", "0004646391", "0004747475", "0004735058",
  "0021018361", "0020907723", "0000718936", "0021012850", "0004755745",
  "0020915771", "0004726516", "0020864329", "0020963041", "0021104587",
  "0004531146", "0004621363", "0004537563", "0004602736", "0004706335",
  "0008525594", "0004550716", "0004604353", "0004560853", "0004505020",
  "0004617890", "0004558495", "0004622717", "0004654992", "0004614065",
  "0004527093", "0004533292", "0004505655", "0004602779", "0004603948",
  "0004715183", "0004600596", "0004544991", "0004536987", "0004713559",
  "0004526322", "0004436042", "0004723996", "0004646679", "0004729656",
  "0004530513", "0004523569", "0004562378", "0004521124", "0004515694",
  "0004556655", "0004756283", "0020940074", "0004352907", "0020849167",
  "0020900557", "0021037982", "0021037416", "0021100242", "0020948231",
  "0020920668", "0004653568", "0004717292", "0004737836", "0004755698",
  "0004743164", "0004554682", "0004627941", "0004707498", "0004618731",
  "0004722855", "0021039578", "0020829208", "0020939658", "0020911841",
  "0020922978", "0021054555", "0020849918", "0020954675", "0020857821",
  "0021000680", "0020844852", "0020935556", "0020962119", "0021008235",
  "0020851706", "0020843229", "0020932638", "0020818701", "0020919185",
  "0021001511", "0004616670", "0004760437", "0004702121", "0004747984",
  "0004623794", "0004759383", "0004703884", "0004758755", "0004723935",
  "0004656181", "0004641468", "0004801066", "0004711671", "0004565137",
  "0004541182", "0004650556", "0004649962", "0004647642", "0004730237",
  "0004761846", "0020858627", "0020911625", "0020957328", "0020849840",
  "0021057964", "0021027793", "0020818271", "0020921622", "0004417420",
  "0020864509", "0004441983", "0004462902", "0004324121", "0004433367",
  "0004450062", "0004660509", "0004761614", "0004705983", "0004547915",
  "0004657985", "0004613202", "0004564583", "0004743862", "0004711657",
  "0004545825", "0004516396", "0004743277", "0004642211", "0004618427",
  "0004711606", "0004714412", "0004648630", "0004734198", "0004626706",
  "0004613219", "0004725837",
];

const REQUESTED_ITEM_TAGS = [
  "0000939873","0021038140","0004647394","0004713968","0020963325","0004753912","0004557808","0004647914","0004745933","0004713796",
  "0021062789","0004727638","0020956196","0004610500","0004559102","0004645381","0004757103","0004609889","0004646785","0004754438",
  "0004630068","0004435432","0004425272","0004545073","0004634487","0004518470","0004435082","0004630838","0004411969","0004714575",
  "0021100208","0020828300","0000826265","0004539060","0004719606","0004748442","0021004259","0004714026","0021028512","0021045757",
  "0004705963","0004631172","0004753310","0004752080","0004553214","0004740067","0004719829","0004646391","0004747475","0004735058",
  "0021018361","0020907723","0000718936","0021012850","0004755745","0020915771","0004726516","0020864329","0020963041","0021104587",
  "0004531146","0004621363","0004537563","0004602736","0004706335","0008525594","0004550716","0004604353","0004560853","0004505020",
  "0004617890","0004558495","0004622717","0004654992","0004614065","0004527093","0004533292","0004505655","0004602779","0004661610",
  "0004721084","0004726482","0004603948","0004715183","0004600596","0004544991","0004536987","0004713559","0004526322","0004436042",
  "0004723996","0004646679","0004729656","0004530513","0004523569","0004562378","0004521124","0004515694","0004556655","0004756283",
  "0020940074","0004352907","0020849167","0020900557","0021037982","0021037416","0021100242","0020948231","0020920668","0004653568",
  "0004717292","0004737836","0004755698","0004743164","0004554682","0004627941","0004707498","0004618731","0004722855","0021039578",
  "0020829208","0020939658","0020911841","0020922978","0021054555","0020849918","0020954675","0020857821","0021000680","0020844852",
  "0020935556","0020962119","0021008235","0020851706","0020843229","0020932638","0020818701","0020919185","0021001511","0004616670",
  "0004760437","0004702121","0004747984","0004623794","0004759383","0004703884","0004758755","0004723935","0004656181","0004641468",
  "0004801066","0004711671","0004565137","0004541182","0004650556","0004649962","0004647642","0004730237","0004761846","0020858627",
  "0020911625","0020957328","0020849840","0021057964","0021027793","0020818271","0020921622","0004417420","0020864509","0004441983",
  "0004462902","0004324121","0004433367","0004450062","0004660509","0004761614","0004705983","0004547915","0004657985","0004613202",
  "0004564583","0004743862","0004711657","0004545825","0004516396","0004743277","0004642211","0004618427","0004711606","0004714412",
  "0004648630","0004734198","0004626706","0004613219","0004725837","0004720389","0004527627","0004604320","0004761445"
];

SEED_ITEM_TAGS = Array.from(new Set([...SEED_ITEM_TAGS, ...REQUESTED_ITEM_TAGS]));

// If any of the seed tags are actually badges, remove them so they are not used as items
SEED_ITEM_TAGS = SEED_ITEM_TAGS.filter((t) => !BADGE_SET.has(normalizeHex(t)));

// generate up to 100 unique item tags (skips badges via the filter above)
while (SEED_ITEM_TAGS.length < 100) {
  const id = `IT${Math.floor(Math.random() * 1e8).toString(16).toUpperCase()}`;
  if (!SEED_ITEM_TAGS.includes(id) && !BADGE_TAGS.includes(id)) SEED_ITEM_TAGS.push(id);
}

// (TAG_MAP and helpers are defined after inventory items are generated below)

// Unknown scans (for Ground to monitor)
const unknownRFIDScans = [];

/* ===================== Generate items up to 64 ===================== */
const _baseNames = [
  ["BOLT", "Bolt (stainless)"],
  ["NUT", "Hex Nut"],
  ["SCREW", "Machine Screw"],
  ["WASHER", "Flat Washer"],
  ["GASKET", "Silicone Gasket"],
  ["O-RING", "O-Ring"],
  ["CLAMP", "Hose Clamp"],
  ["HOSE", "Braided Hose"],
  ["VALVE", "Check Valve"],
  ["FILTER", "Inline Filter"],
  ["CABLE", "Shielded Cable"],
  ["TIE", "Cable Tie"],
  ["FUSE", "Blade Fuse"],
  ["GAUGE", "Pressure Gauge"],
  ["BRACKET", "Mount Bracket"],
  ["BEARING", "Ball Bearing"],
];
const _variants = [
  "M4",
  "M5",
  "M6",
  "M8",
  "M10",
  '1/4"',
  '3/8"',
  '1/2"',
  "Small",
  "Medium",
  "Large",
  "10mm",
  "12mm",
  "14mm",
  "16mm",
  "20mm",
];

for (let i = 3; i <= 100; i++) {
  const id = `ITEM-${_pad(i)}`;
  const [skuRoot, friendly] = _baseNames[(i - 1) % _baseNames.length];
  const variant = _variants[(i - 1) % _variants.length];

  const sku = `${skuRoot}-${variant
    .replace(/"/g, "")
    .replace(/\s/g, "")
    .toUpperCase()}`;
  const name = `${friendly} (${variant})`;
  const description = `Packaged ${friendly.toLowerCase()} — ${variant}, warehouse grade.`;

  const safetyStock = _int(2, 15);
  const reorderPoint = Math.max(1, Math.floor(safetyStock * 0.5));

  const rowCount = _int(1, 3);
  const chosenLocIds = new Set();
  while (chosenLocIds.size < rowCount) chosenLocIds.add(_pick(inventoryLocations).id);
  const locs = [...chosenLocIds];

  const baseTotal = _int(reorderPoint - 2, safetyStock + 20);
  const total = Math.max(0, baseTotal);

  let remaining = total;
  const perRow = [];
  for (let r = 0; r < rowCount; r++) {
    const last = r === rowCount - 1;
    const chunk = last ? remaining : Math.max(0, _int(0, Math.ceil(remaining * 0.7)));
    perRow.push(chunk);
    remaining -= chunk;
  }

  inventoryItems.push({
    id,
    sku,
    name,
    description,
    safetyStock,
    reorderPoint,
    locQty: perRow[0] ?? 0,
    total,
    status: total <= reorderPoint ? "RISK" : "OK",
  });

  perRow.forEach((qty, idx) => {
    inventoryStocks.push({ itemId: id, locationId: locs[idx], qty, expiresAt: null });
  });
}

// Now that `inventoryItems` has been populated up to ITEM-100, build TAG_MAP
const TAG_MAP = {};
for (let i = 0; i < 100; i++) {
  const tag = normalizeHex(SEED_ITEM_TAGS[i]);
  const itemId = inventoryItems[i]?.id;
  if (!itemId) continue; // safety
  TAG_MAP[tag] = itemId;
  // also add to the rfidMap so it shows up in mappings listing
  const loc = inventoryLocations[i % inventoryLocations.length].id;
  rfidMap.set(tag, { itemId, lastLocationId: loc });
}

// Helper to auto-assign the next-unused ITEM to a tag (and mirror to rfidMap)
function autoAssign(tag) {
  const t = normalizeHex(tag);
  if (TAG_MAP[t]) return TAG_MAP[t];
  const used = new Set(Object.values(TAG_MAP));
  const next = inventoryItems.find((it) => !used.has(it.id));
  if (!next) return null;
  TAG_MAP[t] = next.id;
  // pick a reasonable lastLocationId (first location)
  const lastLocationId = inventoryLocations[0]?.id || null;
  rfidMap.set(t, { itemId: next.id, lastLocationId });
  return next.id;
}

// Auto-assign the three tags you supplied (or set manually if you prefer)
autoAssign("0004726482");
autoAssign("0004704735");
autoAssign("0004661610");

// Keep ONLY the specific wrench mapping (remove EXTRA_TAGS block)
TAG_MAP[normalizeHex("0004706335")] = "ITEM-001";
rfidMap.set(normalizeHex("0004706335"), { itemId: "ITEM-001", lastLocationId: "LOC-A1" });

// ------------------------------------------------------------------
// API Docs
// - GET /api/items
// - GET /api/locations
// - GET /api/stocks
// - GET /api/logs
// - GET /api/config
// - POST /api/checkout
// - POST /api/checkin
// - POST /api/rfid/scan
// - POST /api/rfid/map
// - GET /api/rfid/mappings
// - POST /api/rfid/move
// ------------------------------------------------------------------

/* ===================== Consistency helpers ===================== */
function recalcItemQuantities(itemId) {
  let total = 0;
  for (const row of inventoryStocks) if (row.itemId === itemId) total += row.qty;
  const item = inventoryItems.find((it) => it.id === itemId);
  if (!item) return;
  item.total = total;
  const firstStock = inventoryStocks.find((s) => s.itemId === itemId);
  item.locQty = firstStock ? firstStock.qty : 0;
  item.status = item.total <= item.reorderPoint ? "RISK" : "OK";
}

function writeLog({ itemId, locationId, mode, qty, actor, reason, workOrder }) {
  const entry = {
    id: "LOG-" + Date.now(),
    timestamp: new Date().toISOString(),
    itemId,
    locationId,
    mode,
    qty,
    actor: actor || "unknown",
    reason,
    workOrder,
  };
  activityLogs.push(entry);
  return entry;
}

function getOrCreateStockRow(itemId, locationId) {
  let row = inventoryStocks.find((r) => r.itemId === itemId && r.locationId === locationId);
  if (!row) {
    row = { itemId, locationId, qty: 0, expiresAt: null };
    inventoryStocks.push(row);
  }
  return row;
}

/* ===================== HTTP helpers ===================== */
const JSON_CT = "application/json; charset=utf-8";
function sendJson(res, status, body) {
  const buf = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    "content-type": JSON_CT,
    "content-length": buf.length,
  });
  res.end(buf);
}

async function readJsonBody(req, limitBytes = 512 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > limitBytes) {
        reject(new Error("PAYLOAD_TOO_LARGE"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve(text ? JSON.parse(text) : {});
      } catch {
        reject(new Error("INVALID_JSON"));
      }
    });
    req.on("error", reject);
  });
}

/* ===================== HTTP Server ===================== */
const server = http.createServer(async (req, res) => {
  const start = Date.now();
  const url = new URL(req.url || "/", "http://localhost");
  const method = req.method || "GET";

  try {
    // Set dynamic CORS headers if origin matches our whitelist
    const origin = corsOrigin(req);
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
    if (method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    // Health
    if (method === "GET" && url.pathname === "/health") {
      return sendJson(res, 200, { ok: true, time: new Date().toISOString() });
    }

    // Data
    if (method === "GET" && url.pathname === "/api/items") return sendJson(res, 200, inventoryItems);
    if (method === "GET" && url.pathname === "/api/locations")
      return sendJson(res, 200, inventoryLocations);
    if (method === "GET" && url.pathname === "/api/stocks") return sendJson(res, 200, inventoryStocks);
    if (method === "GET" && url.pathname === "/api/logs")
      return sendJson(res, 200, activityLogs.slice().reverse());

    // Config (same shape your UI expects)
    if (
      method === "GET" &&
      (url.pathname === "/api/config" || url.pathname === "/config.json" || url.pathname === "/config")
    ) {
      const modeParam = url.searchParams.get("mode") || "crew";
      const isGround = modeParam === "ground";
      const params = {
        role: isGround ? "manager" : "astronaut",
        missionId: "HUNCH-TEST-MISSION",
        defaultLocationId: "LOC-A1",
        organization: "NASA HUNCH DEMO",
        uiMode: isGround ? "ground" : "crew",
      };
      return sendJson(res, 200, { ok: true, params });
    }

    // Checkout / Checkin
    if (method === "POST" && url.pathname === "/api/checkout") {
      let body;
      try {
        body = await readJsonBody(req);
      } catch (e) {
        return sendJson(res, 400, { error: e.message });
      }
      const { itemId, locationId, qty, actor, reason, workOrder } = body;
      const row = inventoryStocks.find((r) => r.itemId === itemId && r.locationId === locationId);
      if (row) row.qty = Math.max(0, row.qty - Number(qty || 0));
      recalcItemQuantities(itemId);
      writeLog({ itemId, locationId, mode: "OUT", qty: Number(qty || 0), actor, reason, workOrder });
      return sendJson(res, 200, { ok: true, action: "CHECKOUT", itemId, locationId, newQty: row ? row.qty : 0 });
    }

    if (method === "POST" && url.pathname === "/api/checkin") {
      let body;
      try {
        body = await readJsonBody(req);
      } catch (e) {
        return sendJson(res, 400, { error: e.message });
      }
      const { itemId, locationId, qty, actor, reason, workOrder } = body;
      const row = getOrCreateStockRow(itemId, locationId);
      row.qty += Number(qty || 0);
      recalcItemQuantities(itemId);
      writeLog({ itemId, locationId, mode: "IN", qty: Number(qty || 0), actor, reason, workOrder });
      return sendJson(res, 200, { ok: true, action: "CHECKIN", itemId, locationId, newQty: row.qty });
    }

    /* ===================== RFID endpoints ===================== */

    // Ground reads unknown scans here
    if (method === "GET" && url.pathname === "/api/rfid/unknown") {
      // newest first
      return sendJson(res, 200, unknownRFIDScans.slice().reverse());
    }

    // (A) Scan: use a card to IN/OUT an item.
    if (method === "POST" && url.pathname === "/api/rfid/scan") {
      let body;
      try {
        body = await readJsonBody(req);
      } catch (e) {
        return sendJson(res, 400, { error: e.message });
      }

      const cardHex = normalizeHex(body.cardHex);
      const mode = String(body.mode || "").toUpperCase() === "IN" ? "IN" : "OUT";
      const qty = Number(body.qty ?? 1) || 1;
      const actor = body.actor || "rfid";
      const reason = body.reason;
      const workOrder = body.workOrder;

      // Badge tags are not inventory items
      if (BADGE_TAGS.includes(cardHex)) return sendJson(res, 400, { ok: false, error: "BADGE_SCAN", message: "Badge scanned on inventory endpoint", cardHex });

      // If tag is part of our simplified TAG_MAP, apply special rules (FOOD/TRASH/GEN)
      if (Object.prototype.hasOwnProperty.call(TAG_MAP, cardHex)) {
        const itemId = TAG_MAP[cardHex];
        const idx = parseInt(itemId.split("-")[1], 10);
        const itemType = idx >= 91 ? "FOOD" : idx >= 81 ? "TRASH" : "GEN";

        // FOOD can only be checked OUT
        if (itemType === "FOOD" && mode !== "OUT") return sendJson(res, 400, { ok: false, error: "FOOD_ONLY_OUT", message: "Food items can only be checked OUT" });
        // TRASH can only be checked IN
        if (itemType === "TRASH" && mode !== "IN") return sendJson(res, 400, { ok: false, error: "TRASH_ONLY_IN", message: "Trash can only be checked IN" });

        // force trash location for TRASH items
        const finalLoc = itemType === "TRASH" ? (inventoryLocations.find((l) => l.id === "LOC-TRASH") || {}).id : body.locationId;
        if (!finalLoc) return sendJson(res, 400, { ok: false, error: "UNKNOWN_LOCATION", message: "locationId required" });

        const stockRow = getOrCreateStockRow(itemId, finalLoc);
        if (mode === "OUT") {
          if (stockRow.qty < qty) return sendJson(res, 400, { ok: false, error: "INSUFFICIENT_STOCK" });
          stockRow.qty -= qty;
        } else {
          stockRow.qty += qty;
        }
        recalcItemQuantities(itemId);

        // FOOD consumed -> remap this tag to a paired TRASH item (offset 10)
        let status = "OK";
        let nextItemId = null;
        if (itemType === "FOOD" && mode === "OUT") {
          const offset = 10;
          const pairedIdx = idx - offset;
          if (pairedIdx >= 1 && pairedIdx <= inventoryItems.length) {
            const paired = `ITEM-${String(pairedIdx).padStart(3, "0")}`;
            TAG_MAP[cardHex] = paired;
            // keep rfidMap in sync for mappings listing
            rfidMap.set(cardHex, { itemId: paired, lastLocationId: finalLoc });
            status = "CONSUMED_TO_TRASH";
            nextItemId = paired;
          }
        }

        const log = writeLog({ itemId, locationId: finalLoc, mode, qty, actor, reason, workOrder });
        return sendJson(res, 200, {
          ok: true,
          action: mode === "OUT" ? "CHECKOUT" : "CHECKIN",
          itemId,
          itemSku: itemId,
          locationId: finalLoc || locationId,
          cardHex,
          qty,
          totalQty: stockRow.qty,
          status,
          nextItemId,
          log,
        });
      }

      const mapped = rfidMap.get(cardHex);
      if (!mapped) {
        const entry = {
          id: "UNK-" + Date.now(),
          timestamp: new Date().toISOString(),
          cardHex,
          mode,
          qty,
          actor,
          locationId: body.locationId || null,
          error: "CARD_NOT_MAPPED",
        };
        unknownRFIDScans.push(entry);
        // keep it bounded
        if (unknownRFIDScans.length > 200) unknownRFIDScans.splice(0, unknownRFIDScans.length - 200);
        return sendJson(res, 404, { ok: false, error: "CARD_NOT_MAPPED", cardHex });
      }

      const item = inventoryItems.find((i) => i.id === mapped.itemId);
      if (!item) {
        return sendJson(res, 400, { ok: false, error: "BAD_ITEM_MAPPING", cardHex, itemId: mapped.itemId });
      }

      const defaultLoc = "LOC-A1";
      const locationId = body.locationId || mapped.lastLocationId || defaultLoc;

      // validate locationId
      if (!inventoryLocations.find((l) => l.id === locationId)) {
        return sendJson(res, 400, { ok: false, error: "UNKNOWN_LOCATION", locationId });
      }

      // IMPORTANT: tag “moves” by remembering where it was last scanned
      mapped.lastLocationId = locationId;
      rfidMap.set(cardHex, mapped);

      const stockRow = getOrCreateStockRow(item.id, locationId);
      if (mode === "OUT") {
        stockRow.qty = Math.max(0, stockRow.qty - qty);
      } else {
        stockRow.qty += qty;
      }
      recalcItemQuantities(item.id);
      const log = writeLog({ itemId: item.id, locationId, mode, qty, actor, reason, workOrder });

      return sendJson(res, 200, {
        ok: true,
        action: mode === "OUT" ? "CHECKOUT" : "CHECKIN",
        itemId: item.id,
        itemSku: item.sku,
        locationId,
        cardHex,
        qty,
        newQty: stockRow.qty,
        status: item.status,
        log,
      });
    }

    // (B) Add/update a mapping at runtime
    if (method === "POST" && url.pathname === "/api/rfid/map") {
      let body;
      try {
        body = await readJsonBody(req);
      } catch (e) {
        return sendJson(res, 400, { error: e.message });
      }
      const cardHex = normalizeHex(body.cardHex);
      const { itemId, locationId } = body;
      if (!inventoryItems.find((i) => i.id === itemId)) return sendJson(res, 400, { ok: false, error: "UNKNOWN_ITEM" });
      if (!inventoryLocations.find((l) => l.id === locationId))
        return sendJson(res, 400, { ok: false, error: "UNKNOWN_LOCATION" });
      rfidMap.set(cardHex, { itemId, lastLocationId: locationId });
      // If it was previously reported as unknown, clear it from the unknown list.
      for (let i = unknownRFIDScans.length - 1; i >= 0; i--) {
        if (unknownRFIDScans[i].cardHex === cardHex) unknownRFIDScans.splice(i, 1);
      }
      return sendJson(res, 200, { ok: true, cardHex, itemId, locationId });
    }

    
    // (C) List current RFID mappings (Ground controller)
    if (method === "GET" && url.pathname === "/api/rfid/mappings") {
      const out = [];
      for (const [cardHex, v] of rfidMap.entries()) {
        out.push({
          cardHex,
          itemId: v.itemId,
          lastLocationId: v.lastLocationId || null,
        });
      }
      return sendJson(res, 200, out);
    }

    // (D) Force-move a tag to a location (Ground controller)
    if (method === "POST" && url.pathname === "/api/rfid/move") {
      let body;
      try {
        body = await readJsonBody(req);
      } catch (e) {
        return sendJson(res, 400, { error: e.message });
      }

      const cardHex = normalizeHex(body.cardHex);
      const { locationId } = body;

      const mapped = rfidMap.get(cardHex);
      if (!mapped) return sendJson(res, 404, { ok: false, error: "CARD_NOT_MAPPED", cardHex });
      if (!inventoryLocations.find((l) => l.id === locationId))
        return sendJson(res, 400, { ok: false, error: "UNKNOWN_LOCATION" });

      mapped.lastLocationId = locationId;
      rfidMap.set(cardHex, mapped);

      return sendJson(res, 200, { ok: true, cardHex, locationId });
    }

return sendJson(res, 404, { error: "NOT_FOUND" });
  } catch (err) {
    console.error("Unhandled error:", err?.message ?? err);
    return sendJson(res, 500, { error: "INTERNAL_ERROR" });
  } finally {
    const ms = Date.now() - start;
    console.log(`${method} ${url.pathname} ${res.statusCode} ${ms}ms`);
  }
});

const PORT = Number(process.env.PORT || 8080);
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Mock server listening on http://0.0.0.0:${PORT}`);
});
