import { test } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

const mod = await import("../src/server.mjs");
const { app, ensureDlsmSchema, seedDlsmData } = mod;

await ensureDlsmSchema();
await seedDlsmData();

async function api(method, url, payload) {
  const res = await app.inject({ method, url, payload });
  let data = null;
  try {
    data = res.json();
  } catch {
    data = null;
  }
  return { status: res.statusCode, data };
}

test("stow, pack, move, receive flows", async () => {
  // STOW CTB-0002 into S1-D2-L1
  const stowRes = await api("POST", "/api/stow", {
    mode: "ctb",
    unitId: "CTB-0002",
    shelf: "S1",
    depth: 2,
    slotIds: ["L1"],
  });
  assert.equal(stowRes.status, 200);
  assert.equal(stowRes.data.ok, true);

  const locRes = await api("GET", "/api/locations?shelf=S1&depth=2");
  assert.equal(locRes.status, 200);
  const slot = locRes.data.slots.find((s) => s.id === "L1");
  assert.equal(slot.state, "occupied");

  // STOW irregular on standard shelf should fail
  const badStow = await api("POST", "/api/stow", {
    mode: "irregular",
    unitId: "IRR-001",
    shelf: "S1",
    depth: 1,
    slotIds: ["L2"],
  });
  assert.equal(badStow.status, 400);

  // PACK ITEM-LAB-01 into CTB-0001
  const packRes = await api("POST", "/api/pack", {
    outsideId: "CTB-0001",
    insideId: "ITEM-LAB-01",
  });
  assert.equal(packRes.status, 200);

  const treeRes = await api("GET", "/api/containers/CTB-0001/tree?depth=3");
  assert.equal(treeRes.status, 200);
  assert.ok(treeRes.data.nodes["ITEM-LAB-01"]);

  // PACK rule: Bob accepts meals only
  const badPack = await api("POST", "/api/pack", {
    outsideId: "BOB-FOOD-01",
    insideId: "ITEM-MED-01",
  });
  assert.equal(badPack.status, 400);

  // MOVE CTB-0002 from S1-L1 to S2-L4
  const moveRes = await api("POST", "/api/move", {
    unitId: "CTB-0002",
    from: "S1-L1/CTB-0002",
    to: "S2-L4",
    reason: "Space constraint",
  });
  assert.equal(moveRes.status, 200);
  assert.equal(moveRes.data.ok, true);
  assert.equal(moveRes.data.stowedByLocation["S2-L4"], "CTB-0002");

  // RECEIVE: processing should fail until counts match
  const failProcess = await api("POST", "/api/shipments/SHIP-8841/process");
  assert.equal(failProcess.status, 400);

  const summary = await api("GET", "/api/shipments");
  const ship = summary.data.find((s) => s.id === "SHIP-8841");
  for (const line of ship.items) {
    const delta = line.expected - line.counted;
    if (delta > 0) {
      const bump = await api("POST", `/api/shipments/SHIP-8841/lines/${line.sku}/count`, { delta });
      assert.equal(bump.status, 200);
    }
  }

  const okProcess = await api("POST", "/api/shipments/SHIP-8841/process");
  assert.equal(okProcess.status, 200);
  assert.equal(okProcess.data.ok, true);
});
