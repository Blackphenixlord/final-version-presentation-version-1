import React, { useMemo, useState } from "react";

// Self-contained Pack screen UI.
// If you already have shared UI components/constants elsewhere, you can later refactor
// to import them instead of duplicating.

const NORD = {
  // Polar Night
  bg: "#2E3440", // nord0
  panel: "#3B4252", // nord1
  panel2: "#434C5E", // nord2
  panel3: "#4C566A", // nord3

  // Snow Storm
  text: "#ECEFF4", // nord6
  muted: "#D8DEE9", // nord4
  subtle: "#A3AAB7", // custom-ish midpoint

  // Frost
  blue: "#88C0D0", // nord8
  blue2: "#81A1C1", // nord9
  blue3: "#5E81AC", // nord10

  // Aurora
  green: "#A3BE8C", // nord14
  yellow: "#EBCB8B", // nord13
  red: "#BF616A", // nord11
};

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function StatusPill({ label, tone = "neutral" }) {
  const map = {
    waiting: {
      bg: "rgba(129,161,193,0.14)",
      fg: NORD.blue2,
      bd: "rgba(129,161,193,0.22)",
    },
    progress: {
      bg: "rgba(136,192,208,0.14)",
      fg: NORD.blue,
      bd: "rgba(136,192,208,0.22)",
    },
    verified: {
      bg: "rgba(163,190,140,0.14)",
      fg: NORD.green,
      bd: "rgba(163,190,140,0.22)",
    },
    issue: {
      bg: "rgba(191,97,106,0.14)",
      fg: NORD.red,
      bd: "rgba(191,97,106,0.22)",
    },
    neutral: {
      bg: "rgba(76,86,106,0.22)",
      fg: NORD.muted,
      bd: "rgba(76,86,106,0.40)",
    },
  };

  const s = map[tone] ?? map.neutral;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.bd}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} />
      {label}
    </span>
  );
}

function Card({ title, children, right, className, hideHeader = false }) {
  return (
    <div
      className={cn("rounded-2xl p-5 shadow-sm flex flex-col", className)}
      style={{
        background: NORD.panel,
        border: `1px solid rgba(76,86,106,0.35)`,
      }}
    >
      {!hideHeader ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div
                className="text-base font-semibold"
                style={{ color: NORD.text }}
              >
                {title}
              </div>
            </div>
            {right ? <div className="shrink-0">{right}</div> : null}
          </div>

          <div className="mt-4 flex-1 min-h-0">{children}</div>
        </>
      ) : (
        <div className="flex-1 min-h-0">{children}</div>
      )}
    </div>
  );
}

