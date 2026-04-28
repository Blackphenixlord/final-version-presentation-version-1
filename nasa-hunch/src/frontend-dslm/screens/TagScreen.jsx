import React, { useEffect, useMemo, useState } from "react";

// Local (screen-scoped) theme + UI primitives.
// If you later centralize these into shared files, this screen can import them instead.
const NORD = {
  bg: "#2E3440",
  panel: "#3B4252",
  panel2: "#434C5E",
  panel3: "#4C566A",

  text: "#ECEFF4",
  subtle: "rgba(236,239,244,0.70)",
  muted: "rgba(236,239,244,0.55)",

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

function Button({
  children,
  variant = "primary",
  onClick,
  disabled,
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
      title={label}
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
}) {
  return (
    <div
      className={cn("rounded-2xl p-5 shadow-sm", className)}
      style={{
        background: NORD.panel,
        border: `1px solid rgba(76,86,106,0.35)`,
      }}
    >
      {!hideHeader ? (
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div
                className={cn(
                  titleLarge
                    ? "text-xl font-semibold"
                    : "text-lg font-semibold",
                )}
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

function MiniStat({ label, value }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "rgba(46,52,64,0.35)",
        border: `1px solid rgba(236,239,244,0.06)`,
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

function makeInspectorForObject(o, shipment) {
  const shipmentLabel = shipment?.label ?? shipment?.name ?? shipment?.id ?? "";

  return {
    title: o?.id ?? "Object",
    subtitle: `${o?.kind ?? ""} • ${o?.label ?? ""}`,
    pills: [{ label: o?.status ?? "", tone: o?.tone ?? "neutral" }],
    details: {
      ...(shipmentLabel ? { Shipment: shipmentLabel } : {}),
      Kind: o?.kind,
      Label: o?.label,
      "Tag status": o?.status,
    },
    contents: o?.kind === "CTB" ? ["BLOB-0001", "BLOB-0002"] : null,
    history: [{ when: "09:33", what: "Added to shipment" }],
  };
}

function normalizeShipments(data) {
  const rawShipments = data?.shipments;
  if (Array.isArray(rawShipments) && rawShipments.length) {
    return rawShipments.map((s, idx) => {
      const items = s?.items ?? s?.objects ?? s?.tagQueue ?? [];
      return {
        id: s?.id ?? s?.shipmentId ?? `shipment-${idx + 1}`,
        label: s?.label ?? s?.name ?? s?.id ?? `Shipment ${idx + 1}`,
        items: Array.isArray(items) ? items : [],
      };
    });
  }

  const single = data?.shipment ?? data?.currentShipment ?? null;
  if (single) {
    const items = single?.items ?? single?.objects ?? single?.tagQueue ?? [];
    return [
      {
        id: single?.id ?? single?.shipmentId ?? "shipment-1",
        label: single?.label ?? single?.name ?? single?.id ?? "Shipment",
        items: Array.isArray(items) ? items : [],
      },
    ];
  }

  // Back-compat: older mock data uses `tagQueue` at the top level.
  const fallback = data?.tagQueue ?? [];
  if (Array.isArray(fallback) && fallback.length) {
    return [
      {
        id: "shipment-1",
        label: "Shipment",
        items: fallback,
      },
    ];
  }

  return [];
}

function toneForItem(item) {
  const s = String(item?.status ?? "").toLowerCase();
  if (item?.tone) return item.tone;
  if (s.includes("tagged") || s.includes("verified")) return "verified";
  if (s.includes("needs") || s.includes("paired") || s.includes("verify"))
    return "progress";
  if (s.includes("issue") || s.includes("discrep") || s.includes("error"))
    return "issue";
  if (s.includes("untagged") || s.includes("waiting")) return "waiting";
  return "neutral";
}

function TagScreen({ data, onInspect }) {
  const shipments = useMemo(() => normalizeShipments(data), [data]);

  const [selectedShipmentId, setSelectedShipmentId] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const [pairingInfo, setPairingInfo] = useState(null);
  // { uid, itemId, shipmentId, when }

  const [flashBanner, setFlashBanner] = useState(null);
  // { kind: "ok" | "warn" | "info", title, detail }

  const [itemOverrides, setItemOverrides] = useState({});
  // map: itemId -> { status, tone }

  function showBanner(kind, title, detail) {
    setFlashBanner({ kind, title, detail });
    window.clearTimeout(showBanner._t);
    showBanner._t = window.setTimeout(() => setFlashBanner(null), 2600);
  }

  // Initialize shipment selection when data arrives.
  useEffect(() => {
    if (!shipments.length) return;
    if (!selectedShipmentId) {
      setSelectedShipmentId(shipments[0].id);
    }
  }, [shipments, selectedShipmentId]);

  const selectedShipment = useMemo(() => {
    if (!shipments.length) return null;
    return shipments.find((s) => s.id === selectedShipmentId) ?? shipments[0];
  }, [shipments, selectedShipmentId]);

  const shipmentItems = selectedShipment?.items ?? [];

  // Initialize / repair object selection when shipment changes.
  useEffect(() => {
    if (!shipmentItems.length) {
      if (selectedId) setSelectedId("");
      return;
    }

    const stillExists = shipmentItems.some((x) => x.id === selectedId);
    if (!selectedId || !stillExists) {
      setSelectedId(shipmentItems[0].id);
    }
  }, [shipmentItems, selectedId]);

  // Mock scanner state for now.
  const [scannedUid, setScannedUid] = useState("");
  const [uidStatus, setUidStatus] = useState("idle"); // idle | ready | paired | verified

  const selectedObj = useMemo(() => {
    if (!shipmentItems.length) return null;
    const base =
      shipmentItems.find((x) => x.id === selectedId) ?? shipmentItems[0];
    const ov = itemOverrides?.[base?.id];
    return ov ? { ...base, ...ov } : base;
  }, [shipmentItems, selectedId, itemOverrides]);

  function openSelected() {
    if (!selectedObj) return;
    onInspect?.(makeInspectorForObject(selectedObj, selectedShipment));
  }

  // --- Mock actions (no backend yet) ---
  function mockScan() {
    // Fake UID for now. In the real app, the reader will push this.
    const uid = `RFID-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
    setScannedUid(uid);
    setUidStatus("ready");
  }

  function clearScan() {
    setScannedUid("");
    setUidStatus("idle");
  }

  function canPair() {
    return Boolean(scannedUid) && Boolean(selectedObj) && uidStatus === "ready";
  }

  function doPair() {
    if (!scannedUid || !selectedObj || uidStatus !== "ready") {
      showBanner(
        "warn",
        "Missing selection",
        "Scan a card and pick an item first.",
      );
      return;
    }

    const when = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setPairingInfo({
      uid: scannedUid,
      itemId: selectedObj.id,
      shipmentId: selectedShipment?.id ?? null,
      when,
    });

    setUidStatus("paired");

    // Optional: mark the item as paired in UI until verify completes.
    setItemOverrides((prev) => ({
      ...prev,
      [selectedObj.id]: { status: "Paired", tone: "progress" },
    }));

    showBanner("ok", "Paired", `${scannedUid} → ${selectedObj.id}`);
  }

  function doVerify() {
    if (!pairingInfo || uidStatus !== "paired") {
      showBanner("warn", "Nothing to verify", "Pair a card first.");
      return;
    }

    const ok = !!scannedUid && scannedUid === pairingInfo.uid;

    if (!ok) {
      showBanner(
        "warn",
        "Verify failed",
        `Expected ${pairingInfo.uid}, but reader shows ${scannedUid || "—"}.`,
      );
      return;
    }

    setItemOverrides((prev) => ({
      ...prev,
      [pairingInfo.itemId]: { status: "Tagged", tone: "verified" },
    }));

    setUidStatus("verified");
    showBanner("ok", "Verified", `${pairingInfo.uid} confirmed`);
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
      <ScreenHeader title="Tag" />

      {/* TOP: two square-ish cards */}
      <div className="grid grid-cols-12 gap-4">
        {/* RFID CARD */}
        <div className="col-span-12 xl:col-span-6">
          <Card
            title="RFID card"
            right={<StatusPill label={uidPill.label} tone={uidPill.tone} />}
            className="h-full"
          >
            <div
              className="rounded-2xl p-5"
              style={{
                background: NORD.panel2,
                border: `1px solid rgba(216,222,233,0.10)`,
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
                <Button onClick={mockScan}>Scan</Button>
                <Button
                  variant="ghost"
                  onClick={clearScan}
                  disabled={!scannedUid}
                >
                  Clear
                </Button>
              </div>

              {/* Bottom stats */}
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

        {/* SELECTION */}
        <div className="col-span-12 xl:col-span-6">
          <Card title="Selection" className="h-full">
            {!shipments.length ? (
              <div
                className="rounded-2xl p-6"
                style={{
                  background: NORD.panel2,
                  border: `1px solid rgba(216,222,233,0.10)`,
                  color: NORD.muted,
                }}
              >
                No shipments available.
              </div>
            ) : (
              <div
                className="rounded-2xl p-5"
                style={{
                  background: NORD.panel2,
                  border: `1px solid rgba(216,222,233,0.10)`,
                }}
              >
                {/* Shipment */}
                <div>
                  <div className="text-sm" style={{ color: NORD.subtle }}>
                    Shipment
                  </div>
                  <div
                    className="mt-1 text-lg font-semibold"
                    style={{ color: NORD.text }}
                  >
                    {selectedShipment?.label ?? selectedShipment?.id ?? "—"}
                  </div>

                  <div className="mt-3">
                    <select
                      value={
                        selectedShipmentId ? String(selectedShipmentId) : ""
                      }
                      onChange={(e) => {
                        const nextKey = e.target.value;
                        const next = shipments.find(
                          (s) => String(s.id) === nextKey,
                        );
                        if (!next) return;
                        setSelectedShipmentId(next.id);
                        setSelectedId(next.items?.[0]?.id ?? "");
                      }}
                      disabled={shipments.length <= 1}
                      className="w-full rounded-2xl px-4 py-3 text-base font-semibold"
                      style={{
                        background: NORD.panel3,
                        border: `1px solid rgba(216,222,233,0.10)`,
                        color: NORD.text,
                      }}
                    >
                      {shipments.map((s) => (
                        <option key={s.id} value={String(s.id)}>
                          {s.label ?? s.id}
                        </option>
                      ))}
                    </select>
                    {shipments.length <= 1 ? (
                      <div
                        className="mt-2 text-sm"
                        style={{ color: NORD.muted }}
                      >
                        Only one shipment loaded.
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Item */}
                <div className="mt-5">
                  <div className="text-sm" style={{ color: NORD.subtle }}>
                    Item
                  </div>
                  <div
                    className="mt-1 text-lg font-semibold"
                    style={{ color: NORD.text }}
                  >
                    {selectedObj
                      ? `${selectedObj.id} • ${selectedObj.kind}`
                      : "—"}
                  </div>

                  {!shipmentItems.length ? (
                    <div className="mt-3 text-sm" style={{ color: NORD.muted }}>
                      No items in this shipment.
                    </div>
                  ) : (
                    <div className="mt-3 max-h-56 overflow-auto space-y-3 pr-1">
                      {shipmentItems.map((x) => {
                        const item = itemOverrides?.[x.id]
                          ? { ...x, ...itemOverrides[x.id] }
                          : x;
                        const tone = toneForItem(item);

                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedId(item.id)}
                            className={cn(
                              "w-full rounded-2xl px-4 py-3 text-left transition",
                              selectedId === item.id ? "" : "hover:opacity-95",
                            )}
                            style={{
                              background:
                                selectedId === item.id
                                  ? "rgba(136,192,208,0.22)"
                                  : NORD.panel3,
                              border:
                                selectedId === item.id
                                  ? "1px solid rgba(136,192,208,0.45)"
                                  : `1px solid rgba(216,222,233,0.10)`,
                              boxShadow:
                                selectedId === item.id
                                  ? "0 0 0 1px rgba(136,192,208,0.20) inset"
                                  : "none",
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div
                                  className="text-lg font-semibold truncate"
                                  style={{ color: NORD.text }}
                                >
                                  {item.id}
                                </div>
                                <div
                                  className="text-sm truncate"
                                  style={{ color: NORD.subtle }}
                                >
                                  {item.kind} • {item.label}
                                </div>
                              </div>

                              {item.status ? (
                                <div className="shrink-0">
                                  <StatusPill label={item.status} tone={tone} />
                                </div>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* BOTTOM: long skinny-ish card */}
      <Card
        title="Pair + verify"
        subtitle="Pair the scanned card to an item in the shipment, then verify the read"
        right={
          <div className="flex gap-2">
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
          </div>
        }
      >
        <div
          className="rounded-2xl p-5"
          style={{
            background: NORD.panel2,
            border: `1px solid rgba(216,222,233,0.10)`,
          }}
        >
          {flashBanner ? (
            <div
              className="mb-4 rounded-2xl px-4 py-4"
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
            <div className="col-span-12 md:col-span-4">
              <div className="text-sm" style={{ color: NORD.subtle }}>
                Card UID
              </div>
              <div
                className="mt-1 text-lg font-semibold"
                style={{ color: NORD.text }}
              >
                {scannedUid || "—"}
              </div>
            </div>

            <div className="col-span-12 md:col-span-5">
              <div className="text-sm" style={{ color: NORD.subtle }}>
                Object
              </div>
              <div
                className="mt-1 text-lg font-semibold truncate"
                style={{ color: NORD.text }}
              >
                {selectedObj ? `${selectedObj.id} • ${selectedObj.kind}` : "—"}
              </div>
            </div>

            <div className="col-span-12 md:col-span-3 flex gap-3 md:justify-end">
              <Button
                className="px-5 py-3"
                onClick={doPair}
                disabled={!canPair()}
              >
                Pair
              </Button>
              <Button
                className="px-5 py-3"
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
              className="mt-4 rounded-2xl px-4 py-3"
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

          <div className="mt-4 text-sm" style={{ color: NORD.muted }}>
            Pair writes the association (UID ↔ object). Verify checks that the
            reader can re-read the same UID.
          </div>
        </div>
      </Card>
    </div>
  );
}
export default TagScreen;
