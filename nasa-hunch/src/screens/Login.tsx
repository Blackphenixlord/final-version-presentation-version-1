// src/screens/Login.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiUrl } from "../lib/apiBase";
import { getApiBase, setApiBase, clearApiBase } from "../lib/apiBase";
import { useKeyboardWedgeScan } from "../lib/useKeyboardWedgeScan";
import { useTheme } from "../lib/theme";
type UIMode = "crew" | "ground" | "vendor";
type BadgeConfig = { actor: string; uiMode: UIMode };

const css = `
/* ─── Full-screen wrapper: scrollable, gradient bg ─── */
.l-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: var(--t-bg);
  position: relative;
  overflow-y: auto;
}
.l-stars {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.55;
}

/* ─── Card ─── */
.l-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  border-radius: 1.5rem;
  padding: 2.25rem 2rem 1.75rem;
  background: var(--t-surface);
  border: 1px solid rgba(var(--t-border-rgb), 0.10);
  box-shadow:
    0 8px 32px rgba(0,0,0,0.18),
    0 0 0 1px rgba(var(--t-border-rgb), 0.05);
}
@supports (backdrop-filter: blur(1px)) {
  .l-card {
    background: rgba(var(--t-surface-rgb), 0.72);
    backdrop-filter: blur(28px) saturate(1.4);
    -webkit-backdrop-filter: blur(28px) saturate(1.4);
  }
}

/* ─── Scan bar ─── */
.l-scanbar {
  height: 3px;
  border-radius: 2px;
  background: rgba(var(--t-accent-rgb), 0.12);
  overflow: hidden;
  margin-top: 0.45rem;
}
.l-scanbar::after {
  content: '';
  display: block;
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, transparent, var(--t-accent), transparent);
  animation: l-sweep 2s ease-in-out infinite;
}
@keyframes l-sweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }

/* ─── Input ─── */
.l-input {
  width: 100%;
  padding: 0.75rem 0.85rem;
  border-radius: 0.65rem;
  border: 1.5px solid rgba(var(--t-border-rgb), 0.10);
  background: rgba(var(--t-surface2-rgb), 0.5);
  color: var(--t-text);
  font-size: 0.95rem;
  font-family: "SF Mono", "Fira Code", "JetBrains Mono", ui-monospace, monospace;
  letter-spacing: 0.1em;
  outline: none;
  box-shadow: inset 0 1.5px 4px rgba(0,0,0,0.12);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.l-input:focus-visible {
  border-color: rgba(var(--t-accent-rgb), 0.5);
  box-shadow: 0 0 0 3px rgba(var(--t-accent-rgb), 0.12), inset 0 1px 2px rgba(0,0,0,0.06);
}
.l-input::placeholder { color: var(--t-subtle); letter-spacing: 0.04em; }

/* ─── Badge rows ─── */
.l-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.55rem 0.7rem;
  border-radius: 0.5rem;
  border: none;
  background: rgba(var(--t-border-rgb), 0.04);
  cursor: pointer;
  transition: background 0.13s ease, box-shadow 0.13s ease, transform 0.1s ease;
}
.l-badge:hover { background: rgba(var(--t-border-rgb), 0.10); box-shadow: 0 1px 4px rgba(0,0,0,0.14); transform: translateY(-1px); }
.l-badge:active { transform: translateY(0); box-shadow: none; transition: transform 0.07s ease; }
.l-badge + .l-badge { margin-top: 0.3rem; }

/* ─── Buttons ─── */
.l-reg {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border-radius: 0.65rem;
  border: 1px solid rgba(var(--t-blue-rgb), 0.25);
  background: rgba(var(--t-blue-rgb), 0.07);
  color: var(--t-text);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.15s ease, transform 0.1s ease;
}
.l-reg:hover { background: rgba(var(--t-blue-rgb), 0.13); border-color: rgba(var(--t-blue-rgb), 0.4); box-shadow: 0 3px 8px rgba(0,0,0,0.18); transform: translateY(-1px); }
.l-reg:active { transform: translateY(0); box-shadow: none; transition: transform 0.07s ease; }

/* ─── Theme toggle ─── */
.l-theme {
  position: absolute; top: 1.15rem; right: 1.15rem;
  width: 34px; height: 34px;
  border-radius: 50%;
  display: grid; place-items: center;
  background: rgba(var(--t-border-rgb), 0.07);
  border: 1px solid rgba(var(--t-border-rgb), 0.08);
  color: var(--t-muted);
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.15s;
}
.l-theme:hover { background: rgba(var(--t-border-rgb), 0.15); }
`;

