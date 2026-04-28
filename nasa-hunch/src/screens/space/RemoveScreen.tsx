import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense, type ReactNode } from "react";
import { apiUrl } from "../../lib/apiBase";
import { useKeyboardWedgeScan } from "../../lib/useKeyboardWedgeScan";

const ModuleView3D = lazy(() => import("../ModuleView3D"));

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
  teal: "var(--t-teal)",
  green: "var(--t-green)",
  yellow: "var(--t-accent)",
  red: "var(--t-red)",
  orange: "var(--t-accent)",
  purple: "var(--t-purple)",
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Card({
  title,
  children,
  right,
  className,
}: {
  title: string;
  children: ReactNode;
  right?: ReactNode;
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
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
}) {
  const styles = {
    primary: { bg: NORD.blue3, fg: NORD.text, hover: NORD.blue2, bd: "1px solid transparent" },
    secondary: { bg: NORD.blue2, fg: NORD.text, hover: NORD.blue, bd: "1px solid transparent" },
    ghost: {
      bg: "transparent",
      fg: NORD.subtle,
      hover: "rgba(var(--t-border-rgb),0.08)",
      bd: "1px solid rgba(var(--t-border-rgb),0.16)",
    },
    danger: { bg: NORD.red, fg: NORD.text, hover: "rgba(var(--t-red-rgb),0.85)", bd: "1px solid transparent" },
  } as const;
  const s = styles[variant] ?? styles.primary;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-5 py-4 text-lg font-semibold transition hover-lift",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-95",
        className,
      )}
      style={{
        background: s.bg,
        color: s.fg,
        border: s.bd,
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
}: {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
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
        border: "1px solid rgba(var(--t-border-rgb),0.14)",
      }}
    />
  );
}

function Pill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const map = {
    neutral: {
      bg: "rgba(var(--t-blue2-rgb),0.16)",
      fg: NORD.blue2,
      bd: "rgba(var(--t-blue2-rgb),0.26)",
    },
    good: {
      bg: "rgba(var(--t-green-rgb),0.14)",
      fg: NORD.green,
      bd: "rgba(var(--t-green-rgb),0.22)",
    },
    warn: {
      bg: "rgba(var(--t-accent-rgb),0.14)",
      fg: NORD.yellow,
      bd: "rgba(var(--t-accent-rgb),0.22)",
    },
    bad: {
      bg: "rgba(var(--t-red-rgb),0.14)",
      fg: NORD.red,
      bd: "rgba(var(--t-red-rgb),0.22)",
    },
  } as const;
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

