import { useState, type ReactNode } from "react";
import { apiUrl } from "../lib/apiBase";

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
      onClick={onClick}
      disabled={disabled}
      className={
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-base font-medium transition hover-lift " +
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

function Card({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-5 shadow-sm animate-fade-up ${className ?? ""}`}
      style={{
        background: "rgba(var(--t-border-rgb),0.06)",
        border: `1px solid rgba(var(--t-border-rgb),0.14)`,
      }}
    >
      {title ? (
        <div className="text-base font-semibold" style={{ color: NORD.text }}>
          {title}
        </div>
      ) : null}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  onKeyDown,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className="w-full rounded-2xl px-4 py-3 text-lg outline-none"
      style={{
        background: "rgba(var(--t-border-rgb),0.08)",
        color: NORD.text,
        border: `1px solid rgba(var(--t-border-rgb),0.25)`,
      }}
    />
  );
}

export default function MoveScreen() {
  const [fromShelf, setFromShelf] = useState("");
  const [toShelf, setToShelf] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [moveStatus, setMoveStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function handleNext() {
    if (step === 1 && fromShelf.trim()) setStep(2);
    else if (step === 2 && toShelf.trim()) setStep(3);
  }

  function handleBack() {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  }

  function handleReset() {
    setFromShelf("");
    setToShelf("");
    setStep(1);
    setMoveStatus(null);
  }

  function handleExecuteMove() {
    if (!fromShelf.trim() || !toShelf.trim()) return;
    setMoveStatus(null);
    fetch(apiUrl("/moves"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromContainer: fromShelf.trim(),
        toContainer: toShelf.trim(),
        reason: "Relocation",
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("MOVE_FAILED");
        return r.json();
      })
      .then(() => {
        setMoveStatus({ type: "success", msg: `Moved from ${fromShelf.trim()} → ${toShelf.trim()}` });
        setFromShelf("");
        setToShelf("");
        setStep(1);
      })
      .catch(() => {
        setMoveStatus({ type: "error", msg: "Move failed — check locations and try again" });
      });
  }

  const stepLabels = ["From", "To", "Confirm"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", padding: "1rem", maxWidth: "640px", margin: "0 auto" }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.15rem", fontWeight: 700, color: NORD.text }}>Move Items</div>
        <div style={{ fontSize: "0.82rem", color: NORD.subtle, marginTop: "0.2rem" }}>Relocate items from one shelf to another</div>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {stepLabels.map((label, i) => {
          const num = i + 1;
          const isCurrent = num === step;
          const isDone = num < step;
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: i < 2 ? 1 : undefined }}>
              <div style={{
                width: "1.75rem", height: "1.75rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 700,
                background: isDone ? NORD.green : isCurrent ? NORD.blue : "rgba(var(--t-border-rgb),0.12)",
                color: isDone || isCurrent ? "#fff" : NORD.subtle,
                transition: "all 0.2s",
              }}>
                {isDone ? "✓" : num}
              </div>
              <span style={{ fontSize: "0.78rem", fontWeight: isCurrent ? 700 : 500, color: isCurrent ? NORD.text : NORD.subtle }}>{label}</span>
              {i < 2 && <div style={{ flex: 1, height: "2px", background: isDone ? NORD.green : "rgba(var(--t-border-rgb),0.15)", borderRadius: "1px", transition: "background 0.2s" }} />}
            </div>
          );
        })}
      </div>

      {/* Status message */}
      {moveStatus && (
        <div className="rounded-xl px-4 py-3" style={{
          background: moveStatus.type === "success" ? "rgba(163,190,140,0.18)" : "rgba(191,97,106,0.18)",
          border: `1px solid ${moveStatus.type === "success" ? "rgba(163,190,140,0.45)" : "rgba(191,97,106,0.45)"}`,
        }}>
          <div style={{ fontSize: "0.88rem", color: NORD.text }}>{moveStatus.msg}</div>
        </div>
      )}

      {/* Step 1: From shelf */}
      {step === 1 && (
        <Card title="From Shelf">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ fontSize: "0.82rem", color: NORD.subtle }}>Scan or type the source shelf location</div>
            <Input value={fromShelf} onChange={setFromShelf} placeholder="e.g. S1-D2-L3" onKeyDown={(e) => { if (e.key === "Enter") handleNext(); }} />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={handleNext} disabled={!fromShelf.trim()}>Next →</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: To shelf */}
      {step === 2 && (
        <Card title="To Shelf">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ fontSize: "0.82rem", color: NORD.subtle }}>
              Moving from <strong style={{ color: NORD.blue }}>{fromShelf}</strong> — enter destination shelf
            </div>
            <Input value={toShelf} onChange={setToShelf} placeholder="e.g. S2-D1-L5" onKeyDown={(e) => { if (e.key === "Enter") handleNext(); }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button variant="ghost" onClick={handleBack}>← Back</Button>
              <Button onClick={handleNext} disabled={!toShelf.trim()}>Next →</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <Card title="Confirm Move">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "1.25rem",
              padding: "1.5rem", borderRadius: "0.75rem",
              background: "rgba(var(--t-border-rgb),0.06)", border: "1px solid rgba(var(--t-border-rgb),0.12)",
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: NORD.subtle, textTransform: "uppercase", letterSpacing: "0.04em" }}>From</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: NORD.blue, marginTop: "0.35rem", fontFamily: "monospace" }}>{fromShelf}</div>
              </div>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke={NORD.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: NORD.subtle, textTransform: "uppercase", letterSpacing: "0.04em" }}>To</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: NORD.green, marginTop: "0.35rem", fontFamily: "monospace" }}>{toShelf}</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button variant="ghost" onClick={handleBack}>← Back</Button>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button variant="ghost" onClick={handleReset}>Start Over</Button>
                <Button onClick={handleExecuteMove}>Confirm Move</Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
