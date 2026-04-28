import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { apiUrl } from "../lib/apiBase";

interface Shipment {
  id: string;
  code: string;
  vendor: string;
  description?: string;
  poNumber?: string;
  status: "in-progress" | "discrepancy" | "waiting" | "complete" | "flagged";
  expected: number;
  counted: number;
  items: ShipmentItem[];
}

interface ShipmentItem {
  id: string;
  sku: string;
  name: string;
  expected: number;
  counted: number;
  status: "done" | "in-progress" | "pending";
}

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
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: string;
}) {
  const map: Record<string, { bg: string; fg: string; bd: string }> = {
    waiting: {
      bg: "rgba(129,161,193,0.12)",
      fg: NORD.blue2,
      bd: "rgba(129,161,193,0.20)",
    },
    progress: {
      bg: "rgba(136,192,208,0.12)",
      fg: NORD.blue,
      bd: "rgba(136,192,208,0.20)",
    },
    verified: {
      bg: "rgba(163,190,140,0.12)",
      fg: NORD.green,
      bd: "rgba(163,190,140,0.20)",
    },
    issue: {
      bg: "rgba(191,97,106,0.12)",
      fg: NORD.red,
      bd: "rgba(191,97,106,0.20)",
    },
    neutral: {
      bg: "rgba(var(--t-border-rgb),0.10)",
      fg: NORD.muted,
      bd: "rgba(var(--t-border-rgb),0.18)",
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

function Button({
  children,
  variant = "primary",
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const styles = {
    primary: {
      bg: NORD.blue3,
      fg: "rgb(236, 239, 244)",
      bd: "transparent",
      hover: NORD.blue2,
    },
    secondary: {
      bg: NORD.blue2,
      fg: "rgb(236, 239, 244)",
      bd: "transparent",
      hover: NORD.blue,
    },
    ghost: {
      bg: "transparent",
      fg: NORD.muted,
      bd: "rgba(var(--t-border-rgb),0.25)",
      hover: "rgba(var(--t-border-rgb),0.12)",
    },
    danger: {
      bg: NORD.red,
      fg: "rgb(236, 239, 244)",
      bd: "transparent",
      hover: "rgba(191,97,106,0.85)",
    },
  } as const;
  const s = styles[variant] ?? styles.primary;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition hover-lift",
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

function Card({
  title,
  subtitle,
  children,
  right,
  className,
  hideHeader = false,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  right?: ReactNode;
  className?: string;
  hideHeader?: boolean;
}) {
  return (
    <div
      className={cn("rounded-2xl p-4 shadow-sm animate-fade-up", className)}
      style={{
        background: NORD.panel2,
        border: `1px solid rgba(var(--t-border-rgb),0.12)`,
      }}
    >
      {!hideHeader ? (
        <>
          {title ? (
            <div className="flex items-start justify-between gap-3">
              <div>
                <div
                  className="text-base font-semibold"
                  style={{ color: NORD.text }}
                >
                  {title}
                </div>
                {subtitle ? (
                  <div
                    className="mt-0.5 text-sm"
                    style={{ color: NORD.subtle }}
                  >
                    {subtitle}
                  </div>
                ) : null}
              </div>
              {right ? <div className="shrink-0">{right}</div> : null}
            </div>
          ) : null}
          <div className={title ? "mt-3" : ""}>{children}</div>
        </>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}

function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
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

function ManifestModal({
  open,
  onClose,
  manifest,
}: {
  open: boolean;
  onClose: () => void;
  manifest: any;
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "rgba(0,0,0,0.45)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          maxHeight: "90vh",
          overflow: "hidden",
          borderRadius: "1rem",
          background: NORD.panel,
          border: `1px solid rgba(var(--t-border-rgb),0.12)`,
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.85rem 1.1rem",
            borderBottom: `1px solid rgba(var(--t-border-rgb),0.10)`,
            background: NORD.panel2,
          }}
        >
          <div>
            <div
              style={{ fontSize: "1.05rem", fontWeight: 700, color: NORD.text }}
            >
              Manifest
            </div>
            {manifest?.shipmentId ? (
              <div
                style={{
                  marginTop: "0.15rem",
                  fontSize: "0.78rem",
                  color: NORD.subtle,
                }}
              >
                {manifest.shipmentId} · {manifest.vendor}
              </div>
            ) : null}
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div
          style={{
            padding: "0.85rem 1.1rem",
            overflow: "auto",
            maxHeight: "calc(90vh - 64px)",
          }}
        >
          {!manifest ? (
            <div style={{ fontSize: "0.85rem", color: NORD.muted }}>
              No manifest available.
            </div>
          ) : (
            <>
              <div
                style={{
                  borderRadius: "0.75rem",
                  padding: "0.85rem",
                  background: NORD.panel2,
                  border: `1px solid rgba(var(--t-border-rgb),0.08)`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        color: NORD.text,
                      }}
                    >
                      {manifest.title}
                    </div>
                    <div
                      style={{
                        marginTop: "0.15rem",
                        fontSize: "0.78rem",
                        color: NORD.muted,
                      }}
                    >
                      {manifest.subtitle}
                    </div>
                  </div>
                  <StatusPill
                    label={manifest.stateLabel}
                    tone={manifest.stateTone}
                  />
                </div>

                <div
                  style={{
                    marginTop: "0.65rem",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "0.5rem",
                  }}
                >
                  {manifest.meta.map((m: any) => (
                    <div
                      key={m.k}
                      style={{
                        borderRadius: "0.5rem",
                        padding: "0.5rem 0.65rem",
                        background: NORD.panel3,
                        border: `1px solid rgba(var(--t-border-rgb),0.06)`,
                      }}
                    >
                      <div style={{ fontSize: "0.65rem", color: NORD.subtle, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        {m.k}
                      </div>
                      <div
                        style={{
                          marginTop: "0.2rem",
                          fontSize: "0.88rem",
                          fontWeight: 600,
                          color: NORD.text,
                        }}
                      >
                        {m.v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  marginTop: "0.75rem",
                  borderRadius: "0.75rem",
                  padding: "0.75rem",
                  background: NORD.panel2,
                  border: `1px solid rgba(var(--t-border-rgb),0.08)`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: NORD.text,
                    }}
                  >
                    Line Items
                  </div>
                  <div style={{ fontSize: "0.72rem", color: NORD.subtle }}>
                    {manifest.lines.length} lines
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: "0.35rem",
                  }}
                >
                  {manifest.lines.map((l: any) => (
                    <div
                      key={l.sku}
                      style={{
                        borderRadius: "0.5rem",
                        padding: "0.6rem 0.75rem",
                        background: NORD.panel3,
                        border: `1px solid rgba(var(--t-border-rgb),0.06)`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.5rem",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              color: NORD.text,
                            }}
                          >
                            {l.name}
                          </div>
                          <div
                            style={{
                              marginTop: "0.1rem",
                              fontSize: "0.7rem",
                              color: NORD.subtle,
                              fontFamily: "monospace",
                            }}
                          >
                            {l.sku}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                          }}
                        >
                          <div style={{ textAlign: "right" }}>
                            <div
                              style={{
                                fontSize: "0.62rem",
                                color: NORD.subtle,
                                fontWeight: 600,
                                textTransform: "uppercase",
                              }}
                            >
                              Expected
                            </div>
                            <div
                              style={{
                                fontSize: "1.05rem",
                                fontWeight: 700,
                                color: NORD.muted,
                              }}
                            >
                              {l.expected}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div
                              style={{
                                fontSize: "0.62rem",
                                color: NORD.subtle,
                                fontWeight: 600,
                                textTransform: "uppercase",
                              }}
                            >
                              Counted
                            </div>
                            <div
                              style={{
                                fontSize: "1.05rem",
                                fontWeight: 700,
                                color: l.counted >= l.expected ? NORD.green : NORD.blue,
                              }}
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
      <div
        style={{ position: "fixed", inset: 0, zIndex: -1 }}
        onClick={onClose}
      />
    </div>
  );
}

function statusTone(status: Shipment["status"]) {
  switch (status) {
    case "complete":
      return "verified";
    case "discrepancy":
    case "flagged":
      return "issue";
    case "waiting":
      return "waiting";
    default:
      return "progress";
  }
}

export default function ReceiveScreen() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [manifestOpen, setManifestOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [showArchive, setShowArchive] = useState(false);
  const hasInitialized = useRef(false);

  async function refreshShipments() {
    const res = await fetch(apiUrl("/shipments"));
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as Shipment[];
    setShipments(data);
    // Auto-select first ACTIVE shipment only once on initial load
    if (!hasInitialized.current && data.length > 0) {
      hasInitialized.current = true;
      const firstActive = data.find(s => s.status !== "complete" && s.status !== "flagged");
      setSelectedId((firstActive ?? data[0]).id);
    }
  }

  useEffect(() => {
    refreshShipments().catch(console.error);
    // Auto-poll so Ground sees new vendor shipments without manual refresh
    const id = window.setInterval(() => refreshShipments().catch(() => {}), 4000);
    return () => window.clearInterval(id);
  }, []);

  const filteredShipments = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return shipments;
    return shipments.filter((s) =>
      `${s.code} ${s.vendor} ${s.description ?? ""} ${s.poNumber ?? ""}`.toLowerCase().includes(q),
    );
  }, [shipments, searchValue]);

  const activeShipments = useMemo(() => filteredShipments.filter(s => s.status !== "complete" && s.status !== "flagged"), [filteredShipments]);
  const flaggedShipments = useMemo(() => filteredShipments.filter(s => s.status === "flagged"), [filteredShipments]);
  const archivedShipments = useMemo(() => filteredShipments.filter(s => s.status === "complete"), [filteredShipments]);

  const selectedShipment = useMemo(
    () => shipments.find((s) => s.id === selectedId) ?? shipments.find(s => s.status !== "complete" && s.status !== "flagged") ?? shipments[0],
    [shipments, selectedId],
  );

  const totals = useMemo(() => {
    if (!selectedShipment) return { expected: 0, counted: 0, progress: 0 };
    const expected = selectedShipment.expected ?? 0;
    const counted = selectedShipment.counted ?? 0;
    const progress = expected > 0 ? Math.min(1, counted / expected) : 0;
    return { expected, counted, progress };
  }, [selectedShipment]);

  const manifest = useMemo(() => {
    if (!selectedShipment) return null;
    return {
      shipmentId: selectedShipment.code,
      vendor: selectedShipment.vendor,
      title: `MFT-${selectedShipment.code}`,
      subtitle: `${selectedShipment.vendor} • ${selectedShipment.code}`,
      stateLabel:
        selectedShipment.status === "discrepancy"
          ? "Discrepancy"
          : selectedShipment.status === "complete"
            ? "Done"
            : selectedShipment.status === "waiting"
              ? "Waiting"
              : "In progress",
      stateTone: statusTone(selectedShipment.status),
      meta: [
        { k: "Shipment", v: selectedShipment.code },
        { k: "Supplier", v: selectedShipment.vendor },
        { k: "Expected", v: String(selectedShipment.expected) },
        { k: "Counted", v: String(selectedShipment.counted) },
        { k: "Status", v: selectedShipment.status },
        { k: "Lines", v: String(selectedShipment.items.length) },
      ],
      lines: selectedShipment.items.map((item) => {
        const done = item.counted === item.expected;
        const stateLabel = done
          ? "Done"
          : item.counted === 0
            ? "Waiting"
            : "In progress";
        const stateTone = done
          ? "verified"
          : item.counted === 0
            ? "waiting"
            : "progress";
        return {
          sku: item.sku,
          name: item.name,
          expected: item.expected,
          counted: item.counted,
          stateLabel,
          stateTone,
        };
      }),
    };
  }, [selectedShipment]);

  return (
    <div className="h-full flex flex-col gap-4">
      <ScreenHeader
        title="Receive"
        right={
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search"
            className="w-full sm:w-64 rounded-2xl px-4 py-2 text-sm outline-none"
            style={{
              background: NORD.panel2,
              color: NORD.text,
              border: `1px solid rgba(var(--t-border-rgb),0.12)`,
            }}
          />
        }
      />

      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
        <div className="col-span-12 xl:col-span-3 h-full">
          <div
            className="rounded-2xl p-3 h-full flex flex-col"
            style={{
              background: NORD.panel2,
              border: `1px solid rgba(var(--t-border-rgb),0.08)`,
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
                <div className="mt-0.5 text-sm" style={{ color: NORD.subtle }}>
                  Tap a shipment to select
                </div>
              </div>
              <div className="text-sm" style={{ color: NORD.subtle }}>
                {shipments.length} total
              </div>
            </div>

            <div className="mt-3 space-y-2 flex-1 min-h-0 overflow-auto pr-1">
              {/* Active shipments */}
              {activeShipments.map((s) => {
                const active = s.id === selectedId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={`relative w-full rounded-xl px-3 py-3 text-left transition ${active ? "" : "hover:opacity-95"}`}
                    style={{
                      background: active
                        ? "rgba(var(--t-blue-rgb),0.18)"
                        : NORD.panel2,
                      border: `1px solid ${active ? "rgba(var(--t-blue-rgb),0.32)" : "rgba(var(--t-border-rgb),0.08)"}`,
                    }}
                  >
                    {active ? (
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
                          {s.description || s.code}
                        </div>
                        <div
                          className="text-sm truncate"
                          style={{ color: NORD.subtle }}
                        >
                          {s.vendor}{s.poNumber ? ` · ${s.poNumber}` : ""}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusPill
                          label={
                            s.status === "discrepancy"
                              ? "Discrepancy"
                              : s.status === "complete"
                                ? "Done"
                                : s.status === "waiting"
                                  ? "Waiting"
                                  : "In progress"
                          }
                          tone={statusTone(s.status)}
                        />
                        <span
                          className="text-sm"
                          style={{ color: NORD.subtle }}
                        >
                          {s.counted}/{s.expected}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}

              {activeShipments.length === 0 && flaggedShipments.length === 0 && (
                <div className="text-sm py-3 text-center" style={{ color: NORD.muted }}>No active shipments</div>
              )}

              {/* Flagged shipments section */}
              {flaggedShipments.length > 0 && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.25rem 0.25rem" }}>
                    <div style={{ flex: 1, height: "1px", background: `rgba(191,97,106,0.35)` }} />
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: NORD.red, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                      ⚠ Flagged ({flaggedShipments.length})
                    </span>
                    <div style={{ flex: 1, height: "1px", background: `rgba(191,97,106,0.35)` }} />
                  </div>
                  {flaggedShipments.map((s) => {
                    const active = s.id === selectedId;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedId(s.id)}
                        className={`relative w-full rounded-xl px-3 py-3 text-left transition ${active ? "" : "hover:opacity-95"}`}
                        style={{
                          background: active ? "rgba(191,97,106,0.18)" : NORD.panel2,
                          border: `1px solid ${active ? "rgba(191,97,106,0.45)" : "rgba(191,97,106,0.22)"}`,
                        }}
                      >
                        {active ? (
                          <span
                            className="absolute left-0 top-2 bottom-2 w-1 rounded-r"
                            style={{ background: NORD.red }}
                          />
                        ) : null}
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-base font-semibold" style={{ color: NORD.text }}>
                              {s.description || s.code}
                            </div>
                            <div className="text-sm truncate" style={{ color: NORD.subtle }}>
                              {s.vendor}{s.poNumber ? ` · ${s.poNumber}` : ""}
                            </div>
                          </div>
                          <StatusPill label="Flagged" tone="issue" />
                        </div>
                      </button>
                    );
                  })}
                </>
              )}

              {/* Archive divider */}
              {archivedShipments.length > 0 && (
                <>
                  <button
                    onClick={() => setShowArchive(v => !v)}
                    className="w-full flex items-center gap-2 py-2 px-1"
                    style={{ border: "none", background: "transparent", cursor: "pointer" }}
                  >
                    <div style={{ flex: 1, height: "1px", background: "rgba(var(--t-border-rgb),0.18)" }} />
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: NORD.subtle, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                      Archive ({archivedShipments.length}) {showArchive ? "▴" : "▾"}
                    </span>
                    <div style={{ flex: 1, height: "1px", background: "rgba(var(--t-border-rgb),0.18)" }} />
                  </button>

                  {showArchive && archivedShipments.map((s) => {
                    const active = s.id === selectedId;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedId(s.id)}
                        className={`relative w-full rounded-xl px-3 py-3 text-left transition ${active ? "" : "hover:opacity-95"}`}
                        style={{
                          background: active
                            ? "rgba(var(--t-blue-rgb),0.18)"
                            : NORD.panel2,
                          border: `1px solid ${active ? "rgba(var(--t-blue-rgb),0.32)" : "rgba(var(--t-border-rgb),0.08)"}`,
                          opacity: active ? 1 : 0.7,
                        }}
                      >
                        {active ? (
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
                              {s.description || s.code}
                            </div>
                            <div
                              className="text-sm truncate"
                              style={{ color: NORD.subtle }}
                            >
                              {s.vendor}{s.poNumber ? ` · ${s.poNumber}` : ""}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <StatusPill label="Done" tone="verified" />
                            <span
                              className="text-sm"
                              style={{ color: NORD.subtle }}
                            >
                              {s.counted}/{s.expected}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-9 flex flex-col h-full min-h-0">
          <Card className="flex-1 flex flex-col min-h-0" hideHeader>
            {!selectedShipment ? (
              <div className="h-full grid place-items-center">
                <div className="text-lg" style={{ color: NORD.muted }}>
                  Select a shipment from the inbound list.
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col gap-4 min-h-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div
                      className="text-2xl font-semibold"
                      style={{ color: NORD.text }}
                    >
                      {selectedShipment.description || selectedShipment.code}
                    </div>
                    <div
                      className="mt-1 text-sm"
                      style={{ color: NORD.subtle }}
                    >
                      {selectedShipment.vendor}{selectedShipment.poNumber ? ` · ${selectedShipment.poNumber}` : ""} · {selectedShipment.code}
                    </div>
                  </div>
                  <StatusPill
                    label={
                      selectedShipment.status === "discrepancy"
                        ? "Discrepancy"
                        : selectedShipment.status === "complete"
                          ? "Done"
                          : selectedShipment.status === "waiting"
                            ? "Waiting"
                            : "In progress"
                    }
                    tone={statusTone(selectedShipment.status)}
                  />
                </div>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 xl:col-span-5">
                    <div
                      className="rounded-2xl p-5"
                      style={{
                        background: NORD.panel2,
                        border: `1px solid rgba(var(--t-border-rgb),0.08)`,
                      }}
                    >
                      <div className="text-sm" style={{ color: NORD.subtle }}>
                        Counted
                      </div>
                      <div
                        className="mt-2 text-4xl font-semibold"
                        style={{ color: NORD.text }}
                      >
                        {totals.counted}
                      </div>
                      <div className="mt-4">
                        <div
                          className="h-2 rounded-full"
                          style={{ background: NORD.panel3 }}
                        >
                          <div
                            style={{
                              width: `${Math.round(totals.progress * 100)}%`,
                              height: "100%",
                              borderRadius: "999px",
                              background:
                                "linear-gradient(90deg, #5E81AC, #81A1C1)",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-12 xl:col-span-7">
                    <div
                      className="rounded-2xl p-5"
                      style={{
                        background: NORD.panel2,
                        border: `1px solid rgba(var(--t-border-rgb),0.08)`,
                      }}
                    >
                      <div className="text-sm" style={{ color: NORD.subtle }}>
                        Expected
                      </div>
                      <div
                        className="mt-2 text-4xl font-semibold"
                        style={{ color: NORD.muted }}
                      >
                        {totals.expected}
                      </div>
                      <div
                        className="mt-4 text-sm"
                        style={{ color: NORD.subtle }}
                      >
                        {selectedShipment.items.length} manifest lines
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4 min-h-0">
                  <div className="col-span-12 xl:col-span-7 flex flex-col min-h-0">
                    <div
                      className="text-base font-semibold"
                      style={{ color: NORD.text }}
                    >
                      Manifest
                    </div>
                    <div className="mt-3 space-y-2 flex-1 min-h-0 overflow-auto pr-1">
                      {selectedShipment.items.length ? (
                        selectedShipment.items.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl p-4"
                            style={{
                              background: NORD.panel2,
                              border: `1px solid rgba(var(--t-border-rgb),0.06)`,
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div
                                  className="text-base font-semibold"
                                  style={{ color: NORD.text }}
                                >
                                  {item.name}
                                </div>
                                <div
                                  className="text-sm truncate"
                                  style={{ color: NORD.subtle }}
                                >
                                  {item.sku}
                                </div>
                              </div>
                              <StatusPill
                                label={
                                  item.counted === item.expected
                                    ? "Done"
                                    : item.counted === 0
                                      ? "Waiting"
                                      : "In progress"
                                }
                                tone={
                                  item.counted === item.expected
                                    ? "verified"
                                    : item.counted === 0
                                      ? "waiting"
                                      : "progress"
                                }
                              />
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3">
                              <div>
                                <div
                                  className="text-sm"
                                  style={{ color: NORD.subtle }}
                                >
                                  Expected
                                </div>
                                <div
                                  className="text-lg font-semibold"
                                  style={{ color: NORD.text }}
                                >
                                  {item.expected}
                                </div>
                              </div>
                              <div>
                                <div
                                  className="text-sm"
                                  style={{ color: NORD.subtle }}
                                >
                                  Counted
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    aria-label={`Decrease count for ${item.name}`}
                                    onClick={async () => {
                                      try {
                                        await fetch(
                                          apiUrl(`/shipments/${selectedShipment.id}/lines/${encodeURIComponent(item.id)}/count`),
                                          {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ delta: -1 }),
                                          }
                                        );
                                      } catch (_) {}
                                      await refreshShipments();
                                    }}
                                    disabled={item.counted <= 0 || selectedShipment.status === "complete" || selectedShipment.status === "flagged"}
                                    className="rounded-lg px-2 py-0.5 text-lg font-bold"
                                    style={{
                                      background: "rgba(191,97,106,0.18)",
                                      color: NORD.red,
                                      border: "1px solid rgba(191,97,106,0.35)",
                                      opacity: (item.counted <= 0 || selectedShipment.status === "complete" || selectedShipment.status === "flagged") ? 0.4 : 1,
                                      cursor: (item.counted <= 0 || selectedShipment.status === "complete" || selectedShipment.status === "flagged") ? "not-allowed" : "pointer",
                                    }}
                                  >
                                    −
                                  </button>
                                  <div
                                    className="text-lg font-semibold"
                                    style={{
                                      color:
                                        item.counted === item.expected
                                          ? NORD.green
                                          : "rgb(220, 162, 46)",
                                      minWidth: "2ch",
                                      textAlign: "center",
                                    }}
                                  >
                                    {item.counted}
                                  </div>
                                  <button
                                    aria-label={`Increase count for ${item.name}`}
                                    onClick={async () => {
                                      try {
                                        await fetch(
                                          apiUrl(`/shipments/${selectedShipment.id}/lines/${encodeURIComponent(item.id)}/count`),
                                          {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ delta: 1 }),
                                          }
                                        );
                                      } catch (_) {}
                                      await refreshShipments();
                                    }}
                                    disabled={selectedShipment.status === "complete" || selectedShipment.status === "flagged"}
                                    className="rounded-lg px-2 py-0.5 text-lg font-bold"
                                    style={{
                                      background: "rgba(163,190,140,0.18)",
                                      color: NORD.green,
                                      border: "1px solid rgba(163,190,140,0.35)",
                                      opacity: (selectedShipment.status === "complete" || selectedShipment.status === "flagged") ? 0.4 : 1,
                                      cursor: (selectedShipment.status === "complete" || selectedShipment.status === "flagged") ? "not-allowed" : "pointer",
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-lg" style={{ color: NORD.muted }}>
                          No manifest lines yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-span-12 xl:col-span-5 flex flex-col gap-3">
                    <div
                      className="text-base font-semibold"
                      style={{ color: NORD.text }}
                    >
                      Actions
                    </div>
                    <Button
                      variant="danger"
                      disabled={selectedShipment.status === "complete" || selectedShipment.status === "flagged"}
                      onClick={async () => {
                        try {
                          await fetch(
                            apiUrl(`/shipments/${selectedShipment.id}/flag`),
                            { method: "POST" }
                          );
                        } catch (_) {}
                        await refreshShipments();
                      }}
                    >
                      {selectedShipment.status === "flagged" ? "⚠ Flagged" : "Flag discrepancy"}
                    </Button>
                    <Button onClick={() => setManifestOpen(true)}>
                      View manifest
                    </Button>
                    <Button
                      variant="primary"
                      disabled={
                        selectedShipment.status === "complete" ||
                        selectedShipment.status === "flagged" ||
                        (selectedShipment.items.length > 0 && !selectedShipment.items.every(it => it.counted >= it.expected))
                      }
                      onClick={async () => {
                        try {
                          await fetch(apiUrl(`/shipments/${selectedShipment.id}/process`), { method: "POST" });
                        } catch (_) {}
                        await refreshShipments();
                      }}
                    >
                      {selectedShipment.status === "complete"
                        ? "✓ Received"
                        : selectedShipment.items.length > 0 && !selectedShipment.items.every(it => it.counted >= it.expected)
                          ? `Count all items first (${selectedShipment.items.filter(it => it.counted < it.expected).length} remaining)`
                          : "Accept Shipment"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <ManifestModal
        open={manifestOpen}
        onClose={() => setManifestOpen(false)}
        manifest={manifest}
      />
    </div>
  );
}
