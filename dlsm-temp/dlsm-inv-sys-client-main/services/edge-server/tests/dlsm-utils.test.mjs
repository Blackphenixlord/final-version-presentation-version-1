import { test } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

const mod = await import("../src/server.mjs");

const {
  parseMovePath,
  buildLocationId,
  buildSlotKey,
  normalizeUnitId,
  normalizeShelf,
  normalizeSlot,
  normalizeDepth,
} = mod;

test("parseMovePath normalizes slot + chain", () => {
  const parsed = parseMovePath("s1-l12/ctb-0001/BOB-FOOD-01");
  assert.equal(parsed.slotKey, "S1-L12");
  assert.deepEqual(parsed.chainIds, ["CTB-0001", "BOB-FOOD-01"]);
});

test("buildLocationId creates canonical key", () => {
  assert.equal(buildLocationId("S1", 2, "L12"), "S1-D2-L12");
  assert.equal(buildLocationId("c1", 1, "2"), "C1-D1-L2");
});

test("normalizers enforce canonical formats", () => {
  assert.equal(normalizeUnitId("  ctb-0009 "), "CTB-0009");
  assert.equal(normalizeShelf("s2"), "S2");
  assert.equal(normalizeSlot("3"), "L3");
  assert.equal(normalizeDepth("3"), 3);
  assert.equal(buildSlotKey("s3", "l5"), "S3-L5");
});
