import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { apiUrl } from "../lib/apiBase";
import { useKeyboardWedgeScan } from "../lib/useKeyboardWedgeScan";

export interface TagItem {
  id: string;
  code: string;
  name: string;
  status: "tagged" | "untagged" | "needs-verify";
  location?: string;
}

interface Pairing {
  uid: string;
  itemId: string;
  when: string;
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
  purple: "var(--t-purple)",
};

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
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-base font-semibold transition hover-lift " +
        (disabled ? "opacity-50 cursor-not-allowed " : "hover:opacity-95 ") +
        (className ?? "")
      }
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
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.bd}` }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: s.fg }} />
      {label}
    </span>
  );
}

function Card({
  title,
  subtitle,
  children,
  right,
  titleLarge = false,
  className,
  hideHeader = false,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  right?: ReactNode;
  titleLarge?: boolean;
  className?: string;
  hideHeader?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 shadow-sm animate-fade-up ${className ?? ""}`}
      style={{
        background: "rgba(var(--t-border-rgb),0.06)",
        border: `1px solid rgba(var(--t-border-rgb),0.14)`,
      }}
    >
      {!hideHeader ? (
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div
                className={
                  titleLarge ? "text-xl font-semibold" : "text-lg font-semibold"
                }
                style={{ color: NORD.text }}
              >
                {title}
              </div>
              {subtitle ? (
                <div className="mt-1 text-base" style={{ color: NORD.subtle }}>
                  {subtitle}
                </div>
              ) : null}
            </div>
            {right ? <div className="shrink-0">{right}</div> : null}
          </div>
          <div className="mt-5">{children}</div>
        </div>
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "var(--t-surface2)",
        border: `1px solid rgba(var(--t-border-rgb),0.10)`,
      }}
    >
      <div className="text-sm" style={{ color: NORD.subtle }}>
        {label}
      </div>
      <div
        className="mt-1 text-base font-semibold"
        style={{ color: NORD.text }}
      >
        {value}
      </div>
    </div>
  );
}

