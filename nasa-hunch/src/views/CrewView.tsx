// src/views/CrewView.tsx
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import AddScreen from "../screens/space/AddScreen";
import RemoveScreen from "../screens/space/RemoveScreen";
import TrashScreen from "../screens/space/TrashScreen";
import CrewRequestScreen from "../screens/space/CrewRequestScreen";
import { useTheme } from "../lib/theme";

const ModuleView3D = lazy(() => import("../screens/ModuleView3D"));

type OperationType = "take" | "return" | "dispose" | "request" | "module3d";

function Icon({ name, active }: { name: OperationType; active?: boolean }) {
  const s = { width: "1.15rem", height: "1.15rem" } as const;
  const c1 = active ? "var(--t-blue)" : "var(--t-muted)";
  const c2 = active ? "var(--t-text)" : "var(--t-subtle)";
  switch (name) {
    case "take":
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none">
          <path d="M4 7h16v10H4V7Z" stroke={c2} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 11v6" stroke={c1} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9.5 13.5 12 11l2.5 2.5" stroke={c1} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "return":
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none">
          <path d="M4 7h16v10H4V7Z" stroke={c2} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 17v-6" stroke={c1} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M14.5 14.5 12 17l-2.5-2.5" stroke={c1} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "dispose":
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none">
          <path d="M6 7h12l-1 14H7L6 7Z" stroke={c2} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 7V5h6v2" stroke={c2} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M10 11v6M14 11v6" stroke={c1} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "module3d":
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5Z" stroke={c2} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M2 17l10 5 10-5" stroke={c1} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 12l10 5 10-5" stroke={c1} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "request":
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none">
          <path d="M12 9v4M12 17h.01" stroke={c1} strokeWidth="2" strokeLinecap="round" />
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={c2} strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

export default function CrewView() {
  const { theme, toggle } = useTheme();
  const [activeOp, setActiveOp] = useState<OperationType>("take");
  const [syncWhen, setSyncWhen] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setSyncWhen(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);

  const syncLabel = useMemo(
    () => syncWhen.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
    [syncWhen],
  );

  function logout() {
    localStorage.removeItem("actor");
    localStorage.removeItem("uiMode");
    window.location.href = "/";
  }

  const operations: { id: OperationType; label: string }[] = [
    { id: "take",     label: "Take out"      },
    { id: "return",   label: "Put back"      },
    { id: "dispose",  label: "Throw away"    },
    { id: "module3d", label: "3D Module"     },
    { id: "request",  label: "Low Resources" },
  ];

  const renderScreen = () => {
    switch (activeOp) {
      case "take":
        return <RemoveScreen />;
      case "return":
        return <AddScreen />;
      case "dispose":
        return <TrashScreen />;
      case "request":
        return <CrewRequestScreen />;
      case "module3d":
        return (
          <Suspense fallback={<div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--t-subtle)", fontSize: "0.9rem" }}>Loading 3D Module\u2026</div>}>
            <div style={{ flex: 1, minHeight: 0, height: "100%" }}>
              <ModuleView3D mode="crew" />
            </div>
          </Suspense>
        );
      default:
        return <RemoveScreen />;
    }
  };

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .crew-container { grid-template-columns: 1fr !important; }
          .crew-sidebar {
            flex-direction: row !important;
            gap: 0.25rem;
            padding: 0.75rem 1rem !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(var(--t-border-rgb),0.08);
            overflow-x: auto;
          }
          .crew-sidebar button { white-space: nowrap; }
          .crew-logout { display: none; }
        }
        .crew-nav { transition: background 0.13s ease, color 0.13s ease; }
        .crew-nav:hover { background: rgba(var(--t-blue-rgb),0.10) !important; color: var(--t-text) !important; }
        .crew-nav:active { transform: scale(0.984); transition: transform 0.07s ease; }
        .crew-nav[aria-current="page"] { box-shadow: inset -1px 0 8px rgba(var(--t-blue-rgb),0.06); }
        .crew-nav:focus-visible { outline: 2px solid rgba(var(--t-blue-rgb),0.55); outline-offset: 2px; border-radius: 0 0.6rem 0.6rem 0; }
        .skip-link { position: absolute; top: 0; left: 0; background: var(--t-blue); color: #fff; padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: 600; border-radius: 0 0 0.4rem 0; z-index: 9999; transform: translateY(-100%); transition: transform 0.15s ease; text-decoration: none; }
        .skip-link:focus { transform: translateY(0); }
      `}</style>
      <a href="#crew-main" className="skip-link">Skip to main content</a>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--t-bg)" }}>

        {/* ═══ Top Bar ═══ */}
        <header className="glass" style={{
          display: "flex", alignItems: "center",
          padding: "0 1.25rem",
          height: "54px",
          zIndex: 10,
          gap: "0.75rem",
          borderBottom: "1px solid rgba(var(--t-border-rgb),0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <div style={{
              width: 34, height: 34, borderRadius: "9px", flexShrink: 0,
              background: "linear-gradient(145deg, rgba(136,192,208,0.9), rgba(94,129,172,0.5))",
              display: "grid", placeItems: "center",
              boxShadow: "0 0 0 1px rgba(136,192,208,0.25), 0 2px 10px rgba(136,192,208,0.15)",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="rgba(0,0,0,0.65)"/>
                <path d="M2 17l10 5 10-5" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M2 12l10 5 10-5" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--t-text)", letterSpacing: "-0.01em" }}>
                DSLM <span style={{ color: "var(--t-subtle)", fontWeight: 500, fontSize: "0.76rem" }}>Crew</span>
              </div>
              <div style={{ fontSize: "0.62rem", color: "var(--t-subtle)" }}>ISS Terminal</div>
            </div>
          </div>
          {/* Mission badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.38rem",
            padding: "0.26rem 0.7rem", borderRadius: "999px",
            background: "rgba(var(--t-blue-rgb),0.08)",
            border: "1px solid rgba(var(--t-blue-rgb),0.2)",
            fontSize: "0.67rem", fontWeight: 600, color: "var(--t-blue)",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--t-blue)", animation: "pulse-dot 2.5s infinite" }} />
            Expedition 72 · Day 112
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.35rem",
              fontSize: "0.67rem",
              background: "rgba(var(--t-blue-rgb),0.07)",
              padding: "0.26rem 0.62rem", borderRadius: "999px",
              border: "1px solid rgba(var(--t-blue-rgb),0.14)",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--t-blue)", animation: "pulse-dot 2s infinite" }}/>
              <span style={{ fontWeight: 600, color: "var(--t-blue)" }}>Connected</span>
              <span style={{ color: "var(--t-subtle)" }}>{syncLabel}</span>
            </div>
            <button onClick={toggle} aria-label="Toggle theme" style={{
              width: 30, height: 30, borderRadius: "7px", display: "grid", placeItems: "center",
              background: "rgba(var(--t-border-rgb),0.05)",
              border: "1px solid rgba(var(--t-border-rgb),0.09)",
              color: "var(--t-muted)", cursor: "pointer", fontSize: "0.82rem",
            }}>{theme === "dark" ? "☀" : "☾"}</button>
            <button onClick={logout} style={{
              padding: "0.26rem 0.62rem", borderRadius: "0.45rem",
              border: "1px solid rgba(var(--t-border-rgb),0.1)",
              background: "rgba(var(--t-border-rgb),0.04)",
              color: "var(--t-muted)", cursor: "pointer",
              fontSize: "0.7rem", fontWeight: 600,
            }}>Logout</button>
          </div>
        </header>

        {/* ═══ Body: Sidebar + Content ═══ */}
        <section className="crew-container" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 0, flex: 1, minHeight: 0 }}>

          {/* ─── Sidebar ─── */}
          <nav aria-label="Crew operations" className="crew-sidebar" style={{
            display: "flex", flexDirection: "column", gap: "0.12rem",
            padding: "0.65rem 0.6rem",
            background: "var(--t-sidebar)",
            borderRight: "1px solid rgba(var(--t-border-rgb),0.07)",
            overflowY: "auto",
          }}>
            {/* User role card */}
            <div style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              padding: "0.68rem 0.72rem", marginBottom: "0.35rem",
              background: "rgba(var(--t-blue-rgb),0.06)",
              border: "1px solid rgba(var(--t-blue-rgb),0.12)",
              borderRadius: "0.72rem",
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: "8px", flexShrink: 0,
                background: "linear-gradient(145deg, rgba(136,192,208,0.65), rgba(94,129,172,0.5))",
                display: "grid", placeItems: "center", fontSize: "0.82rem",
              }}>🧑‍🚀</div>
              <div>
                <div style={{ fontSize: "0.79rem", fontWeight: 700, color: "var(--t-text)", lineHeight: 1.2 }}>Crew Member</div>
                <div style={{ fontSize: "0.57rem", fontWeight: 700, color: "var(--t-blue)", textTransform: "uppercase", letterSpacing: "0.07em" }}>ISS Astronaut</div>
              </div>
            </div>
            <div aria-hidden="true" style={{ fontSize: "0.57rem", fontWeight: 700, color: "var(--t-subtle)", textTransform: "uppercase", letterSpacing: "0.12em", padding: "0.52rem 0.72rem 0.22rem" }}>
              Operations
            </div>
            {operations.map((op) => {
              const active = activeOp === op.id;
              return (
                <button
                  className="crew-nav"
                  key={op.id}
                  onClick={() => setActiveOp(op.id)}
                  aria-current={active ? "page" : undefined}
                  aria-label={op.label}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.62rem",
                    padding: "0.52rem 0.72rem", margin: 0,
                    border: "none",
                    background: active ? "rgba(var(--t-blue-rgb),0.13)" : "transparent",
                    color: active ? "var(--t-text)" : "var(--t-muted)",
                    borderRadius: "0.55rem",
                    cursor: "pointer",
                    fontSize: "0.82rem", fontWeight: active ? 600 : 500,
                    textAlign: "left", width: "100%",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{
                    display: "grid", placeItems: "center",
                    width: "26px", height: "26px", borderRadius: "6px", flexShrink: 0,
                    background: active ? "rgba(var(--t-blue-rgb),0.18)" : "rgba(var(--t-border-rgb),0.05)",
                  }}>
                    <Icon name={op.id} active={active} />
                  </span>
                  {op.label}
                </button>
              );
            })}

            {/* footer */}
            <div className="crew-logout" style={{ marginTop: "auto", paddingTop: "0.5rem", borderTop: "1px solid rgba(var(--t-border-rgb),0.06)" }} aria-label="Session actions">
              <button onClick={logout} style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.5rem 0.75rem", width: "100%",
                border: "none", background: "transparent",
                color: "var(--t-subtle)", cursor: "pointer",
                fontSize: "0.78rem", textAlign: "left", borderRadius: "0.5rem",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                Sign out
              </button>
            </div>
          </nav>

          {/* ─── Main Content ─── */}
          <main id="crew-main" tabIndex={-1} aria-label="Crew inventory operations" style={{
            display: "flex", flexDirection: "column",
            overflow: "hidden", background: "var(--t-bg)", minHeight: 0,
            flex: 1,
          }}>
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflowY: "auto", padding: "1rem 1.25rem" }}>
              {renderScreen()}
            </div>
          </main>
        </section>
      </div>
    </>
  );
}
