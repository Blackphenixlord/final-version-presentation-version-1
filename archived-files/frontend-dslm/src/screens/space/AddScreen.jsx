import React, { useMemo, useState } from "react";

// Astronaut: Put something back
// Simple workflow (home-only): scan -> show home location -> mark returned.

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

  green: "#A3BE8C",
  yellow: "#EBCB8B",
  red: "#BF616A",
  purple: "#B48EAD",
  orange: "#D08770",
};

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Card({ title, right, children, className }) {
  return (
    <div
      className={cn("rounded-2xl p-5", className)}
      style={{
        background: NORD.panel,
        border: `1px solid rgba(216,222,233,0.10)`,
      }}
    >
      {title ? (
        <div className="flex items-start justify-between gap-3">
          <div className="text-xl font-semibold" style={{ color: NORD.text }}>
            {title}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      ) : null}
      <div className={title ? "mt-4" : ""}>{children}</div>
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
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-base font-semibold transition";

  const styles = {
    primary: {
      bg: NORD.blue3,
      fg: NORD.text,
      bd: "transparent",
      hover: NORD.blue2,
    },
    success: {
      bg: NORD.green,
      fg: NORD.bg,
      bd: "transparent",
      hover: "rgba(163,190,140,0.90)",
    },
    ghost: {
      bg: "transparent",
      fg: NORD.subtle,
      bd: "rgba(216,222,233,0.16)",
      hover: "rgba(216,222,233,0.08)",
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
      fg: NORD.subtle,
      bd: "rgba(76,86,106,0.40)",
    },
    progress: {
      bg: "rgba(136,192,208,0.14)",
      fg: NORD.blue,
      bd: "rgba(136,192,208,0.22)",
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
  };
  const s = map[tone] ?? map.neutral;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.bd}` }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: s.fg }} />
      {label}
    </span>
  );
}

function locationToPlainEnglish(loc) {
  if (!loc) return "—";

  // Irregular: IRAL8L12, IRBL3L6, etc.
  if (loc.startsWith("IRA") || loc.startsWith("IRB")) {
    const zone = loc.slice(0, 3) === "IRA" ? "Irregular A" : "Irregular B";
    const rest = loc.slice(3); // e.g. L8L12
    const m = rest.match(/^L(\d+)L(\d+)$/);
    if (m) {
      return `${zone}, slots L${m[1]}–L${m[2]}`;
    }
    return `${zone}`;
  }

  // Regular: S1D4L13/CTB-.../BOB-.../ITEM-...
  const parts = loc.split("/");
  const top = parts[0] ?? "";
  const m = top.match(/^S(\d)D(\d)L(\d{1,2})$/);
  const topPlain = m ? `Shelf ${m[1]}, depth ${m[2]}, slot L${m[3]}` : top;

  const containers = parts
    .slice(1, -1)
    .map((p) =>
      p.startsWith("CTB-")
        ? `CTB ${p.slice(4)}`
        : p.startsWith("BOB-")
          ? `BOB ${p.slice(4)}`
          : p,
    );

  const item = parts[parts.length - 1];
  const itemPlain = item?.startsWith("ITEM-") ? `Item ${item.slice(5)}` : item;

  return [topPlain, ...containers, itemPlain].filter(Boolean).join(" → ");
}

export default function AddScreen() {
  // Mock directory used only for demo wiring.
  const DIRECTORY = useMemo(
    () => [
      {
        id: "ITEM-0142",
        label: "Protein Bar (Vanilla)",
        tagId: "RFID-7F3A-0142",
        home: "S1D3L08/CTB-FOOD-07/BOB-DAY12/ITEM-0142",
      },
      {
        id: "ITEM-0311",
        label: "Multitool",
        tagId: "RFID-2C1D-0311",
        home: "S2D1L15/CTB-TOOLS-02/CTB-HAND-01/ITEM-0311",
      },
      {
        id: "ITEM-0904",
        label: "Cable (USB-C, 1m)",
        tagId: "RFID-99AA-0904",
        home: "S3D2L04/CTB-ELEC-01/CTB-CABLE-03/ITEM-0904",
      },
      {
        id: "ITEM-1007",
        label: "Notebook",
        tagId: "RFID-0B77-1007",
        home: "IRAL8L12",
      },
      {
        id: "ITEM-2048",
        label: "Medical Tape",
        tagId: "RFID-6D20-2048",
        home: "S1D4L13/CTB-MED-03/CTB-WOUND-02/ITEM-2048",
      },
    ],
    [],
  );

  const [scanned, setScanned] = useState(null); // directory entry
  const [scanId, setScanId] = useState(null); // tagId
  const [confirmed, setConfirmed] = useState(false);
  const [returned, setReturned] = useState(false);

  function mockScan() {
    const pick = DIRECTORY[Math.floor(Math.random() * DIRECTORY.length)];
    setScanned(pick);
    setScanId(pick.tagId);
    setConfirmed(false);
    setReturned(false);
  }

  function confirmItem() {
    if (!scanned) return;
    setConfirmed(true);
  }

  function markReturned() {
    if (!scanned) return;
    if (!confirmed) return;
    setReturned(true);
  }

  const homeCode = scanned?.home ?? "—";
  const homePlain = scanned ? locationToPlainEnglish(scanned.home) : "—";

  return (
    <div className="h-full w-full flex flex-col gap-4">
      {/* Full-width scan + location */}
      <Card
        title="Put something back"
        right={
          returned ? (
            <Pill label="Returned" tone="ok" />
          ) : confirmed ? (
            <Pill label="Confirmed" tone="ok" />
          ) : scanned ? (
            <Pill label="Needs confirm" tone="warn" />
          ) : (
            <Pill label="Awaiting scan" tone="neutral" />
          )
        }
        className="w-full"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="w-full sm:w-auto py-4 text-lg"
              onClick={mockScan}
            >
              Mock scan
            </Button>

            <div
              className="flex-1 rounded-2xl px-4 py-4"
              style={{
                background: NORD.panel2,
                border: `1px solid rgba(216,222,233,0.12)`,
              }}
            >
              <div className="text-sm" style={{ color: NORD.muted }}>
                Scanned tag
              </div>
              <div
                className="mt-1 text-2xl font-semibold"
                style={{ color: NORD.text }}
              >
                {scanId ?? "—"}
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{
              background: "rgba(46,52,64,0.35)",
              border: `1px solid rgba(136,192,208,0.22)`,
            }}
          >
            <div className="text-sm" style={{ color: NORD.muted }}>
              Home location
            </div>
            <div
              className="mt-2 text-3xl font-semibold"
              style={{ color: NORD.text }}
            >
              {scanned ? homePlain : "Scan an item to see its home."}
            </div>
            <div className="mt-3 text-base" style={{ color: NORD.blue }}>
              {scanned ? homeCode : ""}
            </div>
          </div>

          {scanned ? (
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(46,52,64,0.25)",
                border: `1px solid rgba(216,222,233,0.10)`,
              }}
            >
              <div className="text-sm" style={{ color: NORD.muted }}>
                Item
              </div>
              <div
                className="mt-1 text-2xl font-semibold"
                style={{ color: NORD.text }}
              >
                {scanned.label}
              </div>
              <div className="mt-1 text-sm" style={{ color: NORD.subtle }}>
                {scanned.id}
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      {/* Action row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card
          title="Confirm"
          right={
            returned ? (
              <Pill label="Done" tone="ok" />
            ) : confirmed ? (
              <Pill label="Confirmed" tone="ok" />
            ) : scanned ? (
              <Pill label="Pending" tone="warn" />
            ) : null
          }
          className="w-full"
        >
          {!scanned ? (
            <div className="text-base" style={{ color: NORD.subtle }}>
              Scan an item to begin.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-sm" style={{ color: NORD.muted }}>
                  Verify the item in-hand matches:
                </div>
                <div
                  className="mt-2 text-2xl font-semibold"
                  style={{ color: NORD.text }}
                >
                  {scanned.label}
                </div>
                <div className="mt-1 text-sm" style={{ color: NORD.subtle }}>
                  {scanned.id}
                </div>
              </div>

              <Button
                variant={confirmed ? "success" : "primary"}
                className="w-full py-5 text-xl"
                onClick={confirmItem}
                disabled={confirmed || returned}
              >
                {confirmed ? "Confirmed ✓" : "Confirm this is the item"}
              </Button>

              <div className="text-sm" style={{ color: NORD.muted }}>
                {confirmed
                  ? "Confirmed. You can now mark it returned."
                  : "Required before returning."}
              </div>
            </div>
          )}
        </Card>

        <Card title="Mark returned" className="w-full">
          <Button
            variant="success"
            className="w-full py-5 text-xl"
            onClick={markReturned}
            disabled={!scanned || !confirmed || returned}
          >
            {returned ? "Returned ✓" : "Mark as returned"}
          </Button>
          <div className="mt-3 text-sm" style={{ color: NORD.muted }}>
            {returned
              ? "Inventory updated (mock)."
              : !scanned
                ? "Disabled until something is scanned."
                : !confirmed
                  ? "Disabled until the item is confirmed."
                  : "Ready."}
          </div>
        </Card>
      </div>
    </div>
  );
}
