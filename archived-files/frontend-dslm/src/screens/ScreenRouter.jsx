import React, { useEffect, useMemo, useState } from "react";

// Local theme tokens (Nord-inspired). If you already have a shared theme file,
// you can swap this for an import and delete this constant.
const NORD = {
  bg: "#2E3440", // nord0
  panel: "#3B4252", // nord1
  panel2: "#434C5E", // nord2
  panel3: "#4C566A", // nord3

  text: "#ECEFF4", // nord6
  subtle: "#D8DEE9", // nord4
  muted: "#A3B1C2", // between nord4/5-ish

  blue: "#88C0D0", // nord8
  blue2: "#81A1C1", // nord9
  blue3: "#5E81AC", // nord10

  green: "#A3BE8C", // nord14
  yellow: "#EBCB8B", // nord13
  red: "#BF616A", // nord11
};

const SCREENS = [
  { key: "receive", label: "Receive" },
  { key: "tag", label: "Tag" },
  { key: "pack", label: "Pack" },
  { key: "load", label: "Stow" },
  { key: "moves", label: "Move" },
];

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Icon({ name }) {
  // Minimal icon set (6-ish) to keep UI clean.
  const common = "w-4 h-4";
  switch (name) {
    case "receive":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path
            d="M4 7h16v10H4V7Z"
            stroke={NORD.muted}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M4 10h16"
            stroke={NORD.muted}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M8 14h8"
            stroke={NORD.blue}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "tag":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path
            d="M20 13l-7 7-9-9V4h7l9 9Z"
            stroke={NORD.muted}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M7.5 7.5h.01"
            stroke={NORD.blue}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      );
    case "pack":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path
            d="M7 8l5-5 5 5"
            stroke={NORD.muted}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 10h14v11H5V10Z"
            stroke={NORD.muted}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M9 14h6"
            stroke={NORD.blue}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "load":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path
            d="M4 6h16v12H4V6Z"
            stroke={NORD.muted}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M8 10h8M8 14h5"
            stroke={NORD.blue}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M12 3v3"
            stroke={NORD.muted}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "moves":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path
            d="M7 7h10M7 17h10"
            stroke={NORD.muted}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M9 9l-2-2 2-2"
            stroke={NORD.blue}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 15l2 2-2 2"
            stroke={NORD.blue}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
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
      className={cn("rounded-2xl p-4 shadow-sm", className)}
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
                    ? "text-lg font-semibold"
                    : "text-sm font-semibold",
                )}
                style={{ color: NORD.text }}
              >
                {title}
              </div>
              {subtitle ? (
                <div className="mt-1 text-sm" style={{ color: NORD.subtle }}>
                  {subtitle}
                </div>
              ) : null}
            </div>
            {right ? <div className="shrink-0">{right}</div> : null}
          </div>
          <div className="mt-4">{children}</div>
        </div>
      ) : (
        <div>{children}</div>
      )}
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
    // Primary actions should be high-contrast on dark backgrounds.
    // Use darker Frost tones for fills so white text remains readable.
    primary: {
      bg: NORD.blue3, // nord10 (darker)
      fg: NORD.text,
      bd: "transparent",
      hover: NORD.blue2, // nord9
    },
    // Secondary actions still filled, but less dominant than primary.
    secondary: {
      bg: NORD.blue2, // nord9
      fg: NORD.text,
      bd: "transparent",
      hover: NORD.blue, // nord8
    },
    ghost: {
      bg: "transparent",
      fg: NORD.muted,
      bd: "rgba(76,86,106,0.45)",
      hover: "rgba(76,86,106,0.22)",
    },
    danger: {
      bg: NORD.red, // nord11
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

function Input({ value, onChange, placeholder, onKeyDown, className }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={cn(
        "w-full rounded-xl px-3 py-2 text-sm outline-none",
        className,
      )}
      style={{
        background: NORD.panel2,
        color: NORD.text,
        border: `1px solid rgba(76,86,106,0.45)`,
      }}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl px-3 py-2 text-sm outline-none"
      style={{
        background: NORD.panel2,
        color: NORD.text,
        border: `1px solid rgba(76,86,106,0.45)`,
      }}
    >
      {options.map((o) => (
        <option
          key={o}
          value={o}
          style={{ background: NORD.bg, color: NORD.text }}
        >
          {o}
        </option>
      ))}
    </select>
  );
}