export default function TagScreen() {
  const [items, setItems] = useState<TagItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [scannedUid, setScannedUid] = useState("");
  const [cardInput, setCardInput] = useState("");
  const [uidStatus, setUidStatus] = useState<
    "idle" | "ready" | "paired" | "verified"
  >("idle");
  const [searchValue, setSearchValue] = useState("");
  const [pairingInfo, setPairingInfo] = useState<Pairing | null>(null);
  const [flashBanner, setFlashBanner] = useState<{
    kind: "ok" | "warn" | "info";
    title: string;
    detail: string;
  } | null>(null);
  const bannerTimer = useRef<number | undefined>(undefined);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );
  const filteredItems = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      `${item.id} ${item.code} ${item.name} ${item.location ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [items, searchValue]);

  async function refreshItems() {
    const res = await fetch(apiUrl("/tag/items"));
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as TagItem[];
    setItems(data);
    if (
      (!selectedId || !data.find((item) => item.id === selectedId)) &&
      data.length > 0
    ) {
      setSelectedId(data[0].id);
    }
  }

  useEffect(() => {
    refreshItems().catch(console.error);
  }, []);

  useKeyboardWedgeScan({
    enabled: true,
    onScan: (value) => {
      setScannedUid(value);
      setCardInput(value);
      setUidStatus("ready");
    },
    minLength: 8,
    maxDelayMs: 35,
  });

  function showBanner(
    kind: "ok" | "warn" | "info",
    title: string,
    detail: string,
  ) {
    setFlashBanner({ kind, title, detail });
    if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    bannerTimer.current = window.setTimeout(() => setFlashBanner(null), 2400);
  }

  function clearScan() {
    setScannedUid("");
    setCardInput("");
    setUidStatus("idle");
  }

  function handleManualScan() {
    const value = cardInput.trim();
    if (!value) return;
    setScannedUid(value);
    setUidStatus("ready");
  }

  function canPair() {
    return (
      Boolean(scannedUid) && Boolean(selectedItem) && uidStatus === "ready"
    );
  }

  function doPair() {
    if (!selectedItem || !scannedUid) {
      showBanner(
        "warn",
        "Missing selection",
        "Scan a card and pick an item first.",
      );
      return;
    }
    fetch(apiUrl("/tag/pair"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardHex: scannedUid, itemId: selectedItem.id }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("PAIR_FAILED");
        return r.json();
      })
      .then((resp) => {
        const when = new Date(resp?.when ?? Date.now()).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        setPairingInfo({ uid: scannedUid, itemId: selectedItem.id, when });
        setUidStatus("paired");
        showBanner("ok", "Paired", `${scannedUid} → ${selectedItem.code}`);
        refreshItems().catch(console.error);
      })
      .catch(() =>
        showBanner("warn", "Pair failed", "Unable to pair this tag."),
      );
  }

  function doVerify() {
    if (!pairingInfo || uidStatus !== "paired") {
      showBanner("warn", "Nothing to verify", "Pair a card first.");
      return;
    }
    fetch(apiUrl("/tag/verify"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardHex: pairingInfo.uid }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("VERIFY_FAILED");
        return r.json();
      })
      .then(() => {
        setUidStatus("verified");
        showBanner("ok", "Verified", `${pairingInfo.uid} confirmed`);
        refreshItems().catch(console.error);
      })
      .catch(() =>
        showBanner("warn", "Verify failed", "Unable to verify this tag."),
      );
  }

  function toneForItem(item: TagItem) {
    if (item.status === "tagged") return "verified";
    if (item.status === "needs-verify") return "progress";
    return "waiting";
  }

  const uidPill =
    uidStatus === "idle"
      ? { label: "Waiting for scan", tone: "neutral" }
      : uidStatus === "ready"
        ? { label: "Scanned", tone: "progress" }
        : uidStatus === "paired"
          ? { label: "Paired", tone: "progress" }
          : { label: "Verified", tone: "verified" };

  return (
    <div className="space-y-4">
      <ScreenHeader
        title="Tag"
        right={
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search"
            className="w-full sm:w-64 rounded-2xl px-4 py-2 text-sm outline-none"
            style={{
              background: "rgba(var(--t-border-rgb),0.08)",
              color: NORD.text,
              border: "1px solid rgba(var(--t-border-rgb),0.14)",
            }}
          />
        }
      />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-6">
          <Card
            title="RFID card"
            right={<StatusPill label={uidPill.label} tone={uidPill.tone} />}
            className="h-full"
          >
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(var(--t-border-rgb),0.08)",
                border: `1px solid rgba(var(--t-border-rgb),0.10)`,
              }}
            >
              <div className="text-sm" style={{ color: NORD.subtle }}>
                UID
              </div>
              <div
                className="mt-1 text-2xl font-semibold"
                style={{ color: NORD.text, letterSpacing: 0.2 }}
              >
                {scannedUid || "—"}
              </div>

              <div className="mt-5 flex gap-3">
                <input
                  value={cardInput}
                  onChange={(e) => setCardInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleManualScan();
                  }}
                  placeholder="Enter card UID"
                  className="w-full rounded-2xl px-4 py-2.5 text-sm outline-none"
                  style={{
                    background: "rgba(var(--t-border-rgb),0.08)",
                    color: NORD.text,
                    border: "1px solid rgba(var(--t-border-rgb),0.14)",
                  }}
                />
                <Button onClick={handleManualScan}>Scan</Button>
                <Button
                  variant="ghost"
                  onClick={clearScan}
                  disabled={!scannedUid}
                >
                  Clear
                </Button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <MiniStat
                  label="Status"
                  value={
                    uidStatus === "idle"
                      ? "Waiting"
                      : uidStatus === "ready"
                        ? "Ready"
                        : uidStatus === "paired"
                          ? "Paired"
                          : "Verified"
                  }
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="col-span-12 xl:col-span-6">
          <Card title="Selection" className="h-full">
            {!items.length ? (
              <div
                className="rounded-2xl p-6"
                style={{
                  background: "rgba(var(--t-border-rgb),0.08)",
                  border: `1px solid rgba(var(--t-border-rgb),0.10)`,
                  color: NORD.muted,
                }}
              >
                No items available.
              </div>
            ) : (
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(var(--t-border-rgb),0.08)",
                  border: `1px solid rgba(var(--t-border-rgb),0.10)`,
                }}
              >
                <div>
                  <div className="text-sm" style={{ color: NORD.subtle }}>
                    Item
                  </div>
                  <div
                    className="mt-1 text-base font-semibold"
                    style={{ color: NORD.text }}
                  >
                    {selectedItem
                      ? `${selectedItem.code} • ${selectedItem.name}`
                      : "—"}
                  </div>
                  <div className="mt-1 text-sm" style={{ color: NORD.subtle }}>
                    {selectedItem?.location
                      ? `Location: ${selectedItem.location}`
                      : "Location: —"}
                  </div>

                  <div className="mt-3 max-h-56 overflow-auto space-y-3 pr-1">
                    {filteredItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className="w-full rounded-xl px-3 py-3 text-left transition"
                        style={{
                          background:
                            selectedId === item.id
                              ? "rgba(136,192,208,0.18)"
                              : "rgba(var(--t-border-rgb),0.10)",
                          border: `1px solid ${selectedId === item.id ? "rgba(136,192,208,0.32)" : "rgba(var(--t-border-rgb),0.10)"}`,
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div
                              className="text-base font-semibold"
                              style={{ color: NORD.text }}
                            >
                              {item.code}
                            </div>
                            <div
                              className="text-sm truncate"
                              style={{ color: NORD.subtle }}
                            >
                              {item.name}
                            </div>
                            <div
                              className="mt-1 text-xs"
                              style={{ color: NORD.muted }}
                            >
                              {item.location ? `Loc ${item.location}` : "Loc —"}
                            </div>
                          </div>
                          <StatusPill
                            label={
                              item.status === "tagged"
                                ? "Tagged"
                                : item.status === "needs-verify"
                                  ? "Needs verify"
                                  : "Untagged"
                            }
                            tone={toneForItem(item)}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card
        title="Pair + verify"
        subtitle="Pair the scanned card to an item in the shipment, then verify the read"
        right={
          <StatusPill
            label={
              uidStatus === "verified"
                ? "Verified"
                : uidStatus === "paired"
                  ? "Paired"
                  : canPair()
                    ? "Ready"
                    : "Not ready"
            }
            tone={
              uidStatus === "verified"
                ? "verified"
                : uidStatus === "paired"
                  ? "progress"
                  : canPair()
                    ? "progress"
                    : "neutral"
            }
          />
        }
      >
        <div
          className="rounded-2xl p-5"
          style={{
            background: "rgba(var(--t-border-rgb),0.08)",
            border: "1px solid rgba(var(--t-border-rgb),0.10)",
          }}
        >
          {flashBanner ? (
            <div
              className="rounded-2xl px-4 py-3"
              style={{
                background:
                  flashBanner.kind === "ok"
                    ? "rgba(163,190,140,0.16)"
                    : flashBanner.kind === "warn"
                      ? "rgba(235,203,139,0.16)"
                      : "rgba(136,192,208,0.16)",
                border:
                  flashBanner.kind === "ok"
                    ? "1px solid rgba(163,190,140,0.28)"
                    : flashBanner.kind === "warn"
                      ? "1px solid rgba(235,203,139,0.28)"
                      : "1px solid rgba(136,192,208,0.28)",
                marginBottom: "0.75rem",
              }}
            >
              <div
                className="text-base font-semibold"
                style={{ color: NORD.text }}
              >
                {flashBanner.title}
              </div>
              <div className="mt-1 text-sm" style={{ color: NORD.subtle }}>
                {flashBanner.detail}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-12">
              <div className="text-sm" style={{ color: NORD.subtle }}>
                Card UID
              </div>
              <div
                className="mt-1 text-base font-semibold"
                style={{ color: NORD.text }}
              >
                {scannedUid || "—"}
              </div>
            </div>
            <div className="col-span-12">
              <div className="text-sm" style={{ color: NORD.subtle }}>
                Object
              </div>
              <div
                className="mt-1 text-base font-semibold"
                style={{ color: NORD.text }}
              >
                {selectedItem
                  ? `${selectedItem.code} • ${selectedItem.name}`
                  : "—"}
              </div>
            </div>
            <div className="col-span-12 flex gap-3 justify-end">
              <Button onClick={doPair} disabled={!canPair()}>
                Pair
              </Button>
              <Button
                variant="ghost"
                onClick={doVerify}
                disabled={!pairingInfo || uidStatus !== "paired"}
              >
                Verify
              </Button>
            </div>
          </div>

          {pairingInfo ? (
            <div
              className="rounded-2xl px-4 py-3 mt-3"
              style={{
                background:
                  uidStatus === "verified"
                    ? "rgba(163,190,140,0.10)"
                    : "rgba(136,192,208,0.10)",
                border:
                  uidStatus === "verified"
                    ? "1px solid rgba(163,190,140,0.18)"
                    : "1px solid rgba(136,192,208,0.18)",
              }}
            >
              <div className="text-sm" style={{ color: NORD.subtle }}>
                Last pairing
              </div>
              <div className="mt-1 text-sm" style={{ color: NORD.text }}>
                <span style={{ color: NORD.blue }}>{pairingInfo.uid}</span>
                <span style={{ color: NORD.muted }}> → </span>
                <span style={{ color: NORD.purple }}>{pairingInfo.itemId}</span>
                <span style={{ color: NORD.subtle }}>
                  {" "}
                  • {pairingInfo.when}
                </span>
              </div>
            </div>
          ) : null}

          <div className="mt-3 text-sm" style={{ color: NORD.muted }}>
            Pair writes the association (UID ↔ object). Verify checks that the
            reader can re-read the same UID.
          </div>
        </div>
      </Card>
    </div>
  );
}
