import React, { useEffect, useMemo, useState } from "react";

// Local, self-contained screen implementation.
// Mirrors the provided mock-source behavior but is scoped to ReceiveScreen only.

const NORD = {
  bg: "#2E3440",
  panel: "#3B4252",
  panel2: "#434C5E",
  panel3: "#4C566A",
  text: "#ECEFF4",
  muted: "#D8DEE9",
  subtle: "#AEB6C2",
  blue: "#88C0D0",
  blue2: "#81A1C1",
  blue3: "#5E81AC",
  green: "#A3BE8C",
  yellow: "#EBCB8B",
  red: "#BF616A",
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
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.bd}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} />
      {label}
    </span>
  );
}

function Card({ children, className, hideHeader = true }) {
  return (
    <div
      className={cn("rounded-2xl p-4 shadow-sm", className)}
      style={{
        background: NORD.panel,
        border: `1px solid rgba(76,86,106,0.35)`,
      }}
    >
      {hideHeader ? <div>{children}</div> : children}
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
    "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition";
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

function ScreenHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-lg font-semibold" style={{ color: NORD.text }}>
          {title}
        </div>
        {subtitle ? (
          <div className="mt-0.5 text-sm" style={{ color: NORD.subtle }}>
            {subtitle}
          </div>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function ManifestModal({ open, onClose, manifest }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div
        className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl"
        style={{
          background: NORD.panel3,
          border: `1px solid rgba(236,239,244,0.08)`,
          boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid rgba(236,239,244,0.08)` }}
        >
          <div className="min-w-0">
            <div
              className="text-2xl font-semibold"
              style={{ color: NORD.text }}
            >
              Manifest
            </div>
            {manifest?.shipmentId ? (
              <div className="mt-1 text-base" style={{ color: NORD.subtle }}>
                {manifest.shipmentId} • {manifest.supplier}
              </div>
            ) : null}
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="p-5 overflow-auto max-h-[calc(90vh-76px)] space-y-4">
          {!manifest ? (
            <div className="text-lg" style={{ color: NORD.muted }}>
              No manifest available.
            </div>
          ) : (
            <>
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(46,52,64,0.45)",
                  border: `1px solid rgba(236,239,244,0.08)`,
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div
                      className="text-3xl font-semibold"
                      style={{ color: NORD.text }}
                    >
                      {manifest.title}
                    </div>
                    <div className="mt-1 text-lg" style={{ color: NORD.muted }}>
                      {manifest.subtitle}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <StatusPill
                      label={manifest.stateLabel}
                      tone={manifest.stateTone}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {manifest.meta.map((m) => (
                    <div
                      key={m.k}
                      className="rounded-2xl p-4"
                      style={{
                        background: "rgba(46,52,64,0.35)",
                        border: `1px solid rgba(236,239,244,0.06)`,
                      }}
                    >
                      <div className="text-base" style={{ color: NORD.subtle }}>
                        {m.k}
                      </div>
                      <div
                        className="mt-2 text-xl font-semibold"
                        style={{ color: NORD.text }}
                      >
                        {m.v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="rounded-2xl p-4"
                style={{
                  background: NORD.panel2,
                  border: `1px solid rgba(216,222,233,0.10)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="text-xl font-semibold"
                    style={{ color: NORD.text }}
                  >
                    Line items
                  </div>
                  <div className="text-base" style={{ color: NORD.subtle }}>
                    {manifest.lines.length} lines
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {manifest.lines.map((l) => (
                    <div
                      key={l.sku}
                      className="rounded-2xl px-4 py-4"
                      style={{
                        background: "rgba(46,52,64,0.35)",
                        border: `1px solid rgba(236,239,244,0.06)`,
                      }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div
                            className="text-xl font-semibold"
                            style={{ color: NORD.text }}
                          >
                            {l.name}
                          </div>
                          <div
                            className="mt-1 text-base"
                            style={{ color: NORD.subtle }}
                          >
                            {l.sku}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-4">
                          <div className="text-right">
                            <div
                              className="text-sm"
                              style={{ color: NORD.subtle }}
                            >
                              Expected
                            </div>
                            <div
                              className="text-3xl font-semibold"
                              style={{ color: NORD.text }}
                            >
                              {l.expected}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className="text-sm"
                              style={{ color: NORD.subtle }}
                            >
                              Counted
                            </div>
                            <div
                              className="text-3xl font-semibold"
                              style={{ color: NORD.text }}
                            >
                              {l.counted}
                            </div>
                          </div>
                          <StatusPill label={l.stateLabel} tone={l.stateTone} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="fixed inset-0 -z-10" onClick={onClose} />
    </div>
  );
}

function makeInspectorForShipment(s) {
  return {
    kind: "shipment",
    shipmentId: s?.id ?? "",
    manifest: true,

    title: s?.id ?? "Shipment",
    subtitle: s?.supplier ?? "",

    pills: [{ label: s?.status ?? "", tone: s?.tone ?? "neutral" }],

    details: {
      Supplier: s?.supplier,
      Status: s?.status,
      "Expected / received": s?.count ?? "—",
    },

    contents: ["Pallet-01", "Pallet-02", "Container-A"],

    history: [
      { when: "08:58", what: "Shipment arrived" },
      { when: "09:04", what: "Receiving started" },
    ],
  };
}

export default function ReceiveScreen({ data, onInspect }) {
  const [inboundList] = useState(data?.inbound ?? []);
  const [selected, setSelected] = useState(data?.inbound?.[0]?.id ?? "");

  const [manifestOpen, setManifestOpen] = useState(false);

  const SAMPLE_MANIFEST_META = {
    "SHIP-8841": {
      manifestId: "MFT-2026-01-8841",
      po: "PO-KSC-ML-8841",
      carrier: "KSC Ground Freight",
      shipDate: "2026-01-27",
      dock: "Dock 2",
      containers: "2 pallets",
      handling: "Ambient",
    },
    "SHIP-8910": {
      manifestId: "MFT-2026-01-8910",
      po: "PO-KSC-MED-8910",
      carrier: "FedEx Freight",
      shipDate: "2026-01-27",
      dock: "Dock 2",
      containers: "1 pallet + 2 totes",
      handling: "Keep dry",
    },
    "SHIP-8932": {
      manifestId: "MFT-2026-01-8932",
      po: "PO-KSC-LAB-8932",
      carrier: "UPS Freight",
      shipDate: "2026-01-27",
      dock: "Dock 1",
      containers: "1 crate",
      handling: "ESD sensitive",
    },
    "SHIP-8999": {
      manifestId: "MFT-2026-01-8999",
      po: "PO-KSC-HYG-8999",
      carrier: "KSC Ground Freight",
      shipDate: "2026-01-27",
      dock: "Dock 3",
      containers: "1 pallet",
      handling: "Standard",
    },
    "SHIP-9050": {
      manifestId: "MFT-2026-01-9050",
      po: "PO-KSC-SPR-9050",
      carrier: "Will-call / internal transfer",
      shipDate: "2026-01-27",
      dock: "Dock 2",
      containers: "0 (paperwork only)",
      handling: "N/A",
    },
  };

  function defaultLinesForShipmentId(id) {
    if (id === "SHIP-8841") {
      return [
        {
          sku: "MEAL-PASTA-PRIM",
          name: "Pasta Primavera",
          expected: 18,
          counted: 12,
          issue: false,
        },
        {
          sku: "MEAL-CURRY-VEG",
          name: "Veggie Curry",
          expected: 18,
          counted: 18,
          issue: false,
        },
        {
          sku: "MEAL-OAT-BFST",
          name: "Oatmeal Breakfast",
          expected: 12,
          counted: 6,
          issue: false,
        },
      ];
    }

    if (id === "SHIP-8910") {
      return [
        {
          sku: "MED-TRAUMA-KIT",
          name: "Trauma Kit",
          expected: 4,
          counted: 4,
          issue: false,
        },
        {
          sku: "MED-GAUZE-PACK",
          name: "Gauze Pack (sterile)",
          expected: 10,
          counted: 8,
          issue: true,
        },
        {
          sku: "MED-NITRILE-M",
          name: "Nitrile Gloves (M)",
          expected: 6,
          counted: 6,
          issue: false,
        },
        {
          sku: "MED-ALC-WIPES",
          name: "Alcohol Wipes",
          expected: 20,
          counted: 20,
          issue: false,
        },
      ];
    }

    if (id === "SHIP-8932") {
      return [
        {
          sku: "LAB-SENSOR-MOD",
          name: "Sensor Module",
          expected: 4,
          counted: 4,
          issue: false,
        },
        {
          sku: "LAB-HARNESS-CBL",
          name: "Harness Cable",
          expected: 2,
          counted: 2,
          issue: false,
        },
        {
          sku: "LAB-ESD-BAGS",
          name: "ESD Bags",
          expected: 25,
          counted: 25,
          issue: false,
        },
      ];
    }

    if (id === "SHIP-8999") {
      return [
        {
          sku: "HYG-WATER-1L",
          name: "Potable Water (1L)",
          expected: 24,
          counted: 0,
          issue: false,
        },
        {
          sku: "HYG-SANITIZER",
          name: "Hand Sanitizer",
          expected: 6,
          counted: 0,
          issue: false,
        },
        {
          sku: "HYG-WIPES",
          name: "Surface Wipes",
          expected: 10,
          counted: 0,
          issue: false,
        },
        {
          sku: "HYG-TPACK",
          name: "Toiletry Pack",
          expected: 8,
          counted: 0,
          issue: false,
        },
      ];
    }

    if (id === "SHIP-9050") {
      return [];
    }

    return [
      {
        sku: "UNKNOWN",
        name: "Unspecified item",
        expected: 0,
        counted: 0,
        issue: false,
      },
    ];
  }

  const [receiveByShipId, setReceiveByShipId] = useState(() => {
    const m = {};
    for (const s of data?.inbound || []) {
      m[s.id] = { lines: defaultLinesForShipmentId(s.id), processed: false };
    }
    return m;
  });

  const [activeSku, setActiveSku] = useState(null);

  function ensureShipState(shipId) {
    setReceiveByShipId((prev) => {
      if (prev[shipId]) return prev;
      return {
        ...prev,
        [shipId]: {
          lines: defaultLinesForShipmentId(shipId),
          processed: false,
        },
      };
    });
  }

  useEffect(() => {
    function handler(e) {
      const shipId = e?.detail?.shipmentId;
      if (!shipId) return;

      const found = inboundList.find((x) => x.id === shipId);
      if (found) {
        setSelected(found.id);
        ensureShipState(found.id);

        const st = receiveByShipId[found.id];
        const first = st?.lines?.[0]?.sku;
        setActiveSku(first ?? null);
      }

      setManifestOpen(true);
    }

    window.addEventListener("ksc:open-manifest", handler);
    return () => window.removeEventListener("ksc:open-manifest", handler);
  }, [inboundList, receiveByShipId]);

  const sel = inboundList.find((x) => x.id === selected) ?? inboundList[0];
  const shipState = receiveByShipId[sel?.id] ?? { lines: [] };
  const isProcessed = Boolean(receiveByShipId[sel?.id]?.processed);

  function computeShipmentSummary(shipId) {
    const st = receiveByShipId[shipId];
    const lines = st?.lines || [];

    const expected = lines.reduce(
      (acc, l) => acc + (Number(l.expected) || 0),
      0,
    );
    const counted = lines.reduce((acc, l) => acc + (Number(l.counted) || 0), 0);

    const hasIssue = lines.some((l) => Boolean(l.issue));
    const processed = Boolean(receiveByShipId[shipId]?.processed);

    let label = "In progress";
    let tone = "progress";

    if (processed) {
      label = "Done";
      tone = "verified";
    } else if (!lines.length) {
      label = "Waiting";
      tone = "neutral";
    } else if (hasIssue) {
      label = "Discrepancy";
      tone = "issue";
    } else if (counted === 0) {
      label = "Waiting";
      tone = "waiting";
    }

    return {
      label,
      tone,
      expected,
      counted,
      countText: expected > 0 ? `${counted}/${expected}` : `0/0`,
    };
  }

  const totals = useMemo(() => {
    const lines = shipState.lines || [];
    const expected = lines.reduce(
      (acc, l) => acc + (Number(l.expected) || 0),
      0,
    );
    const counted = lines.reduce((acc, l) => acc + (Number(l.counted) || 0), 0);
    const progress =
      expected > 0 ? Math.max(0, Math.min(1, counted / expected)) : 0;

    const hasIssue = lines.some((l) => Boolean(l.issue));
    const processed = Boolean(receiveByShipId[sel?.id]?.processed);

    let stateLabel = "In progress";
    let stateTone = "progress";

    if (processed) {
      stateLabel = "Done";
      stateTone = "verified";
    } else if (!lines.length) {
      stateLabel = "Waiting";
      stateTone = "neutral";
    } else if (hasIssue) {
      stateLabel = "Discrepancy";
      stateTone = "issue";
    } else if (counted === 0) {
      stateLabel = "Waiting";
      stateTone = "waiting";
    }

    const canProcess =
      !processed &&
      lines.length > 0 &&
      !hasIssue &&
      lines.every((l) => {
        const e = Number(l.expected) || 0;
        const c = Number(l.counted) || 0;
        return e === c;
      });

    return {
      expected,
      counted,
      progress,
      stateLabel,
      stateTone,
      canProcess,
      processed,
    };
  }, [shipState, receiveByShipId, sel?.id]);

  const activeLine =
    (shipState.lines || []).find((l) => l.sku === activeSku) ??
    (shipState.lines || [])[0] ??
    null;

  function lineStatus(line) {
    const e = Number(line.expected) || 0;
    const c = Number(line.counted) || 0;
    if (line.issue) return { label: "Discrepancy", tone: "issue" };
    if (e > 0 && c === e) return { label: "Done", tone: "verified" };
    if (c === 0) return { label: "Waiting", tone: "waiting" };
    return { label: "In progress", tone: "progress" };
  }

  function bumpLine(sku, delta) {
    if (!sel?.id) return;
    setReceiveByShipId((prev) => {
      const st = prev[sel.id] ?? { lines: [] };
      const lines = (st.lines || []).map((l) => {
        if (l.sku !== sku) return l;
        const next = Math.max(0, (Number(l.counted) || 0) + delta);
        return { ...l, counted: next };
      });
      return { ...prev, [sel.id]: { ...st, lines } };
    });
  }

  function toggleLineIssue(sku) {
    if (!sel?.id) return;
    setReceiveByShipId((prev) => {
      const st = prev[sel.id] ?? { lines: [] };
      const lines = (st.lines || []).map((l) =>
        l.sku === sku ? { ...l, issue: !l.issue } : l,
      );
      return { ...prev, [sel.id]: { ...st, lines } };
    });
  }

  function buildManifestForSelectedShipment() {
    if (!sel) return null;

    const meta = SAMPLE_MANIFEST_META[sel.id] || {
      manifestId: `MFT-MOCK-${sel.id}`,
      po: `PO-MOCK-${sel.id}`,
      carrier: "(mock carrier)",
      shipDate: "2026-01-27",
      dock: "Dock 2",
      containers: "1 pallet",
      handling: "Standard",
    };

    const lines = (shipState.lines || []).map((l) => {
      const e = Number(l.expected) || 0;
      const c = Number(l.counted) || 0;

      let stateLabel = "In progress";
      let stateTone = "progress";
      if (l.issue) {
        stateLabel = "Discrepancy";
        stateTone = "issue";
      } else if (e > 0 && c === e) {
        stateLabel = "Done";
        stateTone = "verified";
      } else if (c === 0) {
        stateLabel = "Waiting";
        stateTone = "waiting";
      }

      return {
        sku: l.sku,
        name: l.name,
        expected: e,
        counted: c,
        stateLabel,
        stateTone,
      };
    });

    return {
      shipmentId: sel.id,
      supplier: sel.supplier,
      title: meta.manifestId,
      subtitle: `${sel.supplier} • ${meta.po}`,
      stateLabel: totals.stateLabel,
      stateTone: totals.stateTone,
      meta: [
        { k: "PO", v: meta.po },
        { k: "Carrier", v: meta.carrier },
        { k: "Ship date", v: meta.shipDate },
        { k: "Dock", v: meta.dock },
        { k: "Containers", v: meta.containers },
        { k: "Handling", v: meta.handling },
      ],
      lines,
    };
  }

  return (
    <>
      <div className="h-full flex flex-col gap-4">
        <ScreenHeader title="Receive" />

        <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
          {/* Left: inbound list rail */}
          <div className="col-span-12 xl:col-span-3 h-full">
            <div
              className="rounded-2xl p-3 h-full flex flex-col"
              style={{
                background: NORD.panel,
                border: `1px solid rgba(236,239,244,0.06)`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div
                    className="text-base font-semibold"
                    style={{ color: NORD.text }}
                  >
                    Inbound
                  </div>
                  <div
                    className="mt-0.5 text-sm"
                    style={{ color: NORD.subtle }}
                  >
                    Tap a shipment to select
                  </div>
                </div>
                <div className="text-sm" style={{ color: NORD.subtle }}>
                  {inboundList.length} total
                </div>
              </div>

              <div className="mt-3 space-y-2 flex-1 min-h-0 overflow-auto pr-1">
                {inboundList.map((s) => {
                  const isSel = selected === s.id;
                  const summary = computeShipmentSummary(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelected(s.id);
                        ensureShipState(s.id);
                        const st = receiveByShipId[s.id];
                        const first = st?.lines?.[0]?.sku;
                        setActiveSku(first ?? null);
                      }}
                      className={cn(
                        "relative w-full rounded-xl px-3 py-3 text-left transition",
                        isSel ? "" : "hover:opacity-95",
                      )}
                      style={{
                        background: isSel
                          ? "rgba(136,192,208,0.18)"
                          : NORD.panel2,
                        border: `1px solid ${isSel ? "rgba(136,192,208,0.32)" : "rgba(216,222,233,0.10)"}`,
                      }}
                    >
                      {isSel ? (
                        <span
                          className="absolute left-0 top-2 bottom-2 w-1 rounded-r"
                          style={{ background: NORD.blue }}
                        />
                      ) : null}

                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div
                            className="text-base font-semibold"
                            style={{ color: NORD.text }}
                          >
                            {s.id}
                          </div>
                          <div
                            className="text-sm truncate"
                            style={{ color: NORD.subtle }}
                          >
                            {s.supplier}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <StatusPill
                            label={summary.label}
                            tone={summary.tone}
                          />
                          <span
                            className="text-sm"
                            style={{ color: NORD.subtle }}
                          >
                            {summary.countText}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <Button
                  className="w-full py-3 text-base"
                  onClick={() => onInspect?.(makeInspectorForShipment(sel))}
                  disabled={!sel}
                >
                  Inspect shipment
                </Button>
              </div>
            </div>
          </div>

          {/* Right: consolidated shipment card w/ manifest-line verification */}
          <div className="col-span-12 xl:col-span-9 flex flex-col h-full min-h-0">
            <Card className="flex-1 flex flex-col min-h-0" hideHeader>
              {!sel ? (
                <div className="h-full grid place-items-center">
                  <div className="text-lg" style={{ color: NORD.muted }}>
                    Select a shipment from the inbound list.
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col gap-4 min-h-0">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex items-baseline gap-4">
                      <div
                        className="text-4xl font-semibold"
                        style={{ color: NORD.text }}
                      >
                        {sel.id}
                      </div>
                      <div
                        className="text-2xl font-semibold truncate"
                        style={{ color: NORD.muted }}
                      >
                        {sel.supplier}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <StatusPill
                        label={totals.stateLabel}
                        tone={totals.stateTone}
                      />
                    </div>
                  </div>

                  {/* Totals */}
                  <div
                    className="rounded-2xl p-6"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(136,192,208,0.12), rgba(163,190,140,0.10))",
                      border: `1px solid rgba(216,222,233,0.12)`,
                      boxShadow:
                        "0 0 0 1px rgba(216,222,233,0.04), 0 18px 40px rgba(0,0,0,0.18)",
                    }}
                  >
                    <div className="flex flex-wrap items-end justify-between gap-6">
                      <div>
                        <div
                          className="text-base font-semibold"
                          style={{ color: NORD.subtle }}
                        >
                          Counted
                        </div>
                        <div
                          className="mt-1 text-5xl font-semibold"
                          style={{ color: NORD.text }}
                        >
                          {totals.counted}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className="text-base font-semibold"
                          style={{ color: NORD.subtle }}
                        >
                          Expected
                        </div>
                        <div
                          className="mt-1 text-5xl font-semibold"
                          style={{ color: NORD.text }}
                        >
                          {totals.expected}
                        </div>
                      </div>
                    </div>

                    <div
                      className="mt-6 h-5 w-full rounded-full overflow-hidden"
                      style={{ background: "rgba(216,222,233,0.10)" }}
                      aria-label="Receiving progress"
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round(totals.progress * 100)}%`,
                          background:
                            totals.stateTone === "verified"
                              ? NORD.green
                              : totals.stateTone === "issue"
                                ? NORD.red
                                : NORD.blue,
                          transition: "width 200ms ease",
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
                    {/* Manifest list */}
                    <div className="col-span-12 xl:col-span-7 min-h-0">
                      <div
                        className="rounded-2xl p-4 h-full flex flex-col"
                        style={{
                          background: NORD.panel2,
                          border: `1px solid rgba(216,222,233,0.10)`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className="text-lg font-semibold"
                            style={{ color: NORD.text }}
                          >
                            Manifest
                          </div>
                          <div
                            className="text-base"
                            style={{ color: NORD.subtle }}
                          >
                            {shipState.lines?.length ?? 0} lines
                          </div>
                        </div>

                        <div className="mt-3 flex-1 min-h-0 overflow-auto space-y-2 pr-1">
                          {(shipState.lines || []).map((l) => {
                            const isActive = l.sku === activeLine?.sku;
                            const st = lineStatus(l);
                            return (
                              <button
                                key={l.sku}
                                disabled={isProcessed}
                                onClick={() => {
                                  if (isProcessed) return;
                                  setActiveSku(l.sku);
                                }}
                                className={cn(
                                  "relative w-full rounded-xl px-4 py-4 text-left transition",
                                  isProcessed
                                    ? "opacity-60 cursor-not-allowed"
                                    : isActive
                                      ? ""
                                      : "hover:opacity-95",
                                )}
                                style={{
                                  background: isActive
                                    ? "rgba(136,192,208,0.16)"
                                    : "rgba(46,52,64,0.35)",
                                  border: `1px solid ${isActive ? "rgba(136,192,208,0.28)" : "rgba(236,239,244,0.06)"}`,
                                }}
                              >
                                {isActive ? (
                                  <span
                                    className="absolute left-0 top-3 bottom-3 w-1 rounded-r"
                                    style={{ background: NORD.blue }}
                                  />
                                ) : null}

                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0">
                                    <div
                                      className="text-lg font-semibold"
                                      style={{ color: NORD.text }}
                                    >
                                      {l.name}
                                    </div>
                                    <div
                                      className="mt-1 text-base"
                                      style={{ color: NORD.subtle }}
                                    >
                                      {l.sku}
                                    </div>
                                  </div>
                                  <div className="shrink-0 flex flex-col items-end gap-2">
                                    <StatusPill
                                      label={st.label}
                                      tone={st.tone}
                                    />
                                    <div className="flex items-center gap-4">
                                      <div className="text-right">
                                        <div
                                          className="text-sm"
                                          style={{ color: NORD.subtle }}
                                        >
                                          Expected
                                        </div>
                                        <div
                                          className="text-2xl font-semibold"
                                          style={{ color: NORD.text }}
                                        >
                                          {l.expected}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div
                                          className="text-sm"
                                          style={{ color: NORD.subtle }}
                                        >
                                          Counted
                                        </div>
                                        <div
                                          className="text-2xl font-semibold"
                                          style={{ color: NORD.text }}
                                        >
                                          {l.counted}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Verify / count panel */}
                    <div className="col-span-12 xl:col-span-5 min-h-0">
                      <div
                        className="rounded-2xl p-4 h-full flex flex-col"
                        style={{
                          background: NORD.panel2,
                          border: `1px solid rgba(216,222,233,0.10)`,
                        }}
                      >
                        <div
                          className="text-lg font-semibold"
                          style={{ color: NORD.text }}
                        >
                          Verify
                        </div>

                        <div
                          className="mt-4 rounded-2xl p-4 flex-1 flex flex-col"
                          style={{
                            background: "rgba(46,52,64,0.35)",
                            border: `1px solid rgba(236,239,244,0.06)`,
                          }}
                        >
                          {activeLine ? (
                            <>
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div
                                    className="text-2xl font-semibold"
                                    style={{ color: NORD.text }}
                                  >
                                    {activeLine.name}
                                  </div>
                                  <div
                                    className="mt-1 text-base"
                                    style={{ color: NORD.subtle }}
                                  >
                                    {activeLine.sku}
                                  </div>
                                </div>
                                <div className="shrink-0">
                                  {(() => {
                                    const st = lineStatus(activeLine);
                                    return (
                                      <StatusPill
                                        label={st.label}
                                        tone={st.tone}
                                      />
                                    );
                                  })()}
                                </div>
                              </div>

                              <div className="mt-4 grid grid-cols-2 gap-3">
                                <div
                                  className="rounded-2xl p-4"
                                  style={{
                                    background: "rgba(46,52,64,0.35)",
                                    border: `1px solid rgba(236,239,244,0.06)`,
                                  }}
                                >
                                  <div
                                    className="text-base"
                                    style={{ color: NORD.subtle }}
                                  >
                                    Expected
                                  </div>
                                  <div
                                    className="mt-2 text-4xl font-semibold"
                                    style={{ color: NORD.text }}
                                  >
                                    {activeLine.expected}
                                  </div>
                                </div>

                                <div
                                  className="rounded-2xl p-4"
                                  style={{
                                    background: "rgba(46,52,64,0.35)",
                                    border: `1px solid rgba(236,239,244,0.06)`,
                                  }}
                                >
                                  <div
                                    className="text-base"
                                    style={{ color: NORD.subtle }}
                                  >
                                    Counted
                                  </div>
                                  <div
                                    className="mt-2 text-4xl font-semibold"
                                    style={{ color: NORD.text }}
                                  >
                                    {activeLine.counted}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 flex items-stretch gap-2">
                                <Button
                                  variant="ghost"
                                  className="flex-1 py-5 text-2xl"
                                  disabled={isProcessed}
                                  onClick={() => bumpLine(activeLine.sku, -1)}
                                >
                                  −
                                </Button>
                                <Button
                                  className="flex-1 py-5 text-2xl"
                                  disabled={isProcessed}
                                  onClick={() => bumpLine(activeLine.sku, 1)}
                                >
                                  +
                                </Button>
                              </div>

                              <div className="mt-4">
                                <Button
                                  variant={
                                    activeLine.issue ? "primary" : "danger"
                                  }
                                  className="w-full py-4 text-lg"
                                  disabled={isProcessed}
                                  onClick={() =>
                                    toggleLineIssue(activeLine.sku)
                                  }
                                >
                                  {activeLine.issue
                                    ? "Clear discrepancy"
                                    : "Flag discrepancy"}
                                </Button>
                              </div>

                              <div
                                className={cn(
                                  "mt-auto pt-4",
                                  isProcessed ? "opacity-90" : "",
                                )}
                              >
                                <Button
                                  variant="secondary"
                                  className="w-full py-4 text-lg"
                                  disabled={isProcessed}
                                  onClick={() =>
                                    window.dispatchEvent(
                                      new CustomEvent("ksc:open-manifest", {
                                        detail: { shipmentId: sel?.id },
                                      }),
                                    )
                                  }
                                >
                                  View manifest
                                </Button>

                                <Button
                                  className="w-full py-6 text-2xl font-semibold shadow-lg mt-3"
                                  disabled={!isProcessed && !totals.canProcess}
                                  onClick={() => {
                                    if (!sel?.id) return;
                                    if (!isProcessed && !totals.canProcess)
                                      return;
                                    setReceiveByShipId((prev) => {
                                      const st = prev[sel.id] ?? { lines: [] };
                                      const nextProcessed = !Boolean(
                                        st.processed,
                                      );
                                      return {
                                        ...prev,
                                        [sel.id]: {
                                          ...st,
                                          processed: nextProcessed,
                                        },
                                      };
                                    });
                                  }}
                                >
                                  {isProcessed
                                    ? "Unmark shipment as processed"
                                    : "Mark shipment as processed"}
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="h-full grid place-items-center">
                              <div
                                className="text-lg"
                                style={{ color: NORD.muted }}
                              >
                                No manifest lines.
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <ManifestModal
        open={manifestOpen}
        onClose={() => setManifestOpen(false)}
        manifest={buildManifestForSelectedShipment()}
      />
    </>
  );
}