function MiniMap({ stacks, selected, onPick, highlight }) {
  const stackKeys = Object.keys(stacks);
  const [tab, setTab] = useState(stackKeys[0]);

  const slots = stacks[tab];
  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {stackKeys.map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className="rounded-lg px-2 py-1 text-xs"
            style={{
              background:
                tab === k ? "rgba(136,192,208,0.14)" : "rgba(216,222,233,0.06)",
              color: tab === k ? NORD.blue : NORD.muted,
              border: `1px solid rgba(216,222,233,0.10)`,
            }}
          >
            {k}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {slots.map((s) => {
          const isSel = selected === `${tab}-${s.id}`;
          const isHL = highlight === `${tab}-${s.id}`;
          const bg =
            s.state === "empty"
              ? "rgba(163,190,140,0.08)"
              : s.state === "reserved"
                ? "rgba(235,203,139,0.10)"
                : s.state === "occupied"
                  ? "rgba(129,161,193,0.10)"
                  : "rgba(191,97,106,0.12)";
          const bd = isSel
            ? `1px solid ${NORD.blue}`
            : isHL
              ? `1px solid rgba(136,192,208,0.70)`
              : `1px solid rgba(216,222,233,0.10)`;

          return (
            <button
              key={s.id}
              onClick={() => onPick?.(`${tab}-${s.id}`, s)}
              className={cn(
                "relative rounded-xl p-2 text-left text-xs transition",
                isHL ? "animate-pulse" : "",
              )}
              style={{ background: bg, border: bd, color: NORD.text }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{s.id}</span>
                <span className="text-[10px]" style={{ color: NORD.subtle }}>
                  {s.state}
                </span>
              </div>
              {s.label ? (
                <div
                  className="mt-1 line-clamp-2"
                  style={{ color: NORD.muted }}
                >
                  {s.label}
                </div>
              ) : (
                <div className="mt-1" style={{ color: NORD.subtle }}>
                  —
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-[11px]" style={{ color: NORD.subtle }}>
        Tip: tap a slot to open details in the inspector.
      </div>
    </div>
  );
}

function Inspector({ open, onClose, entity }) {
  const canViewManifest = entity?.kind === "shipment" && entity?.shipmentId;

  function requestOpenManifest() {
    if (!canViewManifest) return;
    // Event bus: ReceiveScreen listens and opens its own manifest modal.
    window.dispatchEvent(
      new CustomEvent("ksc:open-manifest", {
        detail: { shipmentId: entity.shipmentId },
      }),
    );
  }

  return (
    <div
      className={cn(
        "fixed right-0 top-0 z-50 h-full w-[420px] max-w-[90vw] transform transition",
        open ? "translate-x-0" : "translate-x-full",
      )}
      style={{
        background: NORD.panel3,
        borderLeft: `1px solid rgba(236,239,244,0.06)`,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid rgba(236,239,244,0.06)` }}
      >
        <div className="min-w-0">
          <div className="text-base font-semibold" style={{ color: NORD.text }}>
            Inspector
          </div>
        </div>
        <Button className="px-4 py-2" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>

      {!entity ? (
        <div className="p-4 text-base" style={{ color: NORD.muted }}>
          Select a shipment, item, CTB, or slot to view details.
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Header / summary */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "rgba(46,52,64,0.50)",
              border: `1px solid rgba(236,239,244,0.08)`,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div
                  className="text-2xl font-semibold"
                  style={{ color: NORD.text }}
                >
                  {entity.title}
                </div>
                {entity.subtitle ? (
                  <div
                    className="mt-1 text-lg truncate"
                    style={{ color: NORD.muted }}
                  >
                    {entity.subtitle}
                  </div>
                ) : null}
              </div>

              <div className="shrink-0 flex flex-wrap gap-2">
                {(entity.pills || []).slice(0, 2).map((p) => (
                  <StatusPill key={p.label} label={p.label} tone={p.tone} />
                ))}
              </div>
            </div>
          </div>

          {canViewManifest ? (
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(46,52,64,0.38)",
                border: `1px solid rgba(236,239,244,0.06)`,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div
                  className="text-lg font-semibold"
                  style={{ color: NORD.text }}
                >
                  Manifest
                </div>
                <div className="text-base" style={{ color: NORD.subtle }}>
                  {entity.shipmentId}
                </div>
              </div>

              <div className="mt-4">
                <Button
                  className="w-full py-4 text-lg"
                  onClick={requestOpenManifest}
                >
                  View manifest
                </Button>
              </div>
            </div>
          ) : null}

          {/* Details */}
          {entity.details ? (
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(46,52,64,0.38)",
                border: `1px solid rgba(236,239,244,0.06)`,
              }}
            >
              <div
                className="text-lg font-semibold"
                style={{ color: NORD.text }}
              >
                Details
              </div>
              <div className="mt-4 space-y-3">
                {Object.entries(entity.details).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-start justify-between gap-4"
                  >
                    <div className="text-base" style={{ color: NORD.subtle }}>
                      {k}
                    </div>
                    <div
                      className="text-base text-right font-semibold"
                      style={{ color: NORD.text }}
                    >
                      {String(v)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Timeline */}
          {entity.history ? (
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(46,52,64,0.38)",
                border: `1px solid rgba(236,239,244,0.06)`,
              }}
            >
              <div
                className="text-lg font-semibold"
                style={{ color: NORD.text }}
              >
                Timeline
              </div>

              <div className="mt-4 space-y-3">
                {entity.history.map((h, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="mt-2 h-2.5 w-2.5 rounded-full"
                      style={{ background: NORD.blue }}
                    />
                    <div className="min-w-0">
                      <div className="text-base" style={{ color: NORD.text }}>
                        {h.what}
                      </div>
                      <div className="text-sm" style={{ color: NORD.subtle }}>
                        {h.when}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* overlay click area (only when open) */}
      {open ? (
        <div
          onClick={onClose}
          className="fixed inset-0 -z-10"
          style={{
            background: "rgba(0,0,0,0.35)",
            left: "-100vw",
            right: "420px",
          }}
        />
      ) : null}
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
              {/* Header block */}
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

              {/* Lines */}
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

      {/* Click-outside to close */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />
    </div>
  );
}

function useMockData() {
  return useMemo(() => {
    const inbound = [
      {
        id: "SHIP-8841",
        supplier: "Meals Vendor",
        status: "Receiving",
        tone: "progress",
        count: "—",
        priority: "Normal",
      },
      {
        id: "SHIP-8910",
        supplier: "Med Supply",
        status: "Receiving",
        tone: "issue",
        count: "—",
        priority: "High",
      },
      {
        id: "SHIP-8932",
        supplier: "Lab Equipment",
        status: "Receiving",
        tone: "verified",
        count: "—",
        priority: "Normal",
      },
      {
        id: "SHIP-8999",
        supplier: "Hygiene + Water",
        status: "Waiting",
        tone: "waiting",
        count: "—",
        priority: "Normal",
      },
      {
        id: "SHIP-9050",
        supplier: "Spare Parts (Paperwork only)",
        status: "Waiting",
        tone: "neutral",
        count: "—",
        priority: "Normal",
      },
    ];

    const tagQueue = [
      {
        id: "MEAL-0001",
        kind: "Meal",
        label: "Pasta Primavera",
        status: "Untagged",
        tone: "waiting",
      },
      {
        id: "MEAL-0002",
        kind: "Meal",
        label: "Veggie Curry",
        status: "Untagged",
        tone: "waiting",
      },
      {
        id: "BLOB-0001",
        kind: "Blob",
        label: "Meals x4 (Day 1)",
        status: "Needs verify",
        tone: "progress",
      },
      {
        id: "CTB-001",
        kind: "CTB",
        label: "0.05 CTB — Day 1 Meals",
        status: "Untagged",
        tone: "waiting",
      },
    ];

    const sourceMeals = Array.from({ length: 16 }).map((_, i) => ({
      id: `MEAL-${String(i + 1).padStart(4, "0")}`,
      type: ["Breakfast", "Lunch", "Dinner", "Snack"][i % 4],
      name: [
        "Pasta Primavera",
        "Veggie Curry",
        "Teriyaki Bowl",
        "Breakfast Burrito",
      ][i % 4],
      calories: [580, 540, 610, 520][i % 4],
      expiry: "2030-06-01",
    }));

    const stacks = {
      S1: Array.from({ length: 16 }).map((_, i) => ({
        id: `L${i + 1}`,
        state: i < 2 ? "occupied" : i < 4 ? "reserved" : "empty",
        label:
          i === 0
            ? "CTB-001"
            : i === 1
              ? "CTB-002"
              : i === 2
                ? "Reserved: Day 28 equip"
                : i === 3
                  ? "Reserved: med"
                  : "",
      })),
      S2: Array.from({ length: 16 }).map((_, i) => ({
        id: `L${i + 1}`,
        state: i === 7 ? "occupied" : "empty",
        label: i === 7 ? "CTB-SUP-007" : "",
      })),
      S3: Array.from({ length: 16 }).map((_, i) => ({
        id: `L${i + 1}`,
        state: "empty",
        label: "",
      })),
      C1: Array.from({ length: 16 }).map((_, i) => ({
        id: `L${i + 1}`,
        state: i < 1 ? "reserved" : "empty",
        label: i === 0 ? "Reserved: irregular" : "",
      })),
      C2: Array.from({ length: 16 }).map((_, i) => ({
        id: `L${i + 1}`,
        state: "empty",
        label: "",
      })),
    };

    const moveLog = [
      {
        id: "MV-001",
        ctb: "CTB-Meal-015",
        from: "S1-L12",
        to: "S2-L02",
        who: "Riley",
        when: "10:14",
      },
      {
        id: "MV-002",
        ctb: "CTB-Lab-003",
        from: "S2-L08",
        to: "S1-L05",
        who: "Jamie",
        when: "10:19",
      },
      {
        id: "MV-003",
        ctb: "CTB-Supply-007",
        from: "S2-L08",
        to: "S3-L01",
        who: "Manager",
        when: "10:25",
      },
    ];

    return { inbound, tagQueue, sourceMeals, stacks, moveLog };
  }, []);
}

function TopBar({ syncTone }) {
  const dot =
    syncTone === "good"
      ? NORD.green
      : syncTone === "warn"
        ? NORD.yellow
        : NORD.red;

  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{
        background: NORD.bg,
        borderBottom: `1px solid rgba(236,239,244,0.06)`,
      }}
    >
      {/* Left: app + operator context */}
      <div className="flex items-center gap-3">
        <div
          className="rounded-xl px-3 py-2 text-sm font-semibold"
          style={{ background: NORD.panel, color: NORD.text }}
        >
          KSC
        </div>

        <div className="leading-tight">
          <div className="text-sm font-semibold" style={{ color: NORD.text }}>
            Jamie • Operator
          </div>
          <div className="text-sm" style={{ color: NORD.muted }}>
            Dock 2 • Tag Bench A
          </div>
        </div>
      </div>

      {/* Right: sync */}
      <div
        className="flex items-center gap-2 rounded-xl px-4 py-2"
        style={{
          background: NORD.panel,
          border: `1px solid rgba(216,222,233,0.10)`,
        }}
      >
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: dot }}
        />
        <span className="text-sm font-semibold" style={{ color: NORD.muted }}>
          Sync
        </span>
        <span className="text-sm" style={{ color: NORD.subtle }}>
          just now
        </span>
      </div>
    </div>
  );
}

function SideNav({ screen, setScreen }) {
  return (
    <div
      className="h-full w-[220px] shrink-0 px-2.5 py-3 flex flex-col"
      style={{
        background: NORD.bg,
        borderRight: `1px solid rgba(236,239,244,0.06)`,
      }}
    >
      <div className="flex-1 flex flex-col justify-center gap-2">
        {SCREENS.map((s) => {
          const active = screen === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              className={cn(
                "flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition min-h-[56px]",
                active ? "" : "hover:opacity-95",
              )}
              style={{
                background: active ? "rgba(136,192,208,0.12)" : "transparent",
                border: `1px solid ${active ? "rgba(136,192,208,0.22)" : "rgba(216,222,233,0.00)"}`,
              }}
            >
              <span
                className="grid place-items-center rounded-xl p-3"
                style={{
                  background: active
                    ? "rgba(46,52,64,0.35)"
                    : "rgba(216,222,233,0.06)",
                  border: `1px solid rgba(216,222,233,0.10)`,
                }}
              >
                <Icon name={s.key} />
              </span>
              <div className="min-w-0">
                <div
                  className="text-base font-semibold"
                  style={{ color: active ? NORD.text : NORD.muted }}
                >
                  {s.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>
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
