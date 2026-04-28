// src/components/TopBar.jsx
import React from "react";

// Fallback theme so the component still renders if `theme` isn't passed.
const DEFAULT_NORD = {
  bg: "#2E3440",
  panel: "#3B4252",
  text: "#ECEFF4",
  muted: "#D8DEE9",
  subtle: "#A3ABB9",
  green: "#A3BE8C",
  yellow: "#EBCB8B",
  red: "#BF616A",
};

export default function TopBar({
  syncTone = "good", // good | warn | bad
  theme,
  appLabel = "KSC",
  operatorName = "Jamie",
  operatorRole = "Operator",
  stationLabel = "Dock 2 • Tag Bench A",
  syncLabel = "Sync",
  syncWhen = "just now",
  onLogout,
  logoutLabel = "Logout",
}) {
  const NORD = theme ?? DEFAULT_NORD;

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
          {appLabel}
        </div>

        <div className="leading-tight">
          <div className="text-sm font-semibold" style={{ color: NORD.text }}>
            {operatorName} • {operatorRole}
          </div>
          <div className="text-sm" style={{ color: NORD.muted }}>
            {stationLabel}
          </div>
        </div>
      </div>

      {/* Right: sync + logout */}
      <div className="flex items-center gap-3">
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
            {syncLabel}
          </span>
          <span className="text-sm" style={{ color: NORD.subtle }}>
            {syncWhen}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onLogout?.()}
          className="rounded-xl px-4 py-2 text-sm font-semibold transition"
          style={{
            background: NORD.panel,
            color: NORD.muted,
            border: `1px solid rgba(216,222,233,0.10)`,
          }}
        >
          {logoutLabel}
        </button>
      </div>
    </div>
  );
}
