import React from "react";

// Local Nord-ish palette used throughout this mock UI.
// Duplicated here so ManifestModal is self-contained (same approach as Inspector).
const NORD = {
  bg: "#2E3440",
  panel: "#3B4252",
  panel2: "#434C5E",
  panel3: "#4C566A",

  text: "#ECEFF4",
  subtle: "#A3ACBE",
  muted: "#8F9AAE",

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
    "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition";
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
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.bd}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} />
      {label}
    </span>
  );
}

export default function ManifestModal({ open, onClose, manifest }) {
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
