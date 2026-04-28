import React, { useMemo, useState } from "react";

// Nord-ish tokens (no gradients)
const NORD = {
  bg: "#2E3440",
  panel: "#3B4252",
  panel2: "#434C5E",
  panel3: "#4C566A",
  text: "#ECEFF4",
  muted: "#D8DEE9",
  subtle: "#A3ABB9",
  blue: "#88C0D0",
  blue2: "#81A1C1",
  blue3: "#5E81AC",
  green: "#A3BE8C",
  yellow: "#EBCB8B",
  red: "#BF616A",
  orange: "#D08770",
  purple: "#B48EAD",
  teal: "#8FBCBB",
};

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Card({ title, children, className, accent }) {
  return (
    <div
      className={cn("rounded-2xl p-5", className)}
      style={{
        background: NORD.panel,
        border: `1px solid rgba(216,222,233,0.10)`,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xl font-semibold" style={{ color: NORD.text }}>
          {title}
        </div>
        {accent ? (
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: accent }}
          />
        ) : null}
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
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-3 text-base font-semibold transition";
  const styles = {
    primary: {
      bg: NORD.blue3,
      fg: NORD.text,
      bd: "transparent",
      hover: NORD.blue2,
    },
    secondary: {
      bg: NORD.panel2,
      fg: NORD.text,
      bd: "rgba(216,222,233,0.12)",
      hover: "rgba(67,76,94,0.92)",
    },
    danger: {
      bg: NORD.red,
      fg: NORD.text,
      bd: "transparent",
      hover: "rgba(191,97,106,0.88)",
    },
  };
  const s = styles[variant] ?? styles.primary;

  return (
    <button
      type="button"
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

function Pill({ label, tone = "neutral" }) {
  const map = {
    neutral: {
      bg: "rgba(76,86,106,0.22)",
      fg: NORD.muted,
      bd: "rgba(216,222,233,0.12)",
    },
    ok: {
      bg: "rgba(163,190,140,0.14)",
      fg: NORD.green,
      bd: "rgba(163,190,140,0.22)",
    },
    warn: {
      bg: "rgba(235,203,139,0.14)",
      fg: NORD.yellow,
      bd: "rgba(235,203,139,0.22)",
    },
    danger: {
      bg: "rgba(191,97,106,0.14)",
      fg: NORD.red,
      bd: "rgba(191,97,106,0.22)",
    },
    info: {
      bg: "rgba(136,192,208,0.14)",
      fg: NORD.blue,
      bd: "rgba(136,192,208,0.22)",
    },
  };
  const s = map[tone] ?? map.neutral;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold"
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.bd}` }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: s.fg }} />
      {label}
    </span>
  );
}

function toneForTrashType(type) {
  switch (type) {
    case "DRY":
      return { pill: "DRY", tone: "info", dot: NORD.blue };
    case "WET":
      return { pill: "WET", tone: "warn", dot: NORD.yellow };
    case "SHARP":
      return { pill: "SHARP", tone: "danger", dot: NORD.red };
    case "CHEM":
      return { pill: "CHEM", tone: "danger", dot: NORD.purple };
    case "REC":
      return { pill: "REC", tone: "ok", dot: NORD.green };
    default:
      return { pill: "—", tone: "neutral", dot: NORD.muted };
  }
}

function pickBin({ trashType, stationId }) {
  // Keep dead-simple routing rules.
  const station = stationId ?? "TRASH-WS-A";
  const binMap = {
    DRY: { binId: "TR-A1", label: "Bin 1" },
    WET: { binId: "TR-A2", label: "Bin 2" },
    SHARP: { binId: "TR-A3", label: "Bin 3" },
    CHEM: { binId: "TR-A4", label: "Bin 4" },
    REC: { binId: "TR-A5", label: "Bin 5" },
  };
  const b = binMap[trashType] ?? { binId: "TR-A1", label: "Bin 1" };
  return {
    stationId: station,
    binId: b.binId,
    stationLabel: station === "TRASH-WS-A" ? "Trash Station A" : station,
    binLabel: b.label,
  };
}

export default function TrashScreen() {
  const items = useMemo(
    () => [
      {
        id: "ITEM-0081",
        name: "Protein Bar",
        trashType: "WET",
      },
      {
        id: "ITEM-0144",
        name: "Gloves (nitrile)",
        trashType: "DRY",
      },
      {
        id: "ITEM-0207",
        name: "Lab Vial",
        trashType: "SHARP",
      },
      {
        id: "ITEM-0330",
        name: "Solvent Wipe",
        trashType: "CHEM",
      },
      {
        id: "ITEM-0412",
        name: "Packaging Film",
        trashType: "REC",
      },
    ],
    [],
  );

  const [selected, setSelected] = useState(null); // {id,name,trashType}
  const [route, setRoute] = useState(null); // {stationId, binId, stationLabel, binLabel}
  const [scanned, setScanned] = useState(false);
  const [done, setDone] = useState(false);

  function reset() {
    setSelected(null);
    setRoute(null);
    setScanned(false);
    setDone(false);
  }

  function mockScanItem() {
    const next = items[Math.floor(Math.random() * items.length)];
    setSelected(next);
    setRoute(pickBin({ trashType: next.trashType, stationId: "TRASH-WS-A" }));
    setScanned(true);
    setDone(false);
  }

  function confirmDisposed() {
    if (!selected || !route || !scanned) return;

    // Brief success flash, then clear the flow.
    setDone(true);
    window.setTimeout(() => {
      setSelected(null);
      setRoute(null);
      setScanned(false);
      setDone(false);
    }, 250);
  }

  const tt = selected ? toneForTrashType(selected.trashType) : null;

  return (
    <div className="h-full w-full flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-3xl font-semibold" style={{ color: NORD.text }}>
            Throw away
          </div>
        </div>
        {done ? <Pill label="Disposed" tone="ok" /> : null}
      </div>

      {/* Scan */}
      <Card title="Mock scan" accent={NORD.teal}>
        <div className="flex flex-col gap-4">
          <Button onClick={mockScanItem} className="w-full text-lg py-4">
            Scan item
          </Button>

          <div
            className="rounded-2xl p-4"
            style={{
              background: NORD.panel2,
              border: `1px solid rgba(216,222,233,0.10)`,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div
                  className="text-2xl font-semibold"
                  style={{ color: selected ? NORD.text : NORD.subtle }}
                >
                  {selected ? selected.name : "—"}
                </div>
                <div
                  className="mt-1 text-lg"
                  style={{ color: selected ? NORD.muted : NORD.subtle }}
                >
                  {selected ? selected.id : ""}
                </div>
              </div>
              <div className="shrink-0">
                {selected ? (
                  <Pill label={tt.pill} tone={tt.tone} />
                ) : (
                  <Pill label="—" />
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Routing */}
        <Card title="Go to bin" accent={NORD.blue}>
          <div
            className="rounded-2xl p-5"
            style={{
              background: "rgba(46,52,64,0.45)",
              border: `1px solid rgba(216,222,233,0.10)`,
            }}
          >
            <div
              className="text-3xl font-semibold"
              style={{ color: route ? NORD.text : NORD.subtle }}
            >
              {route ? `${route.stationLabel} → ${route.binLabel}` : "—"}
            </div>
            <div
              className="mt-3 text-xl"
              style={{ color: route ? NORD.muted : NORD.subtle }}
            >
              {route ? `${route.stationId} / ${route.binId}` : ""}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {selected ? (
              <Pill label={`Type: ${selected.trashType}`} tone={tt.tone} />
            ) : (
              <Pill label="Type: —" />
            )}
            {scanned ? (
              <Pill label="Scanned" tone="info" />
            ) : (
              <Pill label="Scanned" />
            )}
          </div>
        </Card>

        {/* Confirm */}
        <Card title="Dispose" accent={NORD.green}>
          <div className="flex flex-col gap-4">
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(46,52,64,0.45)",
                border: `1px solid rgba(216,222,233,0.10)`,
              }}
            >
              <div
                className="text-2xl font-semibold"
                style={{ color: selected ? NORD.text : NORD.subtle }}
              >
                {selected ? selected.name : "—"}
              </div>
              <div
                className="mt-2 text-lg"
                style={{ color: selected ? NORD.muted : NORD.subtle }}
              >
                {selected ? selected.id : ""}
              </div>
            </div>

            <Button
              variant={
                selected?.trashType === "CHEM" ||
                selected?.trashType === "SHARP"
                  ? "danger"
                  : "primary"
              }
              disabled={!selected || !route || !scanned || done}
              onClick={confirmDisposed}
              className="w-full text-lg py-4"
            >
              Mark as disposed
            </Button>

            <Button variant="secondary" onClick={reset} className="w-full">
              Reset
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
