import React, { createContext, useContext, useMemo, useState } from "react";

// A small Nord-ish fallback so components still render even if you forget to
// wrap in <ThemeProvider theme={NORD}>.
export const DEFAULT_THEME = {
  bg: "#2E3440",
  panel: "#3B4252",
  panel2: "#434C5E",
  panel3: "#4C566A",
  text: "#ECEFF4",
  subtle: "rgba(236,239,244,0.72)",
  muted: "rgba(236,239,244,0.82)",
  blue: "#88C0D0",
  blue2: "#81A1C1",
  blue3: "#5E81AC",
  green: "#A3BE8C",
  yellow: "#EBCB8B",
  red: "#BF616A",
};

const ThemeContext = createContext(DEFAULT_THEME);

export function ThemeProvider({ theme, children }) {
  return (
    <ThemeContext.Provider value={theme ?? DEFAULT_THEME}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export function Icon({ name, className }) {
  const NORD = useTheme();
  const common = cn("w-4 h-4", className);

  // Minimal icon set (6-ish) to keep UI clean.
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

export function StatusPill({ label, tone = "neutral" }) {
  const NORD = useTheme();

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

export function Card({
  title,
  subtitle,
  children,
  right,
  titleLarge = false,
  className,
  hideHeader = false,
}) {
  const NORD = useTheme();

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

export function Button({
  children,
  variant = "primary",
  onClick,
  disabled,
  className,
}) {
  const NORD = useTheme();

  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition";

  const styles = useMemo(
    () => ({
      // Primary actions should be high-contrast on dark backgrounds.
      // Use darker Frost tones for fills so white text remains readable.
      primary: {
        bg: NORD.blue3,
        fg: NORD.text,
        bd: "transparent",
        hover: NORD.blue2,
      },
      // Secondary actions still filled, but less dominant than primary.
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
    }),
    [NORD],
  );

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

export function Input({ value, onChange, placeholder, onKeyDown, className }) {
  const NORD = useTheme();

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

export function Select({ value, onChange, options }) {
  const NORD = useTheme();

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

export function MiniMap({ stacks, selected, onPick, highlight }) {
  const NORD = useTheme();
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

export function MiniStat({ label, value }) {
  const NORD = useTheme();

  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: "rgba(46,52,64,0.35)",
        border: `1px solid rgba(236,239,244,0.06)`,
      }}
    >
      <div className="text-[11px]" style={{ color: NORD.subtle }}>
        {label}
      </div>
      <div className="mt-1 text-xs font-semibold" style={{ color: NORD.text }}>
        {value}
      </div>
    </div>
  );
}

export function BlobSlot({ label, value, onChange }) {
  const NORD = useTheme();

  return (
    <div
      className="rounded-2xl p-3"
      style={{
        background: "rgba(46,52,64,0.35)",
        border: `1px solid rgba(236,239,244,0.06)`,
      }}
    >
      <div className="text-xs font-semibold" style={{ color: NORD.muted }}>
        {label}
      </div>
      <div className="mt-2">
        <Input
          value={value}
          onChange={onChange}
          placeholder="Scan blob ID (e.g., BLOB-0001)"
        />
      </div>
      <div className="mt-2 text-[11px]" style={{ color: NORD.subtle }}>
        (Mock) Auto-validates metadata + capacity.
      </div>
    </div>
  );
}

export function Stepper({ step }) {
  const NORD = useTheme();

  const steps = [
    { n: 1, label: "Scan" },
    { n: 2, label: "Confirm" },
    { n: 3, label: "Verify" },
  ];

  return (
    <div className="flex items-center gap-3">
      {steps.map((s, idx) => {
        const active = step === s.n;
        const done = step > s.n;

        const bg = done
          ? "rgba(163,190,140,0.18)"
          : active
            ? "rgba(136,192,208,0.18)"
            : "rgba(216,222,233,0.06)";

        const bd = done
          ? `1px solid rgba(163,190,140,0.28)`
          : active
            ? `1px solid rgba(136,192,208,0.28)`
            : `1px solid rgba(216,222,233,0.10)`;

        const fg = done ? NORD.green : active ? NORD.blue : NORD.muted;

        return (
          <React.Fragment key={s.n}>
            <div className="flex items-center gap-2">
              <span
                className="grid h-7 w-7 place-items-center rounded-xl text-xs font-semibold"
                style={{ background: bg, border: bd, color: fg }}
              >
                {s.n}
              </span>
              <span className="text-xs" style={{ color: NORD.muted }}>
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 ? (
              <div
                className="h-px w-10"
                style={{ background: "rgba(216,222,233,0.10)" }}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}