function Button({
  children,
  variant = "primary",
  onClick,
  disabled,
  className,
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-base font-medium transition";
  const styles = {
    primary: {
      bg: NORD.blue3,
      fg: NORD.text,
      bd: "transparent",
      hover: NORD.blue2,
    },
    secondary: {
      bg: NORD.blue2,
      fg: NORD.text,
      bd: "transparent",
      hover: NORD.blue,
    },
    ghost: {
      bg: "transparent",
      fg: NORD.muted,
      bd: "rgba(76,86,106,0.45)",
      hover: "rgba(76,86,106,0.22)",
    },
    danger: {
      bg: NORD.red,
      fg: NORD.text,
      bd: "transparent",
      hover: "rgba(191,97,106,0.85)",
    },
  };
  const s = styles[variant] ?? styles.primary;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        base,
        disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-95",
        className,
      )}
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.bd}` }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (s.hover) e.currentTarget.style.background = s.hover;
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = s.bg;
      }}
    >
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder, onKeyDown, className }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={cn(
        "w-full rounded-xl px-4 py-3 text-base outline-none",
        className,
      )}
      style={{
        background: NORD.panel2,
        color: NORD.text,
        border: `1px solid rgba(76,86,106,0.45)`,
      }}
    />
  );
}

function ScreenHeader({ title, right }) {
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

function lookupUnit(data, id) {
  const trimmed = String(id || "").trim();
  if (!trimmed) return null;

  // Special labels for our five mock outside containers
  const SPECIAL = {
    "BOB-FOOD-01": {
      kind: "Bob",
      label: "Food Bob (4 meals)",
      meta: "Meals only",
    },
    "BOB-FOOD-02": {
      kind: "Bob",
      label: "Food Bob (alt)",
      meta: "Meals only",
    },
    "CTB-FOOD-01": {
      kind: "CTB",
      label: "Food CTB (small)",
      meta: "Holds bobs/items",
    },
    "CTB-LAB-BIG-01": {
      kind: "CTB",
      label: "Lab CTB (big)",
      meta: "Holds lab items",
    },
    "CTB-MED-01": { kind: "CTB", label: "Med CTB", meta: "Holds med supplies" },
    "CTB-NEST-01": {
      kind: "CTB",
      label: "Nested CTB (outer)",
      meta: "Holds CTBs/items",
    },
    "CTB-TOOL-01": {
      kind: "CTB",
      label: "Tool CTB (inner)",
      meta: "Nested container",
    },
    "CTB-TOOL-02": {
      kind: "CTB",
      label: "Tool CTB (mid)",
      meta: "Nested container",
    },
    "CTB-TOOL-03": {
      kind: "CTB",
      label: "Tool CTB (inner)",
      meta: "Nested container",
    },
  };

  if (SPECIAL[trimmed]) {
    const s = SPECIAL[trimmed];
    return {
      id: trimmed,
      kind: s.kind,
      label: s.label,
      meta: s.meta,
      tone: "progress",
    };
  }

  // LAB items (mock)
  const LAB = {
    "LAB-SENSOR-MOD": "Sensor Module",
    "LAB-HARNESS-CBL": "Harness Cable",
    "LAB-ESD-BAGS": "ESD Bags",
    "LAB-CAL-KIT": "Calibration Kit",
  };
  if (/^LAB-/i.test(trimmed)) {
    return {
      id: trimmed,
      kind: "Lab",
      label: LAB[trimmed] ?? "Lab item (mock)",
      meta: "Lab equipment",
      tone: "neutral",
    };
  }

  // MED items (mock)
  const MED = {
    "MED-TRAUMA-KIT": "Trauma Kit",
    "MED-GAUZE-PACK": "Gauze Pack",
    "MED-NITRILE-M": "Nitrile Gloves (M)",
    "MED-ALC-WIPES": "Alcohol Wipes",
  };
  if (/^MED-/i.test(trimmed)) {
    return {
      id: trimmed,
      kind: "Med",
      label: MED[trimmed] ?? "Med supply (mock)",
      meta: "Medical supply",
      tone: "neutral",
    };
  }

  // Meals
  const meal = (data?.sourceMeals ?? []).find((m) => m.id === trimmed);
  if (meal) {
    return {
      id: meal.id,
      kind: "Meal",
      label: meal.name,
      meta: `${meal.type} • ${meal.calories} kcal • exp ${meal.expiry}`,
      tone: "neutral",
    };
  }

  // Bobs (mock pattern)
  if (/^BOB-/i.test(trimmed)) {
    return {
      id: trimmed,
      kind: "Bob",
      label: "4-meal bundle (mock)",
      meta: "Holds 4 meals",
      tone: "progress",
    };
  }

  // CTBs
  if (/^CTB-/i.test(trimmed)) {
    return {
      id: trimmed,
      kind: "CTB",
      label: "Container Transfer Bag (mock)",
      meta: "Nested container",
      tone: "progress",
    };
  }

  // Fallback generic item
  return {
    id: trimmed,
    kind: "Item",
    label: "Generic item (mock)",
    meta: "No metadata in mock source",
    tone: "neutral",
  };
}

export default function PackScreen({ data, setInspector: _setInspector }) {
  // Outside = the container you are packing INTO (Bob/CTB/etc.)
  // Inside  = the unit you are putting IN (meal/item/bob/ctb/etc.)

  const [outsideDraftId, setOutsideDraftId] = useState("");
  const [outsideSelectedId, setOutsideSelectedId] = useState("");

  const [insideDraftId, setInsideDraftId] = useState("");
  const [insideSelectedId, setInsideSelectedId] = useState("");

  const [contentsByContainer, setContentsByContainer] = useState({
    // 1) Food in a bob (shows Bob capacity + meal-only rule)
    "BOB-FOOD-01": ["MEAL-0001", "MEAL-0002", "MEAL-0003"],
    "BOB-FOOD-02": ["MEAL-0004"],

    // 2) A bob in a CTB (CTB holds bobs/items)
    "CTB-FOOD-01": ["BOB-FOOD-01", "BOB-FOOD-02"],

    // 3) Lab equipment in a big CTB
    "CTB-LAB-BIG-01": ["LAB-HARNESS-CBL", "LAB-ESD-BAGS", "LAB-SENSOR-MOD"],

    // 4) Med supplies in a CTB
    "CTB-MED-01": ["MED-TRAUMA-KIT", "MED-ALC-WIPES", "MED-NITRILE-M"],

    // 5) Deep nesting demo (up to 4 levels deep from the outside container):
    // CTB-NEST-01 contains CTB-TOOL-01 contains CTB-TOOL-02 contains CTB-TOOL-03 contains ITEM-ALPHA
    "CTB-NEST-01": ["CTB-TOOL-01"],
    "CTB-TOOL-01": ["CTB-TOOL-02"],
    "CTB-TOOL-02": ["CTB-TOOL-03"],
    "CTB-TOOL-03": ["ITEM-ALPHA", "ITEM-BETA"],
  });

  const [lastAction, setLastAction] = useState(null);

  const outsideUnit = useMemo(
    () => lookupUnit(data, outsideSelectedId),
    [data, outsideSelectedId],
  );
  const insideUnit = useMemo(
    () => lookupUnit(data, insideSelectedId),
    [data, insideSelectedId],
  );

  function pickRandom(list) {
    if (!Array.isArray(list) || list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
  }

  function mockOutsideId(excludeId) {
    const pool = [
      "BOB-FOOD-01", // food bob
      "CTB-FOOD-01", // bob -> ctb
      "CTB-LAB-BIG-01", // lab equipment -> big ctb
      "CTB-MED-01", // med supplies -> ctb
      "CTB-NEST-01", // nested ctb -> ctb
    ];

    const ex = String(excludeId || "").trim();
    const filtered = ex ? pool.filter((x) => x !== ex) : pool;

    // If pool collapses to empty (shouldn't), fall back.
    return pickRandom(filtered.length ? filtered : pool) || "CTB-FOOD-01";
  }

  function mockInsideId(outsideId) {
    const o = String(outsideId || "").trim();

    // 1) Food in a bob
    if (o === "BOB-FOOD-01") {
      const meals = data?.sourceMeals ?? [];
      const m = pickRandom(meals);
      return m?.id || "MEAL-0001";
    }

    // 2) Bob in a CTB
    if (o === "CTB-FOOD-01") {
      return pickRandom(["BOB-FOOD-01", "BOB-FOOD-02"]) || "BOB-FOOD-01";
    }

    // 3) Lab equipment in a big CTB
    if (o === "CTB-LAB-BIG-01") {
      return (
        pickRandom([
          "LAB-SENSOR-MOD",
          "LAB-HARNESS-CBL",
          "LAB-ESD-BAGS",
          "LAB-CAL-KIT",
        ]) || "LAB-SENSOR-MOD"
      );
    }

    // 4) Med supplies in a CTB
    if (o === "CTB-MED-01") {
      return (
        pickRandom([
          "MED-TRAUMA-KIT",
          "MED-GAUZE-PACK",
          "MED-NITRILE-M",
          "MED-ALC-WIPES",
        ]) || "MED-TRAUMA-KIT"
      );
    }

    // 5) CTB nested in another CTB
    if (o === "CTB-NEST-01") {
      return (
        pickRandom(["CTB-TOOL-01", "CTB-TOOL-02", "CTB-TOOL-03"]) ||
        "CTB-TOOL-01"
      );
    }

    // Fallback
    const n = String(Math.floor(Math.random() * 900) + 100);
    return `ITEM-${n}`;
  }

  function isContainer(unit) {
    return unit?.kind === "CTB" || unit?.kind === "Bob";
  }

  function capacityFor(unit) {
    if (unit?.kind === "CTB") return 12; // mock slots
    if (unit?.kind === "Bob") return 4; // meals
    return 0;
  }

  function sizeFor(_unit) {
    // mock “slot” size for packing into CTBs; meals are 1
    return 1;
  }

  function getContents(containerId) {
    const ids = contentsByContainer[containerId] ?? [];
    return ids.map(
      (id) => lookupUnit(data, id) ?? { id, kind: "Item", label: "Unknown" },
    );
  }

  function canPack(outside, inside) {
    if (!outside || !inside)
      return { ok: false, reason: "Select outside + inside" };
    if (!isContainer(outside))
      return { ok: false, reason: "Outside must be a container" };

    // Type rule: Bob accepts only meals; CTB accepts anything
    if (outside.kind === "Bob" && inside.kind !== "Meal") {
      return { ok: false, reason: "Bob accepts meals only" };
    }

    const cap = capacityFor(outside);
    const used = (contentsByContainer[outside.id] ?? []).length;
    const need = sizeFor(inside);
    if (used + need > cap) return { ok: false, reason: "Not enough room" };

    return { ok: true, reason: "Ready" };
  }

  function scanOutside() {
    const v = String(outsideDraftId || "").trim();
    const POOL = [
      "BOB-FOOD-01",
      "CTB-FOOD-01",
      "CTB-LAB-BIG-01",
      "CTB-MED-01",
      "CTB-NEST-01",
    ];

    // Manual scan if user typed some other id.
    if (v && !POOL.includes(v)) {
      setOutsideSelectedId(v);
      return;
    }

    // Mock scan: always choose a new container (override previous selection).
    const next = mockOutsideId(outsideSelectedId);
    setOutsideDraftId(next);
    setOutsideSelectedId(next);
  }
  function clearOutside() {
    setOutsideSelectedId("");
  }

  function scanInside() {
    const v = String(insideDraftId || "").trim();
    const basis = outsideSelectedId || outsideDraftId;
    const next = v || mockInsideId(basis);
    setInsideDraftId(next);
    setInsideSelectedId(next);
  }
  function clearInside() {
    setInsideSelectedId("");
  }

  const MAX_NEST_DEPTH = 4;

  function getContentIds(containerId) {
    return contentsByContainer[containerId] ?? [];
  }

  function buildContentsTree(containerId, depth = 1, seen = new Set()) {
    const id = String(containerId || "").trim();
    if (!id) return [];
    if (depth > MAX_NEST_DEPTH) return [];

    // Prevent cycles
    const key = `${id}::${depth}`;
    if (seen.has(key)) return [];
    seen.add(key);

    const ids = getContentIds(id);
    return ids.map((childId) => {
      const unit = lookupUnit(data, childId) ?? {
        id: childId,
        kind: "Item",
        label: "Unknown",
      };

      const children =
        isContainer(unit) && depth < MAX_NEST_DEPTH
          ? buildContentsTree(unit.id, depth + 1, new Set(seen))
          : [];

      return { unit, children };
    });
  }

  function countTree(nodes) {
    return (nodes || []).reduce(
      (acc, n) => acc + 1 + countTree(n.children || []),
      0,
    );
  }

  const outsideTree = useMemo(
    () => (outsideSelectedId ? buildContentsTree(outsideSelectedId, 1) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [outsideSelectedId, contentsByContainer, data],
  );

  const insideTree = useMemo(
    () => (insideSelectedId ? buildContentsTree(insideSelectedId, 1) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [insideSelectedId, contentsByContainer, data],
  );

  const packCheck = useMemo(
    () => canPack(outsideUnit, insideUnit),
    [outsideUnit, insideUnit, contentsByContainer],
  );

  const outsideCap = capacityFor(outsideUnit);
  const outsideUsed = outsideUnit
    ? (contentsByContainer[outsideUnit.id] ?? []).length
    : 0;
  const outsideLeft = outsideUnit ? Math.max(0, outsideCap - outsideUsed) : 0;

  const insideSize = insideUnit ? sizeFor(insideUnit) : 0;

  function doPack() {
    if (!packCheck.ok || !outsideUnit || !insideUnit) {
      setLastAction({
        kind: "warn",
        title: "Cannot pack",
        detail: packCheck.reason,
      });
      return;
    }

    setContentsByContainer((prev) => {
      const next = { ...prev };
      const key = outsideUnit.id;
      const arr = [...(next[key] ?? [])];
      arr.push(insideUnit.id);
      next[key] = arr;
      return next;
    });

    setLastAction({
      kind: "ok",
      title: "Packed",
      detail: `${insideUnit.id} → ${outsideUnit.id}`,
    });

    // reset inside for the next scan; keep outside for batch packing
    setInsideDraftId("");
    setInsideSelectedId("");
  }

  function clearAll() {
    setOutsideDraftId("");
    setOutsideSelectedId("");
    setInsideDraftId("");
    setInsideSelectedId("");
    setLastAction(null);
  }

  const cardInnerStyle = {
    background: NORD.panel2,
    border: `1px solid rgba(216,222,233,0.10)`,
  };

  function ProminentSelection({ unit, emptyText }) {
    return (
      <div className="min-w-0">
        <div
          className="text-lg font-semibold truncate"
          style={{ color: NORD.text }}
        >
          {unit?.label ?? emptyText}
        </div>
        <div className="mt-1 text-sm truncate" style={{ color: NORD.subtle }}>
          {unit ? `${unit.id} • ${unit.kind}` : ""}
        </div>
      </div>
    );
  }

  function CollapsibleContents({ title, tree }) {
    const total = countTree(tree);

    function NodeRow({ node, level }) {
      const u = node.unit;
      const hasChildren = (node.children || []).length > 0;

      const row = (
        <div
          className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
          style={{
            background: "rgba(46,52,64,0.35)",
            border: `1px solid rgba(236,239,244,0.06)`,
            marginLeft: level ? `${Math.min(level, 4) * 12}px` : undefined,
          }}
        >
          <div className="min-w-0">
            <div
              className="text-base font-semibold truncate"
              style={{ color: NORD.text }}
            >
              {u.label}
            </div>
            <div className="text-sm truncate" style={{ color: NORD.subtle }}>
              {u.id} • {u.kind}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <StatusPill
                label={`${node.children.length} inside`}
                tone="neutral"
              />
            ) : null}
            <StatusPill label={u.kind} tone="neutral" />
          </div>
        </div>
      );

      if (!hasChildren) return row;

      return (
        <details className="rounded-2xl" open={false}>
          <summary className="cursor-pointer list-none">{row}</summary>
          <div className="mt-2 space-y-2">
            {node.children.map((c) => (
              <NodeRow key={c.unit.id} node={c} level={level + 1} />
            ))}
          </div>
        </details>
      );
    }

    return (
      <details
        className="rounded-2xl p-4"
        style={{
          background: "rgba(46,52,64,0.35)",
          border: `1px solid rgba(236,239,244,0.06)`,
        }}
      >
        <summary
          className="cursor-pointer select-none list-none flex items-center justify-between"
          style={{ color: NORD.text }}
        >
          <span className="text-base font-semibold">{title}</span>
          <span className="text-sm" style={{ color: NORD.subtle }}>
            {total}
          </span>
        </summary>

        <div className="mt-3 space-y-2">
          {tree.length ? (
            tree.map((n) => <NodeRow key={n.unit.id} node={n} level={0} />)
          ) : (
            <div className="text-sm" style={{ color: NORD.subtle }}>
              —
            </div>
          )}
        </div>
      </details>
    );
  }

  return (
    <div className="space-y-4">
      <ScreenHeader title="Pack" />

      <div className="grid grid-cols-12 gap-4 items-stretch">
        {/* LEFT: Outside (container) */}
        <div className="col-span-12 xl:col-span-6">
          <Card title="Outside" className="h-full">
            <div
              className="rounded-2xl p-4 h-full flex flex-col"
              style={cardInnerStyle}
            >
              <div className="flex items-center justify-between gap-3">
                <ProminentSelection
                  unit={outsideUnit}
                  emptyText="Nothing selected"
                />
                <StatusPill
                  label={outsideUnit?.kind ?? "—"}
                  tone={outsideUnit ? "progress" : "neutral"}
                />
              </div>

              <div className="mt-4 grid grid-cols-12 gap-3 items-center">
                <div className="col-span-12 md:col-span-7">
                  <Input
                    value={outsideDraftId}
                    onChange={setOutsideDraftId}
                    placeholder="Scan outside RFID/ID"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") scanOutside();
                    }}
                  />
                </div>
                <div className="col-span-12 md:col-span-5 flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={scanOutside}
                  >
                    Scan
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={clearOutside}
                    disabled={!outsideSelectedId}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT: Inside (unit) */}
        <div className="col-span-12 xl:col-span-6">
          <Card title="Inside" className="h-full">
            <div
              className="rounded-2xl p-4 h-full flex flex-col"
              style={cardInnerStyle}
            >
              <div className="flex items-center justify-between gap-3">
                <ProminentSelection
                  unit={insideUnit}
                  emptyText="Nothing selected"
                />
                <StatusPill
                  label={insideUnit?.kind ?? "—"}
                  tone={insideUnit ? "progress" : "neutral"}
                />
              </div>

              <div className="mt-4 grid grid-cols-12 gap-3 items-center">
                <div className="col-span-12 md:col-span-7">
                  <Input
                    value={insideDraftId}
                    onChange={setInsideDraftId}
                    placeholder="Scan inside RFID/ID"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") scanInside();
                    }}
                  />
                </div>
                <div className="col-span-12 md:col-span-5 flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={scanInside}
                  >
                    Scan
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={clearInside}
                    disabled={!insideSelectedId}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card
        title="Verify"
        right={
          <StatusPill
            label={packCheck.ok ? "Ready" : "Not ready"}
            tone={packCheck.ok ? "verified" : "issue"}
          />
        }
      >
        <div
          className="rounded-2xl p-5"
          style={{
            background: NORD.panel2,
            border: `1px solid rgba(216,222,233,0.10)`,
          }}
        >
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-12 xl:col-span-6 space-y-3">
              <CollapsibleContents
                title="Outside contents"
                tree={outsideTree}
              />
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(46,52,64,0.35)",
                  border: `1px solid rgba(236,239,244,0.06)`,
                }}
              >
                <div
                  className="text-base font-semibold"
                  style={{ color: NORD.text }}
                >
                  Room left
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusPill
                    label={
                      outsideUnit ? `${outsideUsed}/${outsideCap} used` : "—"
                    }
                    tone="neutral"
                  />
                  <StatusPill
                    label={outsideUnit ? `${outsideLeft} left` : "—"}
                    tone={
                      outsideUnit
                        ? outsideLeft > 0
                          ? "verified"
                          : "issue"
                        : "neutral"
                    }
                  />
                </div>
              </div>
            </div>

            <div className="col-span-12 xl:col-span-6 space-y-3">
              <CollapsibleContents title="Inside contents" tree={insideTree} />
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(46,52,64,0.35)",
                  border: `1px solid rgba(236,239,244,0.06)`,
                }}
              >
                <div
                  className="text-base font-semibold"
                  style={{ color: NORD.text }}
                >
                  Inside size
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusPill
                    label={insideUnit ? `${insideSize} slot` : "—"}
                    tone="neutral"
                  />
                  <StatusPill
                    label={insideUnit ? insideUnit.kind : "—"}
                    tone={insideUnit ? "progress" : "neutral"}
                  />
                </div>
              </div>
            </div>

            <div className="col-span-12">
              {lastAction ? (
                <div
                  className="rounded-2xl px-5 py-4"
                  style={{
                    background:
                      lastAction.kind === "ok"
                        ? "rgba(163,190,140,0.12)"
                        : "rgba(235,203,139,0.12)",
                    border:
                      lastAction.kind === "ok"
                        ? "1px solid rgba(163,190,140,0.20)"
                        : "1px solid rgba(235,203,139,0.20)",
                  }}
                >
                  <div
                    className="text-base font-semibold"
                    style={{ color: NORD.text }}
                  >
                    {lastAction.title}
                  </div>
                  <div className="mt-1 text-sm" style={{ color: NORD.subtle }}>
                    {lastAction.detail}
                  </div>
                </div>
              ) : null}

              <div className="mt-4 grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-6">
                  <Button
                    className="w-full"
                    onClick={doPack}
                    disabled={!packCheck.ok}
                  >
                    Pack
                  </Button>
                </div>
                <div className="col-span-12 md:col-span-6">
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={clearAll}
                  >
                    Clear all
                  </Button>
                </div>
              </div>

              {!packCheck.ok ? (
                <div className="mt-3 text-sm" style={{ color: NORD.subtle }}>
                  {packCheck.reason}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
