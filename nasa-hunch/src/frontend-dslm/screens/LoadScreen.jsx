import React, { useMemo, useState } from "react";

import { Button, Card, useTheme } from "../components/ui";

const NORD_HEX = {
  n0: "#2e3440",
  n1: "#3b4252",
  n2: "#434c5e",
  n3: "#4c566a",
  n4: "#d8dee9",
  n5: "#e5e9f0",
  n6: "#eceff4",
  n7: "#8fbcbb",
  n8: "#88c0d0",
  n9: "#81a1c1",
  n10: "#5e81ac",
  n11: "#bf616a",
  n12: "#d08770",
  n13: "#ebcb8b",
  n14: "#a3be8c",
  n15: "#b48ead",
};

function hexToRgba(hex, a) {
  const h = String(hex || "")
    .replace("#", "")
    .trim();
  if (h.length !== 6) return `rgba(0,0,0,${a})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function ScreenHeader({ title, right }) {
  const NORD = useTheme();

  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-xl font-semibold" style={{ color: NORD.text }}>
          {title}
        </div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

// Fallback inspectors (keeps this screen usable even if callers don't pass builder fns).
function fallbackInspectorForCTB(ctbId) {
  return {
    title: ctbId,
    subtitle: "0.05 CTB — (mock)",
    pills: [{ label: "In progress", tone: "progress" }],
    details: { "CTB size": "0.05", Location: "(mock)", Tag: "(mock)" },
    contents: null,
    history: [{ when: "(mock)", what: "CTB opened" }],
  };
}

function fallbackInspectorForSlot(id, slot) {
  return {
    title: `Slot ${id}`,
    subtitle: "DSLM Stowage",
    pills: [
      {
        label: slot?.state ?? "",
        tone:
          slot?.state === "occupied"
            ? "progress"
            : slot?.state === "reserved"
              ? "waiting"
              : "verified",
      },
    ],
    details: {
      Stack: String(id).split("-")[0],
      Position: String(id).split("-")[1],
      State: slot?.state,
      Label: slot?.label || "—",
    },
    contents: slot?.label ? [slot.label] : null,
    history: [{ when: "(mock)", what: "Slot inspected" }],
  };
}

export default function LoadScreen({
  data,
  setInspector,
  makeInspectorForCTB,
  makeInspectorForSlot,
}) {
  const NORD = useTheme();

  // Mode: standard CTB stowage vs irregular item stowage.
  const [mode, setMode] = useState("ctb"); // "ctb" | "irregular"

  // Selected unit
  const [unitSelectedId, setUnitSelectedId] = useState("");

  // Location selection
  const [shelf, setShelf] = useState("S1");
  const [depth, setDepth] = useState(1);

  // CTB mode: single slot selection; Irregular mode: footprint (multi-select)
  const [slotIds, setSlotIds] = useState([]); // e.g. ["L1"] or ["L1","L2",...]
  // One-off warning banner for clicking blocked slots (e.g., occupied)
  const [slotClickWarning, setSlotClickWarning] = useState(null);

  // Local overlay of placements (since `data` is frozen mock data)
  // key: `${shelf}-D${depth}-${slotId}` -> label (unit id)
  const [placedByLoc, setPlacedByLoc] = useState({});

  const inspectCTB = makeInspectorForCTB ?? fallbackInspectorForCTB;
  const inspectSlot = makeInspectorForSlot ?? fallbackInspectorForSlot;

  const STANDARD_SHELVES = ["S1", "S2", "S3"];
  const IRREG_SHELVES = ["C1", "C2"];

  function pickRandom(list) {
    if (!Array.isArray(list) || list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
  }

  function mockScanUnit() {
    if (mode === "irregular") {
      const pool = ["IRR-001", "IRR-002", "IRR-003", "IRR-004", "IRR-005"];
      return pickRandom(pool) || "IRR-001";
    }
    const pool = ["CTB-001", "CTB-002", "CTB-003", "CTB-004", "CTB-005"];
    return pickRandom(pool) || "CTB-001";
  }

  function scanUnit() {
    const next = mockScanUnit();
    // Override the previous scan and reset selection state for a fresh stow.
    setUnitSelectedId(next);
    setSlotIds([]);
    setSlotClickWarning(null);
  }

  function clearUnit() {
    setUnitSelectedId("");
    setSlotIds([]);
    setSlotClickWarning(null);
  }

  // Shelf constraints for irregular mode
  const shelves = mode === "irregular" ? IRREG_SHELVES : STANDARD_SHELVES;
  // Standard shelves have depth up to 4 (not 5)
  const maxDepth = mode === "irregular" ? 1 : 4;

  function setModeSafe(nextMode) {
    setMode(nextMode);
    if (nextMode === "irregular") {
      setShelf("C1");
      setDepth(1);
    } else {
      setShelf("S1");
      setDepth(1);
    }
    setSlotIds([]);
    setSlotClickWarning(null);
    setUnitSelectedId("");
  }

  function slotIndexFromId(id) {
    const n = Number(String(id || "").replace(/^L/i, ""));
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.min(16, Math.max(1, n));
  }

  function rowColFromSlotId(id) {
    const t = String(id || "").trim();
    if (!t) return { row: null, col: null };
    const idx = slotIndexFromId(t); // 1..16
    const row = Math.ceil(idx / 4);
    const col = ((idx - 1) % 4) + 1;
    return { row, col };
  }

  // Primary selection for display (CTB uses the single selection; irregular uses the first selected cell)
  const primarySlotId = useMemo(() => {
    if (!Array.isArray(slotIds) || slotIds.length === 0) return "";
    return slotIds[0];
  }, [slotIds]);

  const { row, col } = useMemo(
    () => rowColFromSlotId(primarySlotId),
    [primarySlotId],
  );

  // Irregular mode: footprint summary (not just the first selected cell)
  const footprintMeta = useMemo(() => {
    if (mode !== "irregular") return null;
    const ids = Array.isArray(slotIds) ? slotIds.slice() : [];
    if (ids.length === 0) {
      return {
        ids: [],
        count: 0,
        minRow: null,
        maxRow: null,
        minCol: null,
        maxCol: null,
      };
    }

    ids.sort((a, b) => slotIndexFromId(a) - slotIndexFromId(b));

    const coords = ids
      .map((sid) => rowColFromSlotId(sid))
      .filter((rc) => rc && rc.row != null && rc.col != null);

    const rows = coords.map((c) => c.row);
    const cols = coords.map((c) => c.col);

    const minRow = rows.length ? Math.min(...rows) : null;
    const maxRow = rows.length ? Math.max(...rows) : null;
    const minCol = cols.length ? Math.min(...cols) : null;
    const maxCol = cols.length ? Math.max(...cols) : null;

    return {
      ids,
      count: ids.length,
      minRow,
      maxRow,
      minCol,
      maxCol,
    };
  }, [mode, slotIds]);

  const depthForKey = mode === "irregular" ? 1 : depth;

  const locKey = primarySlotId
    ? `${shelf}-D${depthForKey}-${primarySlotId}`
    : "";
  const placedLabel = locKey ? placedByLoc[locKey] || "" : "";

  // Slot grids for ALL shelf+depth combinations:
  // - standard: S1..S3 × D1..D4
  // - irregular: C1..C2 × D1 only
  const slotGrids = useMemo(() => {
    const baseStacks = data?.stacks ?? {};

    function placeholderSlots() {
      return Array.from({ length: 16 }).map((_, i) => ({
        id: `L${i + 1}`,
        state: "empty",
        label: "",
      }));
    }

    const shelfIds = mode === "irregular" ? IRREG_SHELVES : STANDARD_SHELVES;
    const depthList = mode === "irregular" ? [1] : [1, 2, 3, 4];

    const grids = {};

    for (const shelfId of shelfIds) {
      const baseSlots = Array.isArray(baseStacks[shelfId])
        ? baseStacks[shelfId]
        : placeholderSlots();

      for (const d of depthList) {
        const gridKey = `${shelfId}-D${d}`;
        grids[gridKey] = baseSlots.map((s) => {
          const idx = slotIndexFromId(s.id); // 1..16
          const shelfN = Number(String(shelfId).replace(/\D/g, "")) || 0;

          // Deterministic variation so every (shelf, depth) looks different.
          // Only mutate EMPTY slots so we preserve any base patterns.
          let out = s;
          if (s.state === "empty") {
            const seed =
              idx * 13 + d * 17 + shelfN * 23 + shelfId.charCodeAt(0);

            // Reserve a few slots
            if (seed % 11 === 0 || seed % 29 === 0) {
              out = {
                ...s,
                state: "reserved",
                label: `Reserved: ${mode === "irregular" ? "irregular" : "CTB"}`,
              };
            }

            // Occupy a few different slots
            if (seed % 17 === 0 || seed % 37 === 0) {
              const occLabels =
                mode === "irregular"
                  ? ["IRR-001", "IRR-002", "IRR-003"]
                  : [
                      "CTB-001",
                      "CTB-002",
                      "CTB-Meal-015",
                      "CTB-SUP-007",
                      "CTB-TOOL-01",
                    ];
              const pick = occLabels[seed % occLabels.length];
              out = { ...s, state: "occupied", label: pick };
            }
          }

          // placedByLoc overlay wins last (represents the user marking something stowed)
          const placeKey = `${shelfId}-D${d}-${s.id}`;
          const placed = placedByLoc[placeKey];
          if (!placed) return out;
          return { ...out, state: "occupied", label: placed };
        });
      }
    }

    return grids;
  }, [data, placedByLoc, mode]);

  // Current grid view is always ONE shelf × ONE depth
  const currentGridKey = `${shelf}-D${depthForKey}`;
  const currentSlots = slotGrids[currentGridKey] || [];
  const currentOccupied = currentSlots.filter(
    (x) => x.state === "occupied",
  ).length;

  const footprintOverlaps = useMemo(() => {
    if (mode !== "irregular") return false;
    const ids = Array.isArray(slotIds) ? slotIds : [];
    if (ids.length === 0) return false;
    const selectedSlots = (currentSlots || []).filter((s) =>
      ids.includes(s.id),
    );
    return selectedSlots.some(
      (s) => s.state === "occupied" || s.state === "reserved",
    );
  }, [mode, slotIds, currentSlots]);

  const footprintHasOccupied = useMemo(() => {
    if (mode !== "irregular") return false;
    const ids = Array.isArray(slotIds) ? slotIds : [];
    if (ids.length === 0) return false;
    const selectedSlots = (currentSlots || []).filter((s) =>
      ids.includes(s.id),
    );
    return selectedSlots.some((s) => s.state === "occupied");
  }, [mode, slotIds, currentSlots]);

  const footprintHasReserved = useMemo(() => {
    if (mode !== "irregular") return false;
    const ids = Array.isArray(slotIds) ? slotIds : [];
    if (ids.length === 0) return false;
    const selectedSlots = (currentSlots || []).filter((s) =>
      ids.includes(s.id),
    );
    return selectedSlots.some((s) => s.state === "reserved");
  }, [mode, slotIds, currentSlots]);

  const footprintSlotsText = useMemo(() => {
    if (mode !== "irregular") return "";
    const ids = footprintMeta?.ids || [];
    if (!ids.length) return "";
    const full = ids.join(", ");
    return full.length > 64 ? `${full.slice(0, 61)}…` : full;
  }, [mode, footprintMeta]);

  // Selected slot helper (first selection in irregular footprint; single selection in CTB)
  const selectedSlot = useMemo(
    () => currentSlots.find((x) => x.id === primarySlotId) || null,
    [currentSlots, primarySlotId],
  );

  const selectedState = placedLabel
    ? "occupied"
    : selectedSlot?.state || "empty";
  const selectedDisplayLabel = placedLabel || selectedSlot?.label || "";

  const selectedPillText =
    selectedState === "occupied"
      ? "Occupied"
      : selectedState === "reserved"
        ? "Reserved"
        : "Empty";

  const selectedBg =
    selectedState === "occupied"
      ? hexToRgba(NORD_HEX.n14, 0.22)
      : selectedState === "reserved"
        ? hexToRgba(NORD_HEX.n13, 0.22)
        : hexToRgba(NORD_HEX.n2, 0.34);

  const selectedBorder =
    selectedState === "occupied"
      ? `1px solid ${hexToRgba(NORD_HEX.n14, 0.42)}`
      : selectedState === "reserved"
        ? `1px solid ${hexToRgba(NORD_HEX.n13, 0.42)}`
        : `1px solid ${hexToRgba(NORD_HEX.n3, 0.5)}`;

  // Simple mock nested contents tree for CTBs (up to 4 levels)
  const MOCK_CONTENTS = {
    "CTB-001": ["CTB-TOOL-01"],
    "CTB-TOOL-01": ["CTB-TOOL-02"],
    "CTB-TOOL-02": ["CTB-TOOL-03"],
    "CTB-TOOL-03": ["ITEM-ALPHA", "ITEM-BETA"],

    "CTB-Meal-015": ["BOB-FOOD-01"],
    "BOB-FOOD-01": ["MEAL-0001", "MEAL-0002", "MEAL-0003", "MEAL-0004"],

    "CTB-SUP-007": ["ITEM-CABLES", "ITEM-TAPE", "ITEM-ALPHA"],
  };

  function lookupAny(id) {
    const t = String(id || "").trim();
    if (!t) return null;

    const SPECIAL = {
      "CTB-TOOL-01": { kind: "CTB", label: "Tool CTB (outer)" },
      "CTB-TOOL-02": { kind: "CTB", label: "Tool CTB (mid)" },
      "CTB-TOOL-03": { kind: "CTB", label: "Tool CTB (inner)" },
      "BOB-FOOD-01": { kind: "Bob", label: "Food Bob" },
    };
    if (SPECIAL[t]) {
      return { id: t, kind: SPECIAL[t].kind, label: SPECIAL[t].label };
    }

    if (/^CTB-/i.test(t)) return { id: t, kind: "CTB", label: t };
    if (/^BOB-/i.test(t)) return { id: t, kind: "Bob", label: t };
    if (/^MEAL-/i.test(t)) return { id: t, kind: "Meal", label: t };
    if (/^IRR-/i.test(t)) return { id: t, kind: "Irregular", label: t };
    if (/^ITEM-/i.test(t)) return { id: t, kind: "Item", label: t };

    return { id: t, kind: "Item", label: t };
  }

  function isContainer(u) {
    return u?.kind === "CTB" || u?.kind === "Bob";
  }

  function buildTree(id, depthLeft = 4, seen = new Set()) {
    const u = lookupAny(id);
    if (!u) return null;
    if (depthLeft <= 0) return { unit: u, children: [] };

    if (seen.has(u.id)) return { unit: u, children: [] };
    const nextSeen = new Set(seen);
    nextSeen.add(u.id);

    const childIds = MOCK_CONTENTS[u.id] ?? [];
    const children = isContainer(u)
      ? childIds
          .map((cid) => buildTree(cid, depthLeft - 1, nextSeen))
          .filter(Boolean)
      : [];

    return { unit: u, children };
  }

  const contentsTree = useMemo(() => {
    if (mode !== "ctb") return null;
    const id = unitSelectedId;
    if (!String(id || "").trim()) return null;
    if (!/^CTB-/i.test(String(id))) return null;
    return buildTree(String(id).trim(), 4);
  }, [mode, unitSelectedId]);

  function TreeNode({ node, level = 0 }) {
    if (!node) return null;
    const hasChildren = (node.children || []).length > 0;

    const rowEl = (
      <div
        className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
        style={{
          background: hexToRgba(NORD_HEX.n1, 0.72),
          border: `1px solid ${hexToRgba(NORD_HEX.n3, 0.28)}`,
          marginLeft: level ? `${Math.min(level, 4) * 12}px` : undefined,
        }}
      >
        <div className="min-w-0">
          <div
            className="text-base font-semibold truncate"
            style={{ color: NORD.text }}
          >
            {node.unit.label}
          </div>
          <div className="text-sm truncate" style={{ color: NORD.subtle }}>
            {node.unit.id} • {node.unit.kind}
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm"
          style={{
            background: hexToRgba(NORD_HEX.n2, 0.38),
            color: NORD.subtle,
            border: `1px solid ${hexToRgba(NORD_HEX.n3, 0.42)}`,
          }}
        >
          {hasChildren ? `${node.children.length} inside` : node.unit.kind}
        </span>
      </div>
    );

    if (!hasChildren) return rowEl;

    return (
      <details className="rounded-2xl" open={false}>
        <summary className="cursor-pointer list-none">{rowEl}</summary>
        <div className="mt-2 space-y-2">
          {node.children.map((c) => (
            <TreeNode key={c.unit.id} node={c} level={level + 1} />
          ))}
        </div>
      </details>
    );
  }

  function canStow() {
    const u = String(unitSelectedId || "").trim();
    if (!u) return { ok: false, reason: "Select a unit" };

    if (!Array.isArray(slotIds) || slotIds.length === 0) {
      return {
        ok: false,
        reason:
          mode === "irregular" ? "Select a footprint" : "Select a location",
      };
    }

    if (mode === "ctb" && slotIds.length !== 1) {
      return { ok: false, reason: "Select exactly one location" };
    }

    if (mode === "ctb") {
      const picked = (currentSlots || []).find((s) => s.id === primarySlotId);
      if (!picked) return { ok: false, reason: "Select a location" };
      if (picked.state === "occupied")
        return { ok: false, reason: "That location is occupied" };
      if (picked.state === "reserved")
        return { ok: false, reason: "That location is reserved" };
    }

    if (mode === "irregular") {
      const selectedSlots = (currentSlots || []).filter((s) =>
        slotIds.includes(s.id),
      );
      const overlaps = selectedSlots.some(
        (s) => s.state === "occupied" || s.state === "reserved",
      );
      if (overlaps) {
        return { ok: false, reason: "Footprint overlaps occupied/reserved" };
      }
    }

    if (mode === "ctb") {
      if (!/^CTB-/i.test(u)) return { ok: false, reason: "Unit must be a CTB" };
      if (!STANDARD_SHELVES.includes(shelf))
        return { ok: false, reason: "Pick a standard shelf" };
    } else {
      if (!/^IRR-/i.test(u))
        return { ok: false, reason: "Unit must be an irregular item" };
      if (!IRREG_SHELVES.includes(shelf))
        return { ok: false, reason: "Pick an irregular shelf" };
    }

    return { ok: true, reason: "Ready" };
  }

  const stowCheck = useMemo(
    () => canStow(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, unitSelectedId, shelf, depth, slotIds, currentGridKey],
  );

  function markStowed() {
    if (!stowCheck.ok) return;

    const u = String(unitSelectedId || "").trim();
    const d = mode === "irregular" ? 1 : depth;

    if (mode === "irregular") {
      const updates = {};
      for (const sid of slotIds) {
        updates[`${shelf}-D${d}-${sid}`] = u;
      }
      setPlacedByLoc((prev) => ({ ...prev, ...updates }));
      setSlotIds([]);
      setSlotClickWarning(null);

      // Inspect first selected slot
      const first = slotIds[0];
      const baseSlot = (data?.stacks?.[shelf] ?? []).find(
        (x) => x.id === first,
      );
      setInspector?.(inspectSlot(`${shelf}-${first}`, baseSlot));
      return;
    }

    // CTB mode: exactly one slot
    const key = `${shelf}-D${d}-${primarySlotId}`;
    setPlacedByLoc((prev) => ({ ...prev, [key]: u }));
    setSlotIds([]);
    setSlotClickWarning(null);

    const baseSlot = (data?.stacks?.[shelf] ?? []).find(
      (x) => x.id === primarySlotId,
    );
    setInspector?.(inspectSlot(`${shelf}-${primarySlotId}`, baseSlot));
  }

  return (
    <div className="space-y-4">
      <ScreenHeader
        title="Stow"
        right={
          <Button
            variant="ghost"
            onClick={() => {
              const id = String(unitSelectedId || "").trim();
              if (mode === "ctb" && /^CTB-/i.test(id)) {
                setInspector?.(inspectCTB(id));
              }
            }}
          >
            Details
          </Button>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-7">
          <Card title="Stow" subtitle={null}>
            <div
              className="rounded-2xl p-5 space-y-4"
              style={{
                background: hexToRgba(NORD_HEX.n1, 0.7),
                border: `1px solid ${hexToRgba(NORD_HEX.n3, 0.26)}`,
              }}
            >
              {/* Mode */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={mode === "ctb" ? "primary" : "ghost"}
                  onClick={() => setModeSafe("ctb")}
                >
                  Top-level CTB
                </Button>
                <Button
                  variant={mode === "irregular" ? "primary" : "ghost"}
                  onClick={() => setModeSafe("irregular")}
                >
                  Irregular item
                </Button>
              </div>

              {/* Unit selection */}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={scanUnit}
                >
                  Scan
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={clearUnit}
                  disabled={!unitSelectedId}
                >
                  Clear
                </Button>
              </div>

              {/* Selected unit */}
              <div
                className="rounded-2xl px-5 py-4"
                style={{
                  background: hexToRgba(NORD_HEX.n1, 0.76),
                  border: `1px solid ${hexToRgba(NORD_HEX.n3, 0.28)}`,
                }}
              >
                <div
                  className="text-lg font-semibold"
                  style={{ color: NORD.text }}
                >
                  {unitSelectedId ? unitSelectedId : "Nothing selected"}
                </div>
                <div className="mt-1 text-sm" style={{ color: NORD.subtle }}>
                  {mode === "ctb" ? "Standard CTB" : "Irregular item"}
                </div>
              </div>

              {/* CTB contents tree */}
              {mode === "ctb" &&
              unitSelectedId &&
              /^CTB-/i.test(unitSelectedId) ? (
                <details
                  className="rounded-2xl p-4"
                  style={{
                    background: hexToRgba(NORD_HEX.n1, 0.74),
                    border: `1px solid ${hexToRgba(NORD_HEX.n3, 0.28)}`,
                  }}
                >
                  <summary
                    className="cursor-pointer select-none list-none flex items-center justify-between"
                    style={{ color: NORD.text }}
                  >
                    <span className="text-base font-semibold">Contents</span>
                    <span className="text-sm" style={{ color: NORD.subtle }}>
                      Tree
                    </span>
                  </summary>

                  <div className="mt-3 space-y-2">
                    {contentsTree ? <TreeNode node={contentsTree} /> : null}
                  </div>
                </details>
              ) : null}

              {/* Mark stowed */}
              <div>
                <Button
                  className="w-full"
                  onClick={markStowed}
                  disabled={!stowCheck.ok}
                >
                  Mark stowed
                </Button>
                {!stowCheck.ok ? (
                  <div className="mt-2 text-sm" style={{ color: NORD.subtle }}>
                    {stowCheck.reason}
                  </div>
                ) : null}
              </div>
            </div>
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-5">
          <Card title="Location" subtitle={null}>
            <div
              className="rounded-2xl p-5 space-y-4 overflow-auto max-h-[calc(100vh-220px)]"
              style={{
                background: hexToRgba(NORD_HEX.n1, 0.7),
                border: `1px solid ${hexToRgba(NORD_HEX.n3, 0.26)}`,
              }}
            >
              {/* Shelf + depth */}
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-5">
                  <div
                    className="text-sm font-semibold"
                    style={{ color: NORD.muted }}
                  >
                    Shelf
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {shelves.map((s) => (
                      <Button
                        key={s}
                        variant={shelf === s ? "secondary" : "ghost"}
                        onClick={() => {
                          setShelf(s);
                          setSlotIds([]);
                          setSlotClickWarning(null);
                        }}
                      >
                        {mode === "irregular"
                          ? s === "C1"
                            ? "Irregular A"
                            : "Irregular B"
                          : s}
                      </Button>
                    ))}
                  </div>
                </div>

                {mode === "ctb" ? (
                  <div className="col-span-12 md:col-span-7">
                    <div
                      className="text-sm font-semibold"
                      style={{ color: NORD.muted }}
                    >
                      Depth
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Array.from({ length: maxDepth }).map((_, i) => {
                        const d = i + 1;
                        return (
                          <Button
                            key={d}
                            variant={depth === d ? "secondary" : "ghost"}
                            onClick={() => {
                              setDepth(d);
                              setSlotIds([]);
                              setSlotClickWarning(null);
                            }}
                          >
                            D{d}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="col-span-12 md:col-span-7" />
                )}
              </div>

              {/* Current layer: ONE shelf × ONE depth */}
              <div
                className="rounded-2xl p-3"
                style={{
                  background: hexToRgba(NORD_HEX.n2, 0.48),
                  border: `1px solid ${hexToRgba(NORD_HEX.n3, 0.26)}`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="text-sm font-semibold"
                    style={{ color: NORD.text }}
                  >
                    {mode === "irregular"
                      ? shelf === "C1"
                        ? "Irregular A"
                        : "Irregular B"
                      : shelf}{" "}
                    • D{depthForKey}
                  </div>
                  <div className="text-xs" style={{ color: NORD.subtle }}>
                    {currentOccupied}/16
                  </div>
                </div>

                {mode === "irregular" ? (
                  <div className="mb-2 text-xs" style={{ color: NORD.subtle }}>
                    Select a footprint: tap multiple squares to match the item’s
                    shape.
                  </div>
                ) : null}

                {slotClickWarning?.kind === "reserved" ||
                slotClickWarning?.kind === "occupied" ? (
                  <div
                    className="mb-2 rounded-2xl px-4 py-2"
                    style={{
                      background:
                        slotClickWarning.kind === "occupied"
                          ? hexToRgba(NORD_HEX.n11, 0.22)
                          : hexToRgba(NORD_HEX.n13, 0.22),
                      border:
                        slotClickWarning.kind === "occupied"
                          ? `1px solid ${hexToRgba(NORD_HEX.n11, 0.42)}`
                          : `1px solid ${hexToRgba(NORD_HEX.n13, 0.42)}`,
                    }}
                  >
                    <div
                      className="text-sm font-semibold"
                      style={{ color: NORD.text }}
                    >
                      {slotClickWarning.kind === "reserved"
                        ? "⚠️ Reserved location"
                        : "⚠️ Occupied location"}
                    </div>
                  </div>
                ) : null}

                {mode === "irregular" &&
                (footprintHasOccupied || footprintHasReserved) ? (
                  <div
                    className="mb-2 rounded-2xl px-4 py-2"
                    style={{
                      background: hexToRgba(NORD_HEX.n13, 0.22),
                      border: `1px solid ${hexToRgba(NORD_HEX.n13, 0.42)}`,
                    }}
                  >
                    <div
                      className="text-sm font-semibold"
                      style={{ color: NORD.text }}
                    >
                      ⚠️ Footprint overlaps
                    </div>
                    <div
                      className="mt-1 text-sm"
                      style={{ color: NORD.subtle }}
                    >
                      One or more selected squares are reserved or occupied.
                      Remove them from the footprint or choose a different area.
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-4 gap-2">
                  {currentSlots.map((s) => {
                    const isSelected =
                      Array.isArray(slotIds) && slotIds.includes(s.id);
                    const isOccupied = s.state === "occupied";
                    const isReserved = s.state === "reserved";

                    const bg = isSelected
                      ? hexToRgba(NORD_HEX.n8, 0.3)
                      : isOccupied
                        ? hexToRgba(NORD_HEX.n14, 0.2)
                        : isReserved
                          ? hexToRgba(NORD_HEX.n13, 0.2)
                          : hexToRgba(NORD_HEX.n2, 0.34);

                    const border = isSelected
                      ? `1px solid ${hexToRgba(NORD_HEX.n8, 0.55)}`
                      : isOccupied
                        ? `1px solid ${hexToRgba(NORD_HEX.n14, 0.44)}`
                        : isReserved
                          ? `1px solid ${hexToRgba(NORD_HEX.n13, 0.44)}`
                          : `1px solid ${hexToRgba(NORD_HEX.n3, 0.52)}`;

                    return (
                      <button
                        key={s.id}
                        type="button"
                        title={
                          s.state === "occupied"
                            ? "Occupied — cannot select"
                            : s.state === "reserved"
                              ? "Reserved — cannot select"
                              : ""
                        }
                        onClick={() => {
                          // Occupied + reserved squares are inspect-only (cannot be selected)
                          if (
                            s.state === "occupied" ||
                            s.state === "reserved"
                          ) {
                            setSlotClickWarning({
                              kind: s.state,
                              slotId: s.id,
                            });
                            setInspector?.(inspectSlot(`${shelf}-${s.id}`, s));
                            return;
                          }

                          if (mode === "ctb") {
                            setSlotClickWarning(null);
                            setSlotIds([s.id]);
                          } else {
                            setSlotClickWarning(null);
                            setSlotIds((prev) => {
                              const arr = Array.isArray(prev) ? prev : [];
                              return arr.includes(s.id)
                                ? arr.filter((x) => x !== s.id)
                                : [...arr, s.id];
                            });
                          }

                          setInspector?.(inspectSlot(`${shelf}-${s.id}`, s));
                        }}
                        className={
                          "aspect-square rounded-xl px-2 py-2 text-left focus:outline-none focus:ring-2 " +
                          (s.state === "occupied" || s.state === "reserved"
                            ? "cursor-not-allowed opacity-70"
                            : "")
                        }
                        style={{
                          background: bg,
                          border,
                          color: NORD.text,
                        }}
                      >
                        <div className="text-sm font-semibold">{s.id}</div>
                        <div
                          className="mt-1 text-xs"
                          style={{ color: NORD.subtle }}
                        >
                          {s.state === "occupied"
                            ? "Occupied"
                            : s.state === "reserved"
                              ? "Reserved"
                              : "Empty"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected display at bottom */}
              <div
                className="rounded-2xl px-5 py-4"
                style={{
                  background:
                    mode === "irregular"
                      ? !Array.isArray(slotIds) || slotIds.length === 0
                        ? hexToRgba(NORD_HEX.n2, 0.34)
                        : footprintOverlaps
                          ? hexToRgba(NORD_HEX.n13, 0.22)
                          : hexToRgba(NORD_HEX.n8, 0.22)
                      : selectedBg,
                  border:
                    mode === "irregular"
                      ? !Array.isArray(slotIds) || slotIds.length === 0
                        ? `1px solid ${hexToRgba(NORD_HEX.n3, 0.5)}`
                        : footprintOverlaps
                          ? `1px solid ${hexToRgba(NORD_HEX.n13, 0.42)}`
                          : `1px solid ${hexToRgba(NORD_HEX.n8, 0.42)}`
                      : selectedBorder,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div
                      className="text-lg font-semibold"
                      style={{ color: NORD.text }}
                    >
                      {mode === "irregular"
                        ? Array.isArray(slotIds) && slotIds.length
                          ? `${shelf} • D${depthForKey} • Footprint (${slotIds.length} cells)`
                          : "Select a footprint…"
                        : primarySlotId
                          ? `${shelf} • D${depthForKey} • Row ${row} • Col ${col} • ${primarySlotId}`
                          : "Select a location…"}
                    </div>
                    {mode === "irregular" &&
                    Array.isArray(slotIds) &&
                    slotIds.length ? (
                      <div
                        className="mt-1 text-sm"
                        style={{ color: NORD.subtle }}
                      >
                        {footprintMeta?.minRow != null &&
                        footprintMeta?.maxRow != null
                          ? `Rows ${footprintMeta.minRow}–${footprintMeta.maxRow} • Cols ${footprintMeta.minCol}–${footprintMeta.maxCol}`
                          : null}
                        {footprintSlotsText ? (
                          <div className="mt-1">{footprintSlotsText}</div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-full px-3 py-1.5 text-sm"
                      style={{
                        background: selectedBg,
                        color: NORD.subtle,
                        border: selectedBorder,
                      }}
                    >
                      {mode === "irregular"
                        ? Array.isArray(slotIds) && slotIds.length
                          ? "Footprint"
                          : "None"
                        : primarySlotId
                          ? selectedPillText
                          : "None"}
                    </span>

                    {mode === "irregular" &&
                    Array.isArray(slotIds) &&
                    slotIds.length &&
                    (footprintHasOccupied || footprintHasReserved) ? (
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1.5 text-sm"
                        style={{
                          background: hexToRgba(NORD_HEX.n13, 0.2),
                          color: NORD.subtle,
                          border: `1px solid ${hexToRgba(NORD_HEX.n13, 0.42)}`,
                        }}
                      >
                        Overlaps
                      </span>
                    ) : null}
                    {mode === "irregular" &&
                    Array.isArray(slotIds) &&
                    slotIds.length &&
                    footprintOverlaps ? (
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1.5 text-sm"
                        style={{
                          background: hexToRgba(NORD_HEX.n13, 0.2),
                          color: NORD.subtle,
                          border: `1px solid ${hexToRgba(NORD_HEX.n13, 0.42)}`,
                        }}
                      >
                        Overlaps
                      </span>
                    ) : null}
                  </div>
                </div>

                {selectedDisplayLabel ? (
                  <div className="mt-2 text-sm" style={{ color: NORD.subtle }}>
                    {selectedDisplayLabel}
                  </div>
                ) : null}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