function parseLocation(code: string) {
  const raw = String(code ?? "").trim();
  if (!raw) return { code: "—", english: "" };

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

function LocationBlock({ code, english, big = false }: { code: string; english: string; big?: boolean }) {
  return (
    <div
      className={cn("rounded-2xl px-5 py-4", big ? "py-5" : "")}
      style={{
        background: "rgba(var(--t-surface2-rgb),0.32)",
        border: "1px solid rgba(var(--t-blue-rgb),0.18)",
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
        <div className="text-base" style={{ color: NORD.subtle }}>
          {code || "—"}
        </div>
      )}
    </div>
  );
}

type DirectoryEntry = {
  id: string;
  name: string;
  tagId: string;
  location: string;
  kind: string;
  qty?: number | null;
  maxQty?: number | null;
};

type CrewScanResponse = {
  id: string;
  name: string;
  tagId: string;
  location?: string;
  home?: string;
  kind?: string;
  qty?: number | null;
  maxQty?: number | null;
};

type SearchItem = {
  id: string;
  code: string;
  name: string;
};

export default function RemoveScreen() {
  const [scanValue, setScanValue] = useState("");
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [searchDetails, setSearchDetails] = useState<Record<string, { location?: string; kind?: string }>>({});
  const fetchedDetailsRef = useRef<Set<string>>(new Set());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [locationPreview, setLocationPreview] = useState<string | null>(null);
  const [scanned, setScanned] = useState<DirectoryEntry | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [lastActionAt, setLastActionAt] = useState<number | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [removeAmount, setRemoveAmount] = useState(1);

  const availableQty = typeof scanned?.qty === "number" ? scanned.qty : null;
  const canRemove = availableQty == null ? true : availableQty > 0;
  const maxRemove = availableQty == null ? 100 : Math.max(1, availableQty);

  function reset() {
    setScanValue("");
    setScanned(null);
    setConfirmed(false);
    setRemoved(false);
    setWarning(null);
  }

  const submitScan = useCallback(async (override?: string) => {
    const norm = String(override ?? scanValue ?? "").trim();
    if (!norm) return;
    try {
      const res = await fetch(apiUrl("/crew/scan"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: norm }),
      });
      if (!res.ok) throw new Error("SCAN_FAILED");
      const data = (await res.json()) as CrewScanResponse;
      setScanned({
        id: data.id,
        name: data.name,
        tagId: data.tagId ?? norm,
        location: data.location ?? data.home ?? "",
        kind: data.kind ?? "—",
        qty: typeof data.qty === "number" ? data.qty : null,
        maxQty: typeof data.maxQty === "number" ? data.maxQty : null,
      });
      setLocationPreview(null);
      setConfirmed(false);
      setRemoved(false);
      setWarning(null);
    } catch {
      setScanned(null);
      setConfirmed(false);
      setRemoved(false);
      setLocationPreview(null);
      setWarning("Item not found. Try again.");
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
            [item.id]: { location: data.location ?? data.home ?? "", kind: data.kind ?? "" },
          }));
        })
        .catch(() => {});
    });
  }, [filteredSearch]);

  useKeyboardWedgeScan({
    enabled: true,
    onScan: (value) => {
      setScanValue(value);
      submitScan(value);
    },
  });

  useEffect(() => {
    if (availableQty == null) return;
    if (availableQty <= 0) {
      setRemoveAmount(1);
      return;
    }
    setRemoveAmount((prev) => Math.min(availableQty, Math.max(1, prev)));
  }, [availableQty]);

  function confirmItem() {
    if (!scanned) return;
    setConfirmed(true);
  }

  async function markRemoved() {
    if (!scanned || !confirmed) return;
    try {
      if (typeof scanned.qty === "number" && scanned.qty <= 0) {
        setWarning("No quantity available.");
        return;
      }
      const parsed = Number(removeAmount || 1);
      const base = Number.isFinite(parsed) ? parsed : 1;
      const cap = typeof scanned.qty === "number" ? scanned.qty : 100;
      const qty = Math.min(cap, Math.max(1, base));
      const res = await fetch(apiUrl("/crew/remove"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId: scanned.id, qty }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        if (err?.error === "INSUFFICIENT_QTY" && typeof err.available === "number") {
          setWarning(`Only ${err.available} left.`);
          setScanned((prev) => (prev ? { ...prev, qty: err.available } : prev));
          return;
        }
        throw new Error("REMOVE_FAILED");
      }
      setRemoved(true);
      setLastActionAt(Date.now());
      setScanned((prev) => {
        if (!prev || typeof prev.qty !== "number") return prev;
        const nextQty = Math.max(0, prev.qty - qty);
        return { ...prev, qty: nextQty };
      });
      if (typeof scanned.qty === "number" && scanned.qty - qty <= 0) {
        setConfirmed(false);
        setWarning("No more available.");
      }
    } catch {
      setWarning("Remove failed. Try again.");
    }
  }

  const location = scanned ? parseLocation(scanned.location) : null;

  // Extract stow slot ID for 3D locator (e.g. "S1D2L5" from "S1D2L5/CTB-001")
  const stowSlotId = useMemo(() => {
    if (!scanned?.location) return null;
    const top = scanned.location.split("/")[0]?.trim() ?? "";
    return /^S\dD\dL\d{1,2}$/.test(top) ? top : null;
  }, [scanned]);
  const [showLocator, setShowLocator] = useState(false);
  useEffect(() => { if (stowSlotId) setShowLocator(true); else setShowLocator(false); }, [stowSlotId]);

  return (
    <div className="h-full w-full flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-3xl font-semibold" style={{ color: NORD.text }}>
            Take out
          </div>
          <div className="text-base" style={{ color: NORD.muted }}>
            Scan an item, confirm the details, and mark it as removed.
          </div>
        </div>
        {removed ? <Pill label="Removed" tone="good" /> : null}
      </div>

      <div style={{ position: "relative", zIndex: 5 }}>
        <Card title="Scan" right={warning ? <Pill label={warning} tone="bad" /> : null}>
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
            <div className="space-y-3">
            <div className="text-sm font-semibold" style={{ color: NORD.subtle }}>
              RFID tag
            </div>
            <div className="relative">
              <BigInput
                value={scanValue}
                onChange={(value) => setScanValue(value)}
                placeholder="Scan RFID tag…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitScan();
                }}
                onFocus={() => setDropdownOpen(true)}
                onBlur={() => window.setTimeout(() => setDropdownOpen(false), 120)}
              />
              {dropdownOpen && filteredSearch.length ? (
                <div className="absolute left-0 right-0 mt-2 overflow-hidden rounded-2xl search-overlay" style={{ zIndex: 1000 }}>
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
                          setScanValue(item.code);
                          setLocationPreview(detail?.location ?? null);
                          submitScan(item.code);
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
                            {detail?.location ? detail.location : "—"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={submitScan}>Submit</Button>
              <Button variant="ghost" onClick={reset}>
                Clear
              </Button>
            </div>
            {warning ? (
              <div className="text-sm" style={{ color: NORD.red }}>
                {warning}
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold" style={{ color: NORD.subtle }}>
              Location
            </div>
            {location ? (
              <LocationBlock code={location.code} english={location.english} />
            ) : locationPreview ? (
              <LocationBlock code={locationPreview} english={""} />
            ) : (
              <LocationBlock code="—" english="" />
            )}
          </div>
        </div>
      </Card>
      </div>

      {/* 3D Locator — shows scanned item's position in the module */}
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
            {stowSlotId}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 stagger-children">
        <Card title="Item" className="rounded-2xl p-5 animate-fade-up w-full">
          <div className="space-y-4">
            <div>
              <div className="text-sm" style={{ color: NORD.subtle }}>
                Name
              </div>
              <div className="text-xl font-semibold" style={{ color: NORD.text }}>
                {scanned?.name ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-sm" style={{ color: NORD.subtle }}>
                Item ID
              </div>
              <div className="text-base" style={{ color: NORD.muted }}>
                {scanned?.id ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-sm" style={{ color: NORD.subtle }}>
                Category
              </div>
              <div className="text-base" style={{ color: NORD.muted }}>
                {scanned?.kind ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-sm" style={{ color: NORD.subtle }}>
                Available
              </div>
              <div className="text-base" style={{ color: NORD.muted }}>
                {availableQty == null ? "—" : availableQty}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Checklist" className="rounded-2xl p-5 animate-fade-up w-full">
          <div className="space-y-4">
            <div
              className="rounded-2xl px-4 py-3 hover-lift"
              style={{
                background: "rgba(var(--t-surface2-rgb),0.32)",
                border: "1px solid rgba(var(--t-border-rgb),0.10)",
              }}
            >
              <div className="text-sm" style={{ color: NORD.subtle }}>
                Step 1
              </div>
              <div className="text-base font-semibold" style={{ color: NORD.text }}>
                Confirm item label
              </div>
            </div>

            <div
              className="rounded-2xl px-4 py-3 hover-lift"
              style={{
                background: "rgba(var(--t-surface2-rgb),0.32)",
                border: "1px solid rgba(var(--t-border-rgb),0.10)",
              }}
            >
              <div className="text-sm" style={{ color: NORD.subtle }}>
                Step 2
              </div>
              <div className="text-base font-semibold" style={{ color: NORD.text }}>
                Secure item
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
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
                  max={maxRemove}
                  value={removeAmount}
                  onChange={(e) => {
                    const next = Math.min(maxRemove, Math.max(1, Number(e.target.value || 1)));
                    setRemoveAmount(next);
                  }}
                  disabled={!canRemove}
                  className="w-24 rounded-xl px-3 py-2 text-base outline-none"
                  style={{
                    background: NORD.panel2,
                    color: NORD.text,
                    border: "1px solid rgba(var(--t-border-rgb),0.14)",
                  }}
                />
              </div>
              <Button onClick={confirmItem} disabled={!scanned || !canRemove}>
                Confirm item
              </Button>
              <Button variant="danger" onClick={markRemoved} disabled={!confirmed || !canRemove}>
                Mark removed
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Log" className="rounded-2xl p-5 animate-fade-up w-full">
          <div className="space-y-3">
            <div className="text-sm" style={{ color: NORD.subtle }}>
              Last action
            </div>
            <div
              className="rounded-2xl px-4 py-3 text-base hover-lift"
              style={{
                background: "rgba(var(--t-surface2-rgb),0.32)",
                border: "1px solid rgba(var(--t-border-rgb),0.10)",
                color: NORD.text,
              }}
            >
              {removed
                ? `Removed ${scanned?.name ?? "item"} ×${removeAmount}`
                : "No actions yet"}
            </div>
            <div className="text-sm" style={{ color: NORD.muted }}>
              {lastActionAt ? new Date(lastActionAt).toLocaleString() : "—"}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
