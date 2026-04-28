import React from "react";

// Local nav model for SideNav only, used as a fallback.
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

// Minimal fallback theme so this component can render even if theme isn’t passed.
const DEFAULT_NORD = {
  bg: "#2E3440",
  panel: "#3B4252",
  text: "#ECEFF4",
  muted: "#D8DEE9",
  subtle: "#9AA4B2",
  blue: "#88C0D0",
  blue2: "#81A1C1",
  blue3: "#5E81AC",
  green: "#A3BE8C",
  yellow: "#EBCB8B",
  red: "#BF616A",
};

function Icon({ name, NORD }) {
  // Minimal icon set to keep UI clean.
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
    case "stow":
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
    case "move":
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
    case "take":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path
            d="M4 7h16v10H4V7Z"
            stroke={NORD.muted}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M12 11v6"
            stroke={NORD.blue}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M9.5 13.5 12 11l2.5 2.5"
            stroke={NORD.blue}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "return":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path
            d="M4 7h16v10H4V7Z"
            stroke={NORD.muted}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M12 17v-6"
            stroke={NORD.blue}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M14.5 14.5 12 17l-2.5-2.5"
            stroke={NORD.blue}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "dispose":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path
            d="M6 7h12l-1 14H7L6 7Z"
            stroke={NORD.muted}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M9 7V5h6v2"
            stroke={NORD.muted}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M10 11v6M14 11v6"
            stroke={NORD.blue}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

export default function SideNav({ screens, activeKey, onPick, theme }) {
  const NORD = theme ?? DEFAULT_NORD;
  const model = screens && screens.length ? screens : SCREENS;

  return (
    <div
      className="h-full w-[220px] shrink-0 px-2.5 py-3 flex flex-col"
      style={{
        background: NORD.bg,
        borderRight: `1px solid rgba(236,239,244,0.06)`,
      }}
    >
      <div className="flex-1 flex flex-col justify-center gap-2">
        {model.map((s) => {
          const active = activeKey === s.key;
          return (
            <button
              key={s.key}
              onClick={() => onPick?.(s.key)}
              className={cn(
                "flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition min-h-[56px]",
                active ? "" : "hover:opacity-95",
              )}
              style={{
                background: active ? "rgba(136,192,208,0.12)" : "transparent",
                border: `1px solid ${
                  active ? "rgba(136,192,208,0.22)" : "rgba(216,222,233,0.00)"
                }`,
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
                <Icon name={s.key} NORD={NORD} />
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