export default function Login() {
  const { theme, toggle } = useTheme();
  const [typed, setTyped] = useState("");
  const [err, setErr] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [pendingBadge, setPendingBadge] = useState<string>("");
  const [showConn, setShowConn] = useState(false);
  const [connUrl, setConnUrl] = useState(() => getApiBase());
  const [connStatus, setConnStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const submitTimer = useRef<number | null>(null);
  const typedRef = useRef<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const AUTO_SUBMIT_MS = 120;
  const [utcClock, setUtcClock] = useState(() => new Date().toUTCString().slice(17, 25));
  const ANIM_MS = 700;
  useEffect(() => { typedRef.current = typed; }, [typed]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setUtcClock(new Date().toUTCString().slice(17, 25));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const initStars = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    type Star = { x: number; y: number; r: number; speed: number; opacity: number };
    const stars: Star[] = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3,
      speed: Math.random() * 0.18 + 0.04,
      opacity: Math.random() * 0.6 + 0.2,
    }));
    let raf = 0;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(216,222,233,${s.opacity})`;
        ctx.fill();
        s.y -= s.speed;
        if (s.y < -2) { s.y = canvas.height + 2; s.x = Math.random() * canvas.width; }
      }
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const cleanup = initStars();
    const onResize = () => initStars();
    window.addEventListener("resize", onResize);
    return () => { cleanup?.(); window.removeEventListener("resize", onResize); };
  }, [initStars]);

  const BADGE_FALLBACK: Record<string, BadgeConfig> = useMemo(
    () => ({
      "0003070837": { actor: "crew", uiMode: "crew" },
      "0003104127": { actor: "ground", uiMode: "ground" },
      "0003063286": { actor: "vendor", uiMode: "vendor" },
    }),
    []
  );

  const maxBadgeLen = useMemo(() => Math.max(...Object.keys(BADGE_FALLBACK).map((k) => k.length), 16), [BADGE_FALLBACK]);

  async function applyBadge(tagRaw: string) {
    const tag = String(tagRaw || "").trim();
    if (!tag) return false;
    if (busy) return false;
    const lastBadge = sessionStorage.getItem("lastBadge");
    const lastTime = Number(sessionStorage.getItem("lastBadgeTime") || "0");
    if (lastBadge === tag && Date.now() - lastTime < 3000) {
      setErr("Badge recently used. Wait a moment.");
      return;
    }
    setBusy(true);
    sessionStorage.setItem("lastBadge", tag);
    sessionStorage.setItem("lastBadgeTime", String(Date.now()));
    setPendingBadge(tag);
    setTyped("");

    try {
      const res = await fetch(apiUrl("/auth/badge"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: tag }),
      });
      if (!res.ok) throw new Error("BADGE_NOT_FOUND");
      const badge = (await res.json()) as { actor: string; uiMode: UIMode; badge: string };
      localStorage.setItem("actor", badge.actor);
      localStorage.setItem("uiMode", badge.uiMode);
      let next: string;
      if (badge.uiMode === "vendor") next = "/vendors";
      else if (badge.uiMode === "ground") next = "/ground";
      else if (badge.uiMode === "crew") next = "/crew";
      else {
        const qs = new URLSearchParams(window.location.search);
        qs.set("mode", badge.uiMode);
        next = `${window.location.pathname}?${qs.toString()}`;
      }
      setTimeout(() => { window.history.replaceState(null, "", next); window.location.href = next; }, ANIM_MS);
    } catch {
      const fallback = BADGE_FALLBACK[tag];
      if (fallback) {
        localStorage.setItem("actor", fallback.actor);
        localStorage.setItem("uiMode", fallback.uiMode);
        const next = fallback.uiMode === "vendor" ? "/vendors" : fallback.uiMode === "ground" ? "/ground" : "/crew";
        setTimeout(() => { window.history.replaceState(null, "", next); window.location.href = next; }, ANIM_MS);
        return true;
      }
      setErr(`Unknown badge: ${tag}`);
      setTimeout(() => { setBusy(false); }, ANIM_MS);
      return false;
    }
    return true;
  }

  async function registerBadge(mode: UIMode) {
    if (!pendingBadge) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(apiUrl("/auth/badge/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: pendingBadge, uiMode: mode }),
      });
      if (res.status === 404) {
        const ok = await applyBadge(pendingBadge);
        if (!ok) setErr("Backend update required for badge registration.");
        return;
      }
      if (!res.ok) throw new Error("REGISTER_FAILED");
      await applyBadge(pendingBadge);
    } catch {
      setErr("Unable to register badge.");
      setBusy(false);
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === "input" || tagName === "textarea") return;
      if (e.key === "Enter") {
        if (submitTimer.current) window.clearTimeout(submitTimer.current);
        if (typedRef.current.trim()) applyBadge(typedRef.current);
        return;
      }
      if (e.key.length === 1) {
        setTyped((prev) => {
          const next = prev + e.key;
          if (maxBadgeLen && next.length >= maxBadgeLen) {
            if (submitTimer.current) window.clearTimeout(submitTimer.current);
            submitTimer.current = window.setTimeout(() => applyBadge(next), 20);
          } else {
            if (submitTimer.current) window.clearTimeout(submitTimer.current);
            submitTimer.current = window.setTimeout(() => { if (typedRef.current.trim()) applyBadge(typedRef.current); }, AUTO_SUBMIT_MS);
          }
          return next;
        });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  useEffect(() => () => { if (submitTimer.current) window.clearTimeout(submitTimer.current); }, []);

  useKeyboardWedgeScan({ enabled: true, onScan: (value) => { setTyped(value); applyBadge(value); } });

  const isUnknownBadge = err.startsWith("Unknown badge:");
  const showRegister = Boolean(err) && !isUnknownBadge;

  const badges: { id: string; label: string; color: string }[] = [
    { id: "0003070837", label: "Crew", color: "var(--t-blue)" },
    { id: "0003104127", label: "Ground", color: "var(--t-green)" },
    { id: "0003063286", label: "Vendor", color: "var(--t-accent)" },
  ];

  return (
    <>
      <style>{css}</style>

      <canvas ref={canvasRef} className="l-stars" aria-hidden="true" />
      <div className="l-page">
        <div className="l-card">
          {/* Theme toggle */}
          <button className="l-theme" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? "\u2600" : "\u263E"}
          </button>

          {/* ── Header: logo + title ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 40, height: 40, borderRadius: "10px", flexShrink: 0,
              background: "linear-gradient(145deg, rgba(143,188,187,0.9), rgba(94,129,172,0.55))",
              display: "grid", placeItems: "center",
              boxShadow: "0 0 0 1px rgba(143,188,187,0.25), 0 3px 14px rgba(143,188,187,0.18)",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="rgba(0,0,0,0.7)" />
                <path d="M2 17l10 5 10-5" stroke="rgba(0,0,0,0.5)" strokeWidth="1.6" />
                <path d="M2 12l10 5 10-5" stroke="rgba(0,0,0,0.35)" strokeWidth="1.6" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--t-text)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>DSLM</div>
              <div style={{ fontSize: "0.64rem", color: "var(--t-subtle)", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Dynamic Stowage & Logistics Manager
              </div>
            </div>
          </div>

          {/* ── Mission badge ── */}
          <div style={{ marginTop: "0.85rem", display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.35rem",
              fontSize: "0.65rem", fontWeight: 600,
              background: "rgba(var(--t-blue-rgb),0.08)",
              border: "1px solid rgba(var(--t-blue-rgb),0.18)",
              padding: "0.22rem 0.6rem", borderRadius: "999px",
              color: "var(--t-blue)",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--t-blue)", animation: "pulse-dot 2.5s infinite" }} />
              ISS · Expedition 72 Active
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center",
              fontSize: "0.65rem",
              background: "rgba(var(--t-border-rgb),0.05)",
              border: "1px solid rgba(var(--t-border-rgb),0.08)",
              padding: "0.22rem 0.6rem", borderRadius: "999px",
              color: "var(--t-muted)", fontFamily: "monospace", letterSpacing: "0.04em",
            }}>
              UTC {utcClock}
            </div>
          </div>

          {/* ── Divider ── */}
          <div style={{ height: 1, background: "rgba(var(--t-border-rgb), 0.08)", margin: "1rem 0" }} />

          <input
            className="l-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && typed.trim()) applyBadge(typed); }}
            placeholder="0003XXXXXX"
            aria-label="Badge ID"
            autoComplete="off"
            spellCheck={false}
            autoFocus
          />
          <div className="l-scanbar" />

          {/* Status / errors */}
          <div aria-live="polite" aria-atomic="true">
          {busy && !err && (
            <div style={{ marginTop: "0.85rem", display: "flex", alignItems: "center", gap: "0.45rem" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--t-green)", animation: "pulse-dot 1s infinite" }} />
              <span style={{ fontSize: "0.8rem", color: "var(--t-green)", fontWeight: 600 }}>Authenticating…</span>
            </div>
          )}
          {err && (
            <div role="alert" style={{ marginTop: "0.85rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--t-red)", fontWeight: 600 }}>{err}</div>
              {showRegister && (
                <>
                  <div style={{ fontSize: "0.72rem", color: "var(--t-subtle)" }}>Register this badge as:</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <button className="l-reg" onClick={() => registerBadge("crew")}>Register as Crew</button>
                    <button className="l-reg" onClick={() => registerBadge("ground")}>Register as Ground</button>
                  </div>
                </>
              )}
            </div>
          )}
          </div>

          {/* ── Test Badge IDs ── */}
          <div style={{
            marginTop: "1.5rem", padding: "0.85rem", borderRadius: "0.75rem",
            background: "rgba(var(--t-surface2-rgb), 0.45)",
            border: "1px solid rgba(var(--t-border-rgb), 0.06)",
          }}>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--t-subtle)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: "0.55rem" }}>
              Test Badge IDs
            </div>
            {badges.map((b) => (
              <button key={b.id} className="l-badge" onClick={() => { setTyped(b.id); applyBadge(b.id); }}>
                <span style={{ fontFamily: "'SF Mono','Fira Code',ui-monospace,monospace", fontSize: "0.8rem", color: "var(--t-text)", letterSpacing: "0.08em" }}>{b.id}</span>
                <span style={{ fontSize: "0.65rem", fontWeight: 600, color: b.color, padding: "0.12rem 0.45rem", borderRadius: "999px", background: "rgba(var(--t-border-rgb), 0.07)" }}>{b.label}</span>
              </button>
            ))}
          </div>

          {/* ── Footer ── */}
          <div style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.62rem", color: "var(--t-subtle)", letterSpacing: "0.04em", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.65rem" }}>
            <span>NASA HUNCH</span>
            <button onClick={() => setShowConn((p) => !p)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t-subtle)", fontSize: "0.8rem", padding: "0.15rem", lineHeight: 1, opacity: 0.6 }} aria-label="Connection settings" title="Connection settings">{"⚙"}</button>
          </div>

          {/* ── Connection Settings ── */}
          {showConn && (
            <div style={{
              marginTop: "0.75rem", padding: "0.85rem", borderRadius: "0.75rem",
              background: "rgba(var(--t-surface2-rgb), 0.55)",
              border: "1px solid rgba(var(--t-border-rgb), 0.10)",
            }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--t-subtle)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: "0.55rem" }}>
                Server Connection
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--t-muted)", marginBottom: "0.5rem" }}>
                Set the backend URL when frontend and server are on different machines.
              </div>
              <input
                className="l-input"
                value={connUrl}
                onChange={(e) => { setConnUrl(e.target.value); setConnStatus("idle"); }}
                placeholder="http://192.168.1.50:8080/api"
                aria-label="Server API URL"
                type="url"
                autoComplete="off"
                style={{ fontSize: "0.82rem", marginBottom: "0.5rem" }}
              />
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button className="l-reg" style={{ flex: 1, padding: "0.45rem", fontSize: "0.75rem" }}
                  onClick={async () => {
                    const url = connUrl.trim() || "/api";
                    setConnStatus("testing");
                    try {
                      const p = url.endsWith("/") ? url + "health" : url + "/health";
                      const r = await fetch(p, { signal: AbortSignal.timeout(5000) });
                      if (r.ok) { setApiBase(url); setConnStatus("ok"); }
                      else { setConnStatus("fail"); }
                    } catch { setConnStatus("fail"); }
                  }}
                >
                  {connStatus === "testing" ? "Testing\u2026" : "Test & Save"}
                </button>
                <button className="l-reg" style={{ flex: 0, padding: "0.45rem 0.75rem", fontSize: "0.75rem", opacity: 0.7 }}
                  onClick={() => { clearApiBase(); setConnUrl("/api"); setConnStatus("idle"); }}
                >
                  Reset
                </button>
              </div>
              {connStatus === "ok" && <div style={{ fontSize: "0.72rem", color: "var(--t-green)", fontWeight: 600, marginTop: "0.35rem" }}>Connected — saved.</div>}
              {connStatus === "fail" && <div style={{ fontSize: "0.72rem", color: "var(--t-red)", fontWeight: 600, marginTop: "0.35rem" }}>Could not reach server. Check the URL.</div>}
              <div style={{ fontSize: "0.6rem", color: "var(--t-subtle)", marginTop: "0.35rem" }}>
                Current: <span style={{ fontFamily: "monospace" }}>{getApiBase()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
