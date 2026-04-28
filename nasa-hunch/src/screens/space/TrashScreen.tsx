import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { apiUrl } from "../../lib/apiBase";
import { useKeyboardWedgeScan } from "../../lib/useKeyboardWedgeScan";

const NORD = {
  bg: "var(--t-bg)",
  panel: "var(--t-surface)",
  panel2: "var(--t-surface2)",
  panel3: "var(--t-surface3)",
  text: "var(--t-text)",
  muted: "var(--t-muted)",
  subtle: "var(--t-subtle)",
  blue: "var(--t-blue)",
  blue2: "var(--t-blue2)",
  blue3: "var(--t-blue3)",
  green: "var(--t-green)",
  yellow: "var(--t-accent)",
  red: "var(--t-red)",
  orange: "var(--t-accent)",
  purple: "var(--t-purple)",
  teal: "var(--t-teal)",
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Card({
  title,
  children,
  className,
  accent,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <div
      className={cn("rounded-2xl p-5 animate-fade-up", className)}
      style={{
        background: NORD.panel,
        border: `1px solid rgba(var(--t-border-rgb),0.10)`,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xl font-semibold" style={{ color: NORD.text }}>
          {title}
        </div>
        {accent ? (
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} />
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
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-3 text-base font-semibold transition hover-lift";
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
      bd: "rgba(var(--t-border-rgb),0.12)",
      hover: "rgba(var(--t-surface3-rgb),0.92)",
    },
    danger: {
      bg: NORD.red,
      fg: NORD.text,
      bd: "transparent",
      hover: "rgba(var(--t-red-rgb),0.88)",
    },
  } as const;
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

function Pill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "ok" | "warn" | "danger" | "info" }) {
  const map = {
    neutral: {
      bg: "rgba(var(--t-subtle-rgb),0.22)",
      fg: NORD.muted,
      bd: "rgba(var(--t-border-rgb),0.12)",
    },
    ok: {
      bg: "rgba(var(--t-green-rgb),0.14)",
      fg: NORD.green,
      bd: "rgba(var(--t-green-rgb),0.22)",
    },
    warn: {
      bg: "rgba(var(--t-accent-rgb),0.14)",
      fg: NORD.yellow,
      bd: "rgba(var(--t-accent-rgb),0.22)",
    },
    danger: {
      bg: "rgba(var(--t-red-rgb),0.14)",
      fg: NORD.red,
      bd: "rgba(var(--t-red-rgb),0.22)",
    },
    info: {
      bg: "rgba(var(--t-blue-rgb),0.14)",
      fg: NORD.blue,
      bd: "rgba(var(--t-blue-rgb),0.22)",
    },
  } as const;
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

function toneForTrashType(type: string): { pill: string; tone: "neutral" | "ok" | "warn" | "danger" | "info"; dot: string } {
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

function pickBin({ trashType, stationId }: { trashType: string; stationId?: string }) {
  const station = stationId ?? "TRASH-WS-A";
  const binMap: Record<string, { binId: string; label: string }> = {
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

type TrashItem = {
  id: string;
  name: string;
  trashType: string;
  tagId?: string;
};

type CrewScanResponse = {
  id: string;
  name: string;
  tagId: string;
  trashType?: string;
};

type SearchItem = {
  id: string;
  code: string;
  name: string;
};

type TrashRoute = {
  stationId: string;
  binId: string;
  stationLabel: string;
  binLabel: string;
};

export default function TrashScreen() {
  const [selected, setSelected] = useState<TrashItem | null>(null);
  const [route, setRoute] = useState<TrashRoute | null>(null);
  const [scanned, setScanned] = useState(false);
  const [done, setDone] = useState(false);
  const [autoDisposeEnabled, setAutoDisposeEnabled] = useState(true);
  const [scanValue, setScanValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [searchDetails, setSearchDetails] = useState<Record<string, { trashType?: string }>>({});
  const fetchedDetailsRef = useRef<Set<string>>(new Set());
  const autoDisposeTimerRef = useRef<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function reset() {
    if (autoDisposeTimerRef.current != null) {
      window.clearTimeout(autoDisposeTimerRef.current);
      autoDisposeTimerRef.current = null;
    }
    setSelected(null);
    setRoute(null);
    setScanned(false);
    setDone(false);
    setError(null);
  }

  const scanItem = useCallback(async (override?: string) => {
    const raw = (override ?? scanValue).trim();
    if (!raw) return;
    setError(null);
    try {
      const res = await fetch(apiUrl("/crew/scan"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      });
      if (!res.ok) throw new Error("SCAN_FAILED");
      const data = (await res.json()) as CrewScanResponse;
      const next: TrashItem = {
        id: data.id,
        name: data.name,
        trashType: data.trashType || "DRY",
        tagId: data.tagId,
      };
      setSelected(next);
      setRoute(pickBin({ trashType: next.trashType, stationId: "TRASH-WS-A" }));
      setScanned(true);
      setDone(false);
      setScanValue("");
    } catch {
      setSelected(null);
      setRoute(null);
      setScanned(false);
      setDone(false);
      setError("Item not found.");
    }
  }, [scanValue]);

  useEffect(() => {
    fetch(apiUrl("/tag/items"))
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setSearchItems(list.map((item) => ({
          id: item.id,
          code: item.code ?? item.id,
          name: item.name ?? item.id,
        })));
      })
      .catch(() => setSearchItems([]));
  }, []);

  const filteredSearch = useMemo(() => {
    const q = scanValue.trim().toLowerCase();
    if (!q) return [];
    return searchItems
      .filter((item) => `${item.code} ${item.name}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [searchItems, scanValue]);

  useEffect(() => {
    if (!filteredSearch.length) return;
    filteredSearch.slice(0, 4).forEach((item) => {
      if (fetchedDetailsRef.current.has(item.id)) return;
      fetchedDetailsRef.current.add(item.id);
      fetch(apiUrl("/crew/scan"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: item.code }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return;
          setSearchDetails((prev) => ({
            ...prev,
            [item.id]: { trashType: data.trashType ?? "" },
          }));
        })
        .catch(() => {});
    });
  }, [filteredSearch]);

  useKeyboardWedgeScan({
    enabled: true,
    onScan: (value) => {
      setScanValue(value);
      scanItem(value);
    },
  });

  useEffect(() => {
    if (!autoDisposeEnabled || !selected || !route || !scanned || done) return;
    if (autoDisposeTimerRef.current != null) {
      window.clearTimeout(autoDisposeTimerRef.current);
    }
    autoDisposeTimerRef.current = window.setTimeout(() => {
      confirmDisposed().catch(() => {});
    }, 1400);

    return () => {
      if (autoDisposeTimerRef.current != null) {
        window.clearTimeout(autoDisposeTimerRef.current);
        autoDisposeTimerRef.current = null;
      }
    };
  }, [autoDisposeEnabled, selected, route, scanned, done]);

  async function confirmDisposed() {
    if (!selected || !route || !scanned) return;
    try {
      const res = await fetch(apiUrl("/crew/dispose"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId: selected.id,
          trashType: selected.trashType,
          stationId: route.stationId,
          binId: route.binId,
        }),
      });
      if (!res.ok) throw new Error("DISPOSE_FAILED");
      setDone(true);
      if (autoDisposeTimerRef.current != null) {
        window.clearTimeout(autoDisposeTimerRef.current);
        autoDisposeTimerRef.current = null;
      }
      window.setTimeout(() => {
        setSelected(null);
        setRoute(null);
        setScanned(false);
        setDone(false);
      }, 250);
    } catch {
      setError("Dispose failed. Try again.");
    }
  }

  const tt = selected ? toneForTrashType(selected.trashType) : null;

  return (
    <div className="h-full w-full flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-3xl font-semibold" style={{ color: NORD.text }}>
            Throw away
          </div>
        </div>
        {done ? <Pill label="Disposed" tone="ok" /> : null}
      </div>

      <Card title="Scan" accent={NORD.teal}>
        <div className="flex flex-col gap-4">
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(var(--t-teal-rgb),0.12)",
              border: "1px solid rgba(var(--t-teal-rgb),0.22)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div style={{ color: NORD.text, fontWeight: 700 }}>Auto-scan trash can inlet</div>
                <div style={{ color: NORD.muted, fontSize: "0.92rem", marginTop: "0.3rem" }}>
                  Reader location: mounted on the trash can rim at Trash Station A so an item is detected as it enters the opening.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutoDisposeEnabled((current) => !current)}
                style={{
                  borderRadius: "999px",
                  border: `1px solid ${autoDisposeEnabled ? "rgba(var(--t-green-rgb),0.28)" : "rgba(var(--t-border-rgb),0.14)"}`,
                  background: autoDisposeEnabled ? "rgba(var(--t-green-rgb),0.16)" : "rgba(var(--t-subtle-rgb),0.22)",
                  color: autoDisposeEnabled ? NORD.green : NORD.muted,
                  fontWeight: 700,
                  padding: "0.55rem 0.9rem",
                  cursor: "pointer",
                }}
              >
                {autoDisposeEnabled ? "Armed" : "Manual"}
              </button>
            </div>
          </div>
          <div className="relative">
            <input
              value={scanValue}
              onChange={(e) => {
                const next = e.target.value;
                setScanValue(next);
                setDropdownOpen(Boolean(next.trim()));
              }}
              onFocus={() => setDropdownOpen(Boolean(scanValue.trim()))}
              onBlur={() => window.setTimeout(() => setDropdownOpen(false), 120)}
              placeholder="Scan RFID or enter unit ID"
              className="w-full rounded-2xl px-4 py-4 text-lg outline-none"
              style={{
                background: NORD.panel2,
                color: NORD.text,
                border: "1px solid rgba(var(--t-border-rgb),0.10)",
              }}
            />
            {dropdownOpen && filteredSearch.length ? (
              <div
                className="absolute left-0 right-0 mt-2 overflow-hidden rounded-2xl search-overlay"
                style={{ zIndex: 1000 }}
              >
                <div
                  className="grid grid-cols-[1.2fr_1fr_0.9fr_0.6fr] gap-2 px-4 py-2 text-xs search-overlay-header"
                  style={{ color: NORD.subtle }}
                >
                  <div>Item</div>
                  <div>RFID</div>
                  <div>Trash</div>
                  <div className="text-right">Pick</div>
                </div>
                {filteredSearch.map((item) => {
                  const detail = searchDetails[item.id];
                  const ttone = toneForTrashType(detail?.trashType ?? "");
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setScanValue(item.code);
                        scanItem(item.code);
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 transition search-overlay-row"
                    >
                      <div className="grid grid-cols-[1.2fr_1fr_0.9fr_0.6fr] gap-2 items-center">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold" style={{ color: NORD.text }}>
                            {item.name}
                          </div>
                          <div className="text-xs" style={{ color: NORD.muted }}>
                            {item.id}
                          </div>
                        </div>
                        <div className="text-sm" style={{ color: NORD.subtle }}>
                          {item.code}
                        </div>
                        <div>
                          <Pill label={ttone.pill} tone={ttone.tone} />
                        </div>
                        <div className="text-right">
                          <span
                            className="inline-flex items-center rounded-xl px-3 py-2 text-xs font-semibold"
                            style={{
                              background: "rgba(var(--t-blue2-rgb),0.16)",
                              color: NORD.blue2,
                              border: "1px solid rgba(var(--t-blue2-rgb),0.26)",
                            }}
                          >
                            Pick
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          <Button onClick={() => scanItem()} className="w-full text-lg py-4">
            Scan item / trigger auto-detect
          </Button>

          <div
            className="rounded-2xl p-4"
            style={{
              background: NORD.panel2,
              border: `1px solid rgba(var(--t-border-rgb),0.10)`
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-2xl font-semibold" style={{ color: selected ? NORD.text : NORD.subtle }}>
                  {selected ? selected.name : "—"}
                </div>
                <div className="mt-1 text-lg" style={{ color: selected ? NORD.muted : NORD.subtle }}>
                  {selected ? selected.id : ""}
                </div>
              </div>
              <div className="shrink-0">
                {selected ? <Pill label={tt?.pill ?? "—"} tone={tt?.tone ?? "neutral"} /> : <Pill label="—" />}
              </div>
            </div>
          </div>
          {error ? (
            <div className="text-sm" style={{ color: NORD.red }}>
              {error}
            </div>
          ) : null}
        </div>
      </Card>

      {null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        <Card title="Go to bin" accent={NORD.blue}>
          <div
            className="rounded-2xl p-5"
            style={{
              background: "rgba(var(--t-surface2-rgb),0.45)",
              border: `1px solid rgba(var(--t-border-rgb),0.10)`
            }}
          >
            <div className="text-3xl font-semibold" style={{ color: route ? NORD.text : NORD.subtle }}>
              {route ? `${route.stationLabel} → ${route.binLabel}` : "—"}
            </div>
            <div className="mt-3 text-xl" style={{ color: route ? NORD.muted : NORD.subtle }}>
              {route ? `${route.stationId} / ${route.binId}` : ""}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {selected ? <Pill label={`Type: ${selected.trashType}`} tone={tt?.tone ?? "neutral"} /> : <Pill label="Type: —" />}
            {scanned ? <Pill label="Scanned" tone="info" /> : <Pill label="Scanned" />}
            {autoDisposeEnabled ? <Pill label="Auto-dispose armed" tone="ok" /> : <Pill label="Manual confirmation" tone="neutral" />}
          </div>
        </Card>

        <Card title="Dispose" accent={NORD.green}>
          <div className="flex flex-col gap-4">
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(var(--t-surface2-rgb),0.45)",
                border: `1px solid rgba(var(--t-border-rgb),0.10)`
              }}
            >
              <div className="text-2xl font-semibold" style={{ color: selected ? NORD.text : NORD.subtle }}>
                {selected ? selected.name : "—"}
              </div>
              <div className="mt-2 text-lg" style={{ color: selected ? NORD.muted : NORD.subtle }}>
                {selected ? selected.id : ""}
              </div>
            </div>

            <Button
              variant={selected?.trashType === "CHEM" || selected?.trashType === "SHARP" ? "danger" : "primary"}
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
