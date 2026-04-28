import React from "react";

// Local helpers kept intentionally small so Inspector can stay a self-contained component.

const NORD = {
  // Polar Night
  bg: "#2e3440", // nord0
  panel: "#3b4252", // nord1
  panel2: "#434c5e", // nord2
  panel3: "#4c566a", // nord3

  // Snow Storm
  subtle: "#d8dee9", // nord4
  muted: "#e5e9f0", // nord5
  text: "#eceff4", // nord6

  // Frost
  blue: "#88c0d0", // nord8
  blue2: "#81a1c1", // nord9
  blue3: "#5e81ac", // nord10

  // Aurora
  red: "#bf616a", // nord11
  yellow: "#ebcb8b", // nord13
  green: "#a3be8c", // nord14
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
    "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition";

  const styles = {
    // High-contrast fills for dark UI.
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
      bd: "rgba(236,239,244,0.14)",
      hover: "rgba(216,222,233,0.10)",
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
      type="button"
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
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.bd}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} />
      {label}
    </span>
  );
}

export default function Inspector({ open, onClose, entity }) {
  const canViewManifest = entity?.kind === "shipment" && entity?.shipmentId;

  function requestOpenManifest() {
    if (!canViewManifest) return;
    // ReceiveScreen listens for this and opens its manifest modal.
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
      aria-hidden={!open}
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
