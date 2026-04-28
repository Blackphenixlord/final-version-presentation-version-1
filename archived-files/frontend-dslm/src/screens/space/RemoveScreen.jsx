import React, { useMemo, useState } from "react";

const NORD = {
  bg: "#2E3440",
  panel: "#3B4252",
  panel2: "#434C5E",
  panel3: "#4C566A",
  text: "#ECEFF4",
  subtle: "#D8DEE9",
  muted: "#A3ABB9",
  blue: "#88C0D0",
  blue2: "#81A1C1",
  blue3: "#5E81AC",
  teal: "#8FBCBB", // nord7
  green: "#A3BE8C",
  yellow: "#EBCB8B",
  red: "#BF616A",
  orange: "#D08770", // nord12
  purple: "#B48EAD", // nord15
};

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Card({ title, children, right, className, accent = "blue" }) {
  const accentMap = {
    blue: NORD.blue,
    teal: NORD.teal,
    green: NORD.green,
    yellow: NORD.yellow,
    orange: NORD.orange,
    purple: NORD.purple,
    red: NORD.red,
    neutral: "rgba(216,222,233,0.14)",
  };

  const a = accentMap[accent] ?? accentMap.blue;

  return (
    <div
      className={cn("rounded-2xl p-5", className)}
      style={{
        background: "rgba(59,66,82,0.92)",
        border: "1px solid rgba(216,222,233,0.10)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.28)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xl font-semibold" style={{ color: NORD.text }}>
            {title}
          </div>
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  className,
}) {
  const styles = {
    primary: { bg: NORD.blue3, fg: NORD.text, hover: NORD.blue2 },
    secondary: { bg: NORD.blue2, fg: NORD.text, hover: NORD.blue },
    ghost: {
      bg: "transparent",
      fg: NORD.subtle,
      hover: "rgba(216,222,233,0.08)",
      bd: "1px solid rgba(216,222,233,0.16)",
    },
    danger: { bg: NORD.red, fg: NORD.text, hover: "rgba(191,97,106,0.85)" },
  };
  const s = styles[variant] ?? styles.primary;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-5 py-4 text-lg font-semibold transition",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-95",
        className,
      )}
      style={{
        background: s.bg,
        color: s.fg,
        border: s.bd ?? "1px solid transparent",
      }}
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

function BigInput({
  value,
  onChange,
  placeholder,
  onKeyDown,
  onFocus,
  onBlur,
  className,
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      className={cn(
        "w-full rounded-2xl px-5 py-5 text-2xl font-semibold outline-none",
        className,
      )}
      style={{
        background: NORD.panel2,
        color: NORD.text,
        border: "1px solid rgba(216,222,233,0.14)",
      }}
    />
  );
}

function Pill({ label, tone = "neutral" }) {
  const map = {
    neutral: {
      bg: "rgba(129,161,193,0.16)",
      fg: NORD.blue2,
      bd: "rgba(129,161,193,0.26)",
    },
    good: {
      bg: "rgba(163,190,140,0.14)",
      fg: NORD.green,
      bd: "rgba(163,190,140,0.22)",
    },
    warn: {
      bg: "rgba(235,203,139,0.14)",
      fg: NORD.yellow,
      bd: "rgba(235,203,139,0.22)",
    },
    bad: {
      bg: "rgba(191,97,106,0.14)",
      fg: NORD.red,
      bd: "rgba(191,97,106,0.22)",
    },
  };
  const s = map[tone] ?? map.neutral;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold"
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.bd}` }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: s.fg }} />
      {label}
    </span>
  );
}

/**
 * Location code standards implemented:
 * 1) Regular top-level: S{1-3}D{1-4}L{1-16} (ex: S1D4L13)
 *    4D depth via forward slashes: TOP / CTB / CTB(or BOB) / ITEM
 *    Food uses CTB then BOB (instead of CTB/CTB).
 * 2) Irregular: IR{A|B}L{start}L{end} (ex: IRAL8L12) — single level only.
 */
function parseLocation(code) {
  const raw = String(code ?? "").trim();
  if (!raw) return { code: "—", english: "" };

  // Irregular: IRAL8L12 or IRBL3L7
  if (raw.startsWith("IRA") || raw.startsWith("IRB")) {
    const m = raw.match(/^IR([AB])L(\d{1,2})L(\d{1,2})$/);
    if (m) {
      const bay = m[1] === "A" ? "Irregular A" : "Irregular B";
      const a = Number(m[2]);
      const b = Number(m[3]);
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      return { code: raw, english: `${bay}, slots L${lo}–L${hi}` };
    }
    return { code: raw, english: "Irregular storage" };
  }

  const parts = raw.split("/").filter(Boolean);
  const top = parts[0] ?? "";
  const mt = top.match(/^S(\d)D(\d)L(\d{1,2})$/);

  let topEnglish = top;
  if (mt) {
    const shelf = Number(mt[1]);
    const depth = Number(mt[2]);
    const slot = Number(mt[3]);
    topEnglish = `Shelf ${shelf}, depth ${depth}, slot L${slot}`;
  }

  const rest = parts.slice(1);

  // treat everything except last as containers, last as item leaf
  const containerEnglish = rest
    .slice(0, Math.max(0, rest.length - 1))
    .map((seg) => {
      if (seg.startsWith("CTB-")) return `CTB ${seg.slice(4)}`;
      if (seg.startsWith("BOB-")) return `BOB ${seg.slice(4)}`;
      return seg;
    });

  const leaf = rest.length ? rest[rest.length - 1] : null;
  const leafEnglish =
    leaf && !leaf.startsWith("CTB-") && !leaf.startsWith("BOB-")
      ? `Item ${leaf}`
      : null;

  const englishBits = [topEnglish, ...containerEnglish].filter(Boolean);
  if (leafEnglish) englishBits.push(leafEnglish);

  return { code: raw, english: englishBits.join(" • ") };
}

function LocationBlock({ code, english, big = false }) {
  return (
    <div
      className={cn("rounded-2xl px-5 py-4", big ? "py-5" : "")}
      style={{
        background: "rgba(46,52,64,0.32)",
        border: "1px solid rgba(136,192,208,0.18)",
      }}
    >
      {english ? (
        <>
          <div
            className={cn(big ? "text-3xl" : "text-2xl", "font-semibold")}
            style={{ color: NORD.text }}
          >
            {english}
          </div>
          <div
            className={cn(
              big ? "mt-2 text-lg" : "mt-1 text-sm",
              "font-semibold",
            )}
            style={{ color: NORD.muted }}
          >
            {code || "—"}
          </div>
        </>
      ) : (
        <div
          className={cn(big ? "text-3xl" : "text-2xl", "font-semibold")}
          style={{ color: code && code !== "—" ? NORD.text : NORD.muted }}
        >
          {code || "—"}
        </div>
      )}
    </div>
  );
}

export default function RemoveScreen() {
  // YES: mock items are hardcoded in this file (for now).
  const BIG_DB = useMemo(
    () => [
      // Food: TOP / CTB / BOB / ITEM
      {
        id: "MEAL-0148",
        name: "Pasta Primavera",
        kind: "Consumable",
        locCode: "S1D4L03/CTB-FOOD-01/BOB-02/MEAL-0148",
        unit: "pack",
      },
      {
        id: "MEAL-0152",
        name: "Teriyaki Bowl",
        kind: "Consumable",
        locCode: "S1D2L07/CTB-FOOD-01/BOB-01/MEAL-0152",
        unit: "pack",
      },
      {
        id: "MEAL-0201",
        name: "Breakfast Burrito",
        kind: "Consumable",
        locCode: "S2D1L11/CTB-FOOD-02/BOB-03/MEAL-0201",
        unit: "pack",
      },
      {
        id: "MEAL-0216",
        name: "Granola Bar",
        kind: "Consumable",
        locCode: "S3D3L02/CTB-FOOD-03/BOB-01/MEAL-0216",
        unit: "pack",
      },
      {
        id: "MEAL-0304",
        name: "Veggie Chili",
        kind: "Consumable",
        locCode: "S2D4L04/CTB-FOOD-02/BOB-02/MEAL-0304",
        unit: "pack",
      },

      // Med: TOP / CTB / ITEM
      {
        id: "MED-0029",
        name: "Acetaminophen 500mg",
        kind: "Med",
        locCode: "S1D1L15/CTB-MED-03/MED-0029",
        unit: "tablet",
      },
      {
        id: "MED-0044",
        name: "Bandage Roll",
        kind: "Med",
        locCode: "S1D1L12/CTB-MED-01/MED-0044",
        unit: "unit",
      },
      {
        id: "MED-0061",
        name: "Antiseptic Wipes",
        kind: "Med",
        locCode: "S1D1L10/CTB-MED-02/MED-0061",
        unit: "wipe",
      },
      {
        id: "MED-0107",
        name: "Saline Flush",
        kind: "Med",
        locCode: "S1D2L06/CTB-MED-04/MED-0107",
        unit: "syringe",
      },
      {
        id: "MED-0141",
        name: "Ibuprofen 200mg",
        kind: "Med",
        locCode: "S1D1L14/CTB-MED-03/MED-0141",
        unit: "tablet",
      },

      // Tools: TOP / CTB / ITEM
      {
        id: "TOOL-001",
        name: "Hex Key Set",
        kind: "Tool",
        locCode: "S2D2L01/CTB-TOOL-01/TOOL-001",
        unit: "set",
      },
      {
        id: "TOOL-004",
        name: "Multimeter",
        kind: "Tool",
        locCode: "S2D2L03/CTB-TOOL-02/TOOL-004",
        unit: "unit",
      },
      {
        id: "TOOL-009",
        name: "Torque Wrench",
        kind: "Tool",
        locCode: "S2D2L06/CTB-TOOL-01/TOOL-009",
        unit: "unit",
      },
      {
        id: "TOOL-011",
        name: "Cable Ties",
        kind: "Tool",
        locCode: "S3D2L09/CTB-SUP-05/TOOL-011",
        unit: "unit",
      },
      {
        id: "TOOL-018",
        name: "Flush Cutter",
        kind: "Tool",
        locCode: "S2D2L02/CTB-TOOL-02/TOOL-018",
        unit: "unit",
      },

      // Supplies
      {
        id: "SUP-0032",
        name: "Nitrile Gloves",
        kind: "Supply",
        locCode: "S3D1L04/CTB-HYG-02/SUP-0032",
        unit: "pair",
      },
      {
        id: "SUP-0108",
        name: "Duct Tape",
        kind: "Supply",
        locCode: "S3D1L07/CTB-SUP-01/SUP-0108",
        unit: "roll",
      },
      {
        id: "SUP-0144",
        name: "Label Maker Tape",
        kind: "Supply",
        locCode: "S3D1L12/CTB-SUP-03/SUP-0144",
        unit: "cartridge",
      },
      {
        id: "CAB-2-USB",
        name: "USB-C Cable",
        kind: "Supply",
        locCode: "S2D3L08/CTB-SUP-06/CAB-2-USB",
        unit: "unit",
      },
      {
        id: "CAB-3-A",
        name: "USB-A Cable",
        kind: "Supply",
        locCode: "S3D3L10/CTB-SUP-06/CAB-3-A",
        unit: "unit",
      },

      // Lab + irregular example (single-level only, no CTB depth)
      {
        id: "LAB-0012",
        name: "Sample Tube Kit",
        kind: "Lab",
        locCode: "S2D4L12/CTB-LAB-01/LAB-0012",
        unit: "kit",
      },
      {
        id: "LAB-0038",
        name: "Petri Dish Pack",
        kind: "Lab",
        locCode: "S2D4L15/CTB-LAB-02/LAB-0038",
        unit: "pack",
      },
      {
        id: "LAB-0065",
        name: "Pipette Tips",
        kind: "Lab",
        locCode: "S2D4L09/CTB-LAB-03/LAB-0065",
        unit: "pack",
      },
      {
        id: "LAB-0101",
        name: "Reagent Bottle",
        kind: "Lab",
        locCode: "S1D3L06/CTB-LAB-04/LAB-0101",
        unit: "unit",
      },
      {
        id: "LAB-0123",
        name: "Microscope Slide Box",
        kind: "Lab",
        locCode: "IRAL8L12",
        unit: "unit",
      },
    ],
    [],
  );

  const mockScanPool = useMemo(
    () => [
      "RFID-0A3F-19C2",
      "RFID-7B11-22D8",
      "UUID-6f9c2b1a-acde-4c3b-9d12-9a0e9e12c001",
      "UUID-2a1d7f88-0f3e-4c0b-8a9f-1a2b3c4d5e6f",
      "TAG-CTB-001-POUCH-04",
      "TAG-S1D4L03-ITEM",
    ],
    [],
  );

  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [scanInput, setScanInput] = useState("");
  const [confirmedScan, setConfirmedScan] = useState(null);
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState(null);
  const [mockScanIdx, setMockScanIdx] = useState(0);

  const selected = useMemo(
    () => BIG_DB.find((c) => c.id === selectedId) ?? null,
    [BIG_DB, selectedId],
  );

  const selectedLoc = useMemo(() => {
    if (!selected) return { code: "—", english: "" };
    return parseLocation(selected.locCode);
  }, [selected]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const tokens = q.split(/\s+/).filter(Boolean);
    const score = (it) => {
      const loc = parseLocation(it.locCode);
      const hay =
        `${it.id} ${it.name} ${it.kind} ${it.locCode} ${loc.english}`.toLowerCase();
      let s = 0;
      for (const t of tokens) if (hay.includes(t)) s += 1;
      if (hay.startsWith(tokens[0] ?? "")) s += 1;
      return s;
    };

    return [...BIG_DB]
      .map((it) => ({ it, s: score(it) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.it.id.localeCompare(b.it.id))
      .slice(0, 7)
      .map((x) => x.it);
  }, [query, BIG_DB]);

  const showDropdown = dropdownOpen && query.trim() && results.length > 0;

  function confirmScan() {
    if (!selected) {
      setToast({ tone: "warn", msg: "Select an item first." });
      window.setTimeout(() => setToast(null), 1200);
      return;
    }
    const v = scanInput.trim();
    const tag =
      v ||
      `UUID-${Math.random().toString(16).slice(2, 10)}-${Date.now().toString(
        16,
      )}`;

    setScanInput(tag);
    setConfirmedScan(tag);

    setToast({ tone: "good", msg: "Scan confirmed." });
    window.setTimeout(() => setToast(null), 1200);
  }

  function mockScanAlwaysWorks() {
    if (!selected) {
      setToast({ tone: "warn", msg: "Select an item first." });
      window.setTimeout(() => setToast(null), 1200);
      return;
    }
    if (!mockScanPool || mockScanPool.length === 0) return;

    const next = (mockScanIdx + 1) % mockScanPool.length;
    setMockScanIdx(next);

    const tag = mockScanPool[next];
    setScanInput(tag);
    setConfirmedScan(tag);

    setToast({ tone: "good", msg: `Mock scan confirmed: ${tag}` });
    window.setTimeout(() => setToast(null), 1200);
  }

  function checkout() {
    const canCheckout = Boolean(selected) && Boolean(confirmedScan);
    if (!canCheckout) return;

    const loc = parseLocation(selected.locCode);
    setToast({
      tone: "good",
      msg: `Checked out: ${selected.name} (${loc.code}).`,
    });
    window.setTimeout(() => setToast(null), 1400);

    setQuery("");
    setDropdownOpen(false);
    setSelectedId(null);
    setScanInput("");
    setConfirmedScan(null);
    setQty(1);
  }

  return (
    <div className="h-full w-full flex flex-col gap-4">
      <Card
        title="Search"
        accent="blue"
        right={<Pill label="Search" tone="neutral" />}
      >
        <div className="relative">
          <BigInput
            className="py-7 text-3xl"
            value={query}
            onChange={(v) => {
              setQuery(v);
              setDropdownOpen(Boolean(v.trim()));

              // Editing query invalidates selection + scan.
              setSelectedId(null);
              setScanInput("");
              setConfirmedScan(null);
            }}
            placeholder="Search: item name, ID, container, location code…"
            onFocus={() => {
              if (query.trim() && results.length) setDropdownOpen(true);
            }}
            onBlur={() => {
              // allow click selection to register before closing
              window.setTimeout(() => setDropdownOpen(false), 120);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (results[0]) {
                  const picked = results[0];
                  setSelectedId(picked.id);
                  setScanInput("");
                  setConfirmedScan(null);

                  setQuery(`${picked.id} ${picked.name}`);
                  setDropdownOpen(false);
                  setToast({ tone: "neutral", msg: `Selected: ${picked.id}` });
                  window.setTimeout(() => setToast(null), 900);
                }
              }
            }}
          />

          {showDropdown ? (
            <div
              className="absolute left-0 right-0 mt-2 overflow-hidden rounded-2xl"
              style={{
                background: NORD.panel3,
                border: "1px solid rgba(129,161,193,0.22)",
                boxShadow: "0 28px 84px rgba(0,0,0,0.60)",
                zIndex: 60,
              }}
            >
              {results.map((r) => {
                const active = selectedId === r.id;
                const loc = parseLocation(r.locCode);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(r.id);
                      setScanInput("");
                      setConfirmedScan(null);

                      setQuery(`${r.id} ${r.name}`);
                      setDropdownOpen(false);
                      setToast({ tone: "neutral", msg: `Selected: ${r.id}` });
                      window.setTimeout(() => setToast(null), 900);
                    }}
                    className="w-full text-left px-5 py-4 transition"
                    style={{
                      background: active
                        ? "rgba(129,161,193,0.22)"
                        : "rgba(46,52,64,0.35)",
                      borderBottom: "1px solid rgba(216,222,233,0.08)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div
                          className="text-lg font-semibold"
                          style={{ color: NORD.text }}
                        >
                          {r.name}
                        </div>
                        <div
                          className="mt-1 text-base"
                          style={{ color: NORD.subtle }}
                        >
                          {r.id} • {r.kind}
                        </div>

                        <div className="mt-2 space-y-1">
                          <div
                            className="text-base font-semibold"
                            style={{ color: NORD.text }}
                          >
                            {loc.english}
                          </div>
                          <div
                            className="text-sm font-semibold"
                            style={{ color: NORD.muted }}
                          >
                            {loc.code}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <Pill
                          label={active ? "Selected" : "Pick"}
                          tone={active ? "good" : "neutral"}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          <LocationBlock
            big
            code={selectedLoc.code}
            english={selected ? selectedLoc.english : ""}
          />
        </div>
      </Card>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card
          title="Scan to confirm"
          accent="teal"
          right={
            <Pill
              label={confirmedScan ? "Confirmed" : "Not confirmed"}
              tone={confirmedScan ? "good" : "warn"}
            />
          }
          className="h-full"
        >
          <div className="space-y-4">
            <BigInput
              value={scanInput}
              onChange={setScanInput}
              placeholder="RFID / UUID…"
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmScan();
              }}
            />

            {!selected ? (
              <div className="text-sm" style={{ color: NORD.muted }}>
                Select an item in Search before scanning.
              </div>
            ) : null}

            {confirmedScan ? (
              <div
                className="rounded-2xl px-5 py-4"
                style={{
                  background: "rgba(163,190,140,0.10)",
                  border: "1px solid rgba(163,190,140,0.22)",
                }}
              >
                <div
                  className="text-sm font-semibold"
                  style={{ color: NORD.green }}
                >
                  Confirmed tag
                </div>
                <div
                  className="mt-1 text-2xl font-semibold"
                  style={{ color: NORD.text }}
                >
                  {confirmedScan}
                </div>
              </div>
            ) : null}

            <div className="flex gap-3">
              <Button
                className="flex-1"
                variant="secondary"
                onClick={mockScanAlwaysWorks}
                disabled={!selected}
              >
                Mock scan
              </Button>
              <Button
                className="flex-1"
                variant="ghost"
                onClick={() => {
                  setScanInput("");
                  setConfirmedScan(null);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </Card>

        <Card
          title="Check out"
          accent="purple"
          right={
            <Pill
              label={
                Boolean(selected) && Boolean(confirmedScan)
                  ? "Ready"
                  : "Incomplete"
              }
              tone={
                Boolean(selected) && Boolean(confirmedScan) ? "good" : "warn"
              }
            />
          }
          className="h-full"
        >
          <div className="space-y-4">
            {!selected ? (
              <div className="text-lg" style={{ color: NORD.subtle }}>
                Select an item above to continue.
              </div>
            ) : (
              <div
                className="rounded-2xl px-5 py-4"
                style={{
                  background: "rgba(46,52,64,0.35)",
                  border: "1px solid rgba(216,222,233,0.10)",
                }}
              >
                <div
                  className="text-2xl font-semibold"
                  style={{ color: NORD.text }}
                >
                  {selected.name}
                </div>
                <div className="mt-1 text-base" style={{ color: NORD.subtle }}>
                  {selected.id} • {selected.kind}
                </div>
              </div>
            )}

            <div
              className="rounded-2xl px-5 py-4"
              style={{
                background: "rgba(46,52,64,0.25)",
                border: "1px solid rgba(216,222,233,0.10)",
              }}
            >
              <div
                className="text-lg font-semibold"
                style={{ color: NORD.text }}
              >
                Quantity
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div className="text-base" style={{ color: NORD.subtle }}>
                  How many are you taking?
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl px-4 py-3 text-lg font-semibold"
                    style={{
                      background: "rgba(216,222,233,0.06)",
                      color: NORD.text,
                      border: "1px solid rgba(216,222,233,0.10)",
                    }}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <div
                    className="min-w-[88px] text-center rounded-xl px-4 py-3 text-2xl font-semibold"
                    style={{
                      background: NORD.panel2,
                      color: NORD.text,
                      border: "1px solid rgba(216,222,233,0.14)",
                    }}
                  >
                    {qty}
                  </div>
                  <button
                    type="button"
                    className="rounded-xl px-4 py-3 text-lg font-semibold"
                    style={{
                      background: "rgba(216,222,233,0.06)",
                      color: NORD.text,
                      border: "1px solid rgba(216,222,233,0.10)",
                    }}
                    onClick={() => setQty((q) => q + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <Button
              onClick={checkout}
              disabled={!selected || !confirmedScan}
              className="w-full py-5 text-2xl"
            >
              CHECK OUT
            </Button>
          </div>
        </Card>
      </div>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80]">
          <div
            className="rounded-2xl px-6 py-4 text-lg font-semibold"
            style={{
              background:
                toast.tone === "good"
                  ? "rgba(163,190,140,0.20)"
                  : toast.tone === "warn"
                    ? "rgba(235,203,139,0.20)"
                    : toast.tone === "neutral"
                      ? "rgba(129,161,193,0.20)"
                      : "rgba(191,97,106,0.20)",
              border:
                toast.tone === "good"
                  ? "1px solid rgba(163,190,140,0.26)"
                  : toast.tone === "warn"
                    ? "1px solid rgba(235,203,139,0.26)"
                    : toast.tone === "neutral"
                      ? "1px solid rgba(129,161,193,0.26)"
                      : "1px solid rgba(191,97,106,0.26)",
              color: NORD.text,
              boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
            }}
          >
            {toast.msg}
          </div>
        </div>
      ) : null}
    </div>
  );
}
