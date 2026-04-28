import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense, type ReactNode } from "react";
import { apiUrl } from "../../lib/apiBase";
import { useKeyboardWedgeScan } from "../../lib/useKeyboardWedgeScan";

const ModuleView3D = lazy(() => import("../ModuleView3D"));

// Astronaut: Put something back
// Simple workflow (home-only): scan -> show home location -> mark returned.

const NORD = {
  bg: "var(--t-bg)",
  panel: "var(--t-surface)",
  panel2: "var(--t-surface2)",
  panel3: "var(--t-surface3)",

  text: "var(--t-text)",
  subtle: "var(--t-muted)",
  muted: "var(--t-subtle)",

  blue: "var(--t-blue)",
  blue2: "var(--t-blue2)",
  blue3: "var(--t-blue3)",

  green: "var(--t-green)",
  yellow: "var(--t-accent)",
  red: "var(--t-red)",
  purple: "var(--t-purple)",
  orange: "var(--t-accent)",
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Card({
  title,
  right,
  children,
  className,
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-2xl p-5 animate-fade-up", className)}
      style={{
        background: NORD.panel,
        border: `1px solid rgba(var(--t-border-rgb),0.10)`,
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
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "success" | "ghost";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-base font-semibold transition hover-lift";

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
      hover: "rgba(var(--t-green-rgb),0.90)",
    },
    ghost: {
      bg: "transparent",
      fg: NORD.subtle,
      bd: "rgba(var(--t-border-rgb),0.16)",
      hover: "rgba(var(--t-border-rgb),0.08)",
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

function Pill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "progress" | "ok" | "warn" }) {
  const map = {
    neutral: {
      bg: "rgba(var(--t-subtle-rgb),0.22)",
      fg: NORD.subtle,
      bd: "rgba(var(--t-subtle-rgb),0.40)",
    },
    progress: {
      bg: "rgba(var(--t-blue-rgb),0.14)",
      fg: NORD.blue,
      bd: "rgba(var(--t-blue-rgb),0.22)",
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
  } as const;
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

function locationToPlainEnglish(loc: string | null | undefined) {
  if (!loc) return "—";

  if (loc.startsWith("IRA") || loc.startsWith("IRB")) {
    const zone = loc.slice(0, 3) === "IRA" ? "Irregular A" : "Irregular B";
    const rest = loc.slice(3);
    const m = rest.match(/^L(\d+)L(\d+)$/);
    if (m) {
      return `${zone}, slots L${m[1]}–L${m[2]}`;
    }
    return `${zone}`;
  }

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

type DirectoryEntry = {
  id: string;
  label: string;
  tagId: string;
  home: string;
  qty?: number | null;
  maxQty?: number | null;
};

type CrewScanResponse = {
  id: string;
  name: string;
  tagId: string;
  home?: string;
  location?: string;
  qty?: number | null;
  maxQty?: number | null;
};

type SearchItem = {
  id: string;
  code: string;
  name: string;
  location?: string;
};

export default function AddScreen() {
  const [scanned, setScanned] = useState<DirectoryEntry | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [scanId, setScanId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [returned, setReturned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [searchDetails, setSearchDetails] = useState<Record<string, { home?: string }>>({});
  const fetchedDetailsRef = useRef<Set<string>>(new Set());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [locationPreview, setLocationPreview] = useState<string | null>(null);
  const [returnAmount, setReturnAmount] = useState(1);

  const availableQty = typeof scanned?.qty === "number" ? scanned.qty : null;
  const maxQty = typeof scanned?.maxQty === "number" ? scanned.maxQty : null;
  const maxReturn = availableQty != null && maxQty != null ? Math.max(0, maxQty - availableQty) : 100;
  const canReturn = maxReturn > 0;

  const scan = useCallback(async (override?: string) => {
    const raw = (override ?? scanInput).trim();
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
      const match = searchItems.find((item) => item.code === raw || item.id === raw);
      const resolvedHome = data.home || data.location || match?.location || "";
      const entry: DirectoryEntry = {
        id: data.id,
        label: data.name,
        tagId: data.tagId ?? scanInput.trim(),
        home: resolvedHome,
        qty: typeof data.qty === "number" ? data.qty : null,
        maxQty: typeof data.maxQty === "number" ? data.maxQty : null,
      };
      setScanned(entry);
      setScanId(entry.tagId);
      setConfirmed(false);
      setReturned(false);
      setScanInput("");
      setLocationPreview(null);
    } catch {
      setError("Scan not found.");
      setScanned(null);
      setScanId(null);
      setConfirmed(false);
      setReturned(false);
      setLocationPreview(null);
    }
  }, [scanInput, searchItems]);

  useEffect(() => {
    fetch(apiUrl("/tag/items"))
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setSearchItems(list.map((item) => ({
          id: item.id,
          code: item.code ?? item.id,
          name: item.name ?? item.id,
          location: item.location ?? "",
        })));
      })
      .catch(() => setSearchItems([]));
  }, []);

  const filteredSearch = useMemo(() => {
    const q = scanInput.trim().toLowerCase();
    if (!q) return [];
    return searchItems
      .filter((item) => `${item.code} ${item.name}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [searchItems, scanInput]);

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
            [item.id]: { home: data.home || data.location || item.location || "" },
          }));
        })
        .catch(() => {});
    });
  }, [filteredSearch]);

  useKeyboardWedgeScan({
    enabled: true,
    onScan: (value) => {
      setScanInput(value);
      scan(value);
    },
  });

  useEffect(() => {
    if (maxReturn <= 0) {
      setReturnAmount(1);
      return;
    }
    setReturnAmount((prev) => Math.min(maxReturn, Math.max(1, prev)));
  }, [maxReturn]);

  function confirmItem() {
    if (!scanned) return;
    setConfirmed(true);
  }

  async function markReturned() {
    if (!scanned) return;
    if (!confirmed) return;
    try {
      const parsed = Number(returnAmount || 1);
      const base = Number.isFinite(parsed) ? parsed : 1;
      const cap = maxReturn > 0 ? maxReturn : 1;
      const qty = Math.min(cap, Math.max(1, base));
      const res = await fetch(apiUrl("/crew/return"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId: scanned.id, home: scanned.home, qty }),
      });
      if (!res.ok) throw new Error("RETURN_FAILED");
      setReturned(true);
      setScanned((prev) => {
        if (!prev || typeof prev.qty !== "number") return prev;
        const nextQty = maxQty != null ? Math.min(maxQty, prev.qty + qty) : prev.qty + qty;
        return { ...prev, qty: nextQty };
      });
    } catch {
      setReturned(false);
      setError("Return failed. Try again.");
    }
  }

  const homeCode = scanned?.home ?? locationPreview ?? "—";
  const homePlain = scanned
    ? locationToPlainEnglish(scanned.home)
    : locationPreview
      ? locationToPlainEnglish(locationPreview)
      : "—";

  // Extract stow slot ID for 3D locator
  const stowSlotId = useMemo(() => {
    const raw = scanned?.home ?? locationPreview ?? "";
    const top = raw.split("/")[0]?.trim() ?? "";
    return /^S\dD\dL\d{1,2}$/.test(top) ? top : null;
  }, [scanned, locationPreview]);
  const [showLocator, setShowLocator] = useState(false);
  useEffect(() => { if (stowSlotId) setShowLocator(true); else setShowLocator(false); }, [stowSlotId]);

  return (
    <div className="h-full w-full flex flex-col gap-4">
      <div className="text-3xl font-semibold" style={{ color: NORD.text }}>
        Put back
      </div>
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
            <div className="relative w-full">
              <input
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Scan RFID or enter unit ID"
                className="w-full rounded-2xl px-4 py-4 text-lg outline-none"
                onFocus={() => setDropdownOpen(true)}
                onBlur={() => window.setTimeout(() => setDropdownOpen(false), 120)}
                style={{
                  background: NORD.panel2,
                  color: NORD.text,
                  border: "1px solid rgba(var(--t-border-rgb),0.12)",
                }}
              />
              {dropdownOpen && filteredSearch.length ? (
                <div
                  className="absolute left-0 right-0 mt-2 overflow-hidden rounded-2xl search-overlay"
                  style={{ zIndex: 1000 }}
                >
                  <div
                    className="grid grid-cols-[1.2fr_1fr_1.2fr] gap-2 px-4 py-2 text-xs search-overlay-header"
                    style={{ color: NORD.subtle }}
                  >
                    <div>Item</div>
                    <div>RFID</div>
                    <div>Location</div>
                  </div>
                  {filteredSearch.map((item) => {
                    const detail = searchDetails[item.id];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setScanInput(item.code);
                          setLocationPreview(detail?.home ?? item.location ?? null);
                          scan(item.code);
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 transition search-overlay-row"
                      >
                        <div className="grid grid-cols-[1.2fr_1fr_1.2fr] gap-2">
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
                          <div className="text-sm" style={{ color: NORD.subtle }}>
                            {detail?.home || item.location || "—"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <Button className="w-full sm:w-auto py-4 text-lg" onClick={scan}>
              Scan
            </Button>

            <div
              className="flex-1 rounded-2xl px-4 py-4"
              style={{
                background: NORD.panel2,
                border: `1px solid rgba(var(--t-border-rgb),0.12)`
              }}
            >
              <div className="text-sm" style={{ color: NORD.muted }}>
                Scanned tag
              </div>
              <div className="mt-1 text-2xl font-semibold" style={{ color: NORD.text }}>
                {scanId ?? "—"}
              </div>
            </div>
          </div>
          {error ? (
            <div className="text-sm" style={{ color: NORD.red }}>
              {error}
            </div>
          ) : null}

          {null}

          <div
            className="rounded-2xl p-5"
            style={{
              background: "rgba(var(--t-surface2-rgb),0.35)",
              border: `1px solid rgba(var(--t-blue-rgb),0.22)`
            }}
          >
            <div className="text-sm" style={{ color: NORD.muted }}>
              Home location
            </div>
            <div className="mt-2 text-3xl font-semibold" style={{ color: NORD.text }}>
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
              background: "rgba(var(--t-surface2-rgb),0.25)",
              border: `1px solid rgba(var(--t-border-rgb),0.10)`
              }}
            >
              <div className="text-sm" style={{ color: NORD.muted }}>Item</div>
              <div className="mt-1 text-2xl font-semibold" style={{ color: NORD.text }}>{scanned.label}</div>
              <div className="mt-1 text-sm" style={{ color: NORD.subtle }}>{scanned.id}</div>
              <div className="mt-3 text-sm" style={{ color: NORD.muted }}>Available</div>
              <div className="mt-1 text-base" style={{ color: NORD.subtle }}>
                {availableQty == null ? "—" : availableQty}
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      {/* 3D Locator — shows home location in the module */}
      {stowSlotId && showLocator && (
        <div className="animate-fade-up" style={{
          borderRadius: "1rem", overflow: "hidden", height: "320px",
          border: `1px solid rgba(var(--t-border-rgb),0.10)`,
          position: "relative",
        }}>
          <Suspense fallback={<div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: NORD.panel2, color: NORD.muted }}>Loading 3D…</div>}>
            <ModuleView3D mode="crew" focusLocationId={stowSlotId} compact />
          </Suspense>
          <button
            onClick={() => setShowLocator(false)}
            style={{
              position: "absolute", top: "0.5rem", right: "0.5rem",
              background: "rgba(var(--t-surface-rgb),0.85)", border: "1px solid rgba(var(--t-border-rgb),0.15)",
              borderRadius: "0.4rem", padding: "0.25rem 0.5rem", cursor: "pointer",
              color: NORD.muted, fontSize: "0.7rem", fontWeight: 600, backdropFilter: "blur(6px)",
            }}
          >Close</button>
          <div style={{
            position: "absolute", top: "0.5rem", left: "0.5rem",
            background: "rgba(var(--t-surface-rgb),0.85)", backdropFilter: "blur(6px)",
            borderRadius: "0.4rem", padding: "0.3rem 0.6rem",
            fontSize: "0.7rem", fontWeight: 600, color: NORD.blue,
            border: "1px solid rgba(var(--t-blue-rgb),0.2)",
          }}>
            Return to: {stowSlotId}
          </div>
        </div>
      )}

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
                <div className="mt-2 text-2xl font-semibold" style={{ color: NORD.text }}>
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
                {confirmed ? "Confirmed. You can now mark it returned." : "Required before returning."}
              </div>
            </div>
          )}
        </Card>

        <Card title="Mark returned" className="w-full">
          <div className="mb-4 flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{
              background: "rgba(var(--t-surface2-rgb),0.32)",
              border: "1px solid rgba(var(--t-border-rgb),0.10)",
            }}
          >
            <div className="text-sm" style={{ color: NORD.subtle }}>
              Amount
            </div>
            <input
              type="number"
              min={1}
              max={Math.max(1, maxReturn)}
              value={returnAmount}
              onChange={(e) => {
                const next = Math.min(Math.max(1, maxReturn || 1), Math.max(1, Number(e.target.value || 1)));
                setReturnAmount(next);
              }}
              disabled={!canReturn}
              className="w-24 rounded-xl px-3 py-2 text-base outline-none"
              style={{
                background: NORD.panel2,
                color: NORD.text,
                border: "1px solid rgba(var(--t-border-rgb),0.14)",
              }}
            />
          </div>
          <Button
            variant="success"
            className="w-full py-5 text-xl"
            onClick={markReturned}
            disabled={!scanned || !confirmed || returned || !canReturn}
          >
            {returned ? "Returned ✓" : "Mark as returned"}
          </Button>
          <div className="mt-3 text-sm" style={{ color: NORD.muted }}>
            {returned
              ? "Inventory updated."
              : !scanned
                ? "Disabled until something is scanned."
                : !canReturn
                  ? "Cannot return more. Max reached."
                : !confirmed
                  ? "Disabled until the item is confirmed."
                  : "Ready."}
          </div>
        </Card>
      </div>
    </div>
  );
}
