import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "../lib/apiBase";

const NORD = {
  bg: "#2E3440",
  panel: "#3B4252",
  panel2: "#434C5E",
  text: "#ECEFF4",
  muted: "#D8DEE9",
  subtle: "#A3ABB9",
  blue: "#88C0D0",
  blue2: "#81A1C1",
  green: "#8CAB78",
  yellow: "#D08770",
  orange: "#D08770",
  red: "#BF616A",
};

type WorkflowStep = { id: string; title: string; detail: string };

type OpsBriefing = {
  brochureUrl?: string;
  workflow?: WorkflowStep[];
  scannerLocations?: string[];
  compatibleDevices?: string[];
  launchLoads?: string[];
  demoPlan?: string[];
  floridaReview?: { title: string; detail: string };
  ctbDimensions?: {
    summary: string;
    widthCm: number;
    depthCm: number;
    heightCm: number;
    notes: string[];
  };
};

type ActiveTag = {
  tagId: string;
  unitId: string;
  name: string;
  location: string;
  zone: string;
  eventType: string;
  status: string;
  detail: string;
  actor: string;
  lastSeen: string;
};

type Message = {
  id: string;
  channel: string;
  title: string;
  body: string;
  author: string;
  priority: string;
  createdAt: string;
};

/** Full-auto demo playback — designed for screen capture / presentations. */
export default function DemoScreen() {
  const [briefing, setBriefing] = useState<OpsBriefing | null>(null);
  const [activeTags, setActiveTags] = useState<ActiveTag[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"workflow" | "rfid" | "messaging" | "specs" | "done">("workflow");

  const workflow = useMemo(() => briefing?.workflow ?? [], [briefing]);
  const STEP_MS = 2800;

  useEffect(() => {
    async function load() {
      const [b, m, a] = await Promise.all([
        fetch(apiUrl("/ops/briefing")),
        fetch(apiUrl("/messages")),
        fetch(apiUrl("/rfid/active")),
      ]);
      if (b.ok) setBriefing((await b.json()) as OpsBriefing);
      if (m.ok) setMessages((await m.json()) as Message[]);
      if (a.ok) setActiveTags((await a.json()) as ActiveTag[]);
    }
    load().catch(console.error);
    const timer = setInterval(() => load().catch(console.error), 4000);
    return () => clearInterval(timer);
  }, []);

  // auto-advance phases
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => {
        const next = prev + 1;
        // advance phase when steps are exhausted
        if (phase === "workflow" && next >= workflow.length) {
          setPhase("rfid");
          return 0;
        }
        if (phase === "rfid" && next >= activeTags.length) {
          setPhase("messaging");
          return 0;
        }
        if (phase === "messaging" && next >= messages.length) {
          setPhase("specs");
          return 0;
        }
        if (phase === "specs" && next >= 4) {
          setPhase("done");
          return 0;
        }
        if (phase === "done" && next >= 3) {
          // loop
          setPhase("workflow");
          return 0;
        }
        return next;
      });
    }, STEP_MS);
    return () => clearInterval(timer);
  }, [phase, workflow.length, activeTags.length, messages.length]);

  const phaseLabel = {
    workflow: "Supply Chain Workflow",
    rfid: "Live RFID Tracking",
    messaging: "X-400 / X-500 Messaging",
    specs: "CTB Specs & Launch Loads",
    done: "DSLM Ready",
  }[phase];

  const ctb = briefing?.ctbDimensions;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at 10% 10%, rgba(136,192,208,0.15), transparent 30%), ${NORD.bg}`,
        color: NORD.text,
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes pulse-ring { 0%,100% { box-shadow: 0 0 0 0 rgba(136,192,208,0.4); } 50% { box-shadow: 0 0 0 18px rgba(136,192,208,0); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes orbit-demo { 0% { transform: translateX(-10px); } 50% { transform: translateX(52px); } 100% { transform: translateX(-10px); } }
        @keyframes crate-demo { 0% { transform: translateX(0); } 50% { transform: translateX(64px); } 100% { transform: translateX(0); } }
        .demo-card { animation: slide-up 0.5s ease both; }
        @media print { .demo-nav { display: none !important; } }
      `}</style>

      {/* top bar */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 1.5rem",
          background: "rgba(59,66,82,0.85)",
          borderBottom: "1px solid rgba(216,222,233,0.08)",
        }}
      >
        <div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>DSLM Demo Playback</div>
          <div style={{ color: NORD.subtle, fontSize: "0.85rem", marginTop: "0.2rem" }}>{phaseLabel}</div>
        </div>
        <div className="demo-nav" style={{ display: "flex", gap: "0.6rem" }}>
          {(["workflow", "rfid", "messaging", "specs"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setPhase(p); setStep(0); }}
              style={{
                padding: "0.55rem 0.9rem",
                borderRadius: "999px",
                border: phase === p ? "1px solid rgba(136,192,208,0.4)" : "1px solid rgba(216,222,233,0.12)",
                background: phase === p ? "rgba(136,192,208,0.16)" : "transparent",
                color: phase === p ? NORD.blue : NORD.muted,
                fontWeight: 700,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {p}
            </button>
          ))}
          <a
            href="/ground"
            style={{
              padding: "0.55rem 0.9rem",
              borderRadius: "999px",
              border: "1px solid rgba(216,222,233,0.12)",
              color: NORD.muted,
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Exit
          </a>
        </div>
      </header>

      {/* main content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", padding: "1.5rem", gap: "1.5rem", overflowY: "auto" }}>
        {/* ---- WORKFLOW PHASE ---- */}
        {phase === "workflow" && (
          <div className="demo-card" key={`wf-${step}`} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: NORD.subtle }}>
              Step {step + 1} of {workflow.length}
            </div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {workflow.map((ws, i) => {
                const active = i === step;
                const done = i < step;
                return (
                  <div
                    key={ws.id}
                    style={{
                      width: "220px",
                      minHeight: "140px",
                      borderRadius: "1.2rem",
                      padding: "1rem",
                      background: active
                        ? "linear-gradient(145deg, rgba(136,192,208,0.2), rgba(94,129,172,0.12))"
                        : done
                          ? "rgba(163,190,140,0.1)"
                          : "rgba(59,66,82,0.6)",
                      border: active
                        ? "1px solid rgba(136,192,208,0.45)"
                        : done
                          ? "1px solid rgba(163,190,140,0.3)"
                          : "1px solid rgba(216,222,233,0.08)",
                      animation: active ? "pulse-ring 2s infinite" : undefined,
                    }}
                  >
                    <div style={{ color: active ? NORD.blue : done ? NORD.green : NORD.subtle, fontSize: "0.75rem", fontWeight: 800 }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div style={{ color: active ? NORD.text : done ? NORD.muted : NORD.subtle, fontWeight: 700, fontSize: "1.05rem", marginTop: "0.4rem" }}>
                      {ws.title}
                    </div>
                    <div style={{ color: NORD.subtle, fontSize: "0.85rem", marginTop: "0.5rem", lineHeight: 1.45 }}>{ws.detail}</div>
                  </div>
                );
              })}
            </div>
            {/* 2-D animation inset */}
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: "1.2rem",
                height: "180px",
                background: "linear-gradient(180deg, rgba(59,66,82,0.7), rgba(46,52,64,0.9))",
                border: "1px solid rgba(216,222,233,0.08)",
              }}
            >
              <div style={{ position: "absolute", right: "2rem", top: "1.5rem", width: "160px", height: "120px", borderRadius: "80px", border: "2px solid rgba(136,192,208,0.35)", background: "rgba(136,192,208,0.06)" }} />
              <div style={{ position: "absolute", right: "3rem", top: "3.4rem", color: NORD.subtle, fontWeight: 700, fontSize: "0.85rem" }}>DSLM Cylinder</div>
              <div style={{ position: "absolute", left: "1.8rem", top: "3.5rem", animation: "orbit-demo 4s ease-in-out infinite" }}>
                <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: NORD.orange, margin: "0 auto" }} />
                <div style={{ width: "10px", height: "36px", background: NORD.blue2, margin: "0.2rem auto 0", borderRadius: "10px" }} />
              </div>
              <div style={{ position: "absolute", left: "5rem", top: "5.5rem", width: "46px", height: "30px", borderRadius: "0.6rem", background: `linear-gradient(135deg, ${NORD.blue2}, ${NORD.blue})`, animation: "crate-demo 4s ease-in-out infinite" }} />
              <div style={{ position: "absolute", left: "1.5rem", bottom: "0.8rem", color: NORD.subtle, fontSize: "0.78rem" }}>
                Astronaut loading / unloading animation — Hayes concept visualization
              </div>
            </div>
          </div>
        )}

        {/* ---- RFID PHASE ---- */}
        {phase === "rfid" && (
          <div className="demo-card" key={`rfid-${step}`} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: NORD.subtle }}>
              Active RFID Tags — {activeTags.length} tracked
            </div>
            <div style={{ display: "grid", gap: "0.8rem" }}>
              {activeTags.map((tag, i) => {
                const highlight = i === step;
                return (
                  <div
                    key={tag.tagId}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.3fr 1fr 1fr 0.8fr",
                      gap: "0.75rem",
                      padding: "1rem",
                      borderRadius: "1rem",
                      background: highlight ? "rgba(136,192,208,0.12)" : "rgba(59,66,82,0.6)",
                      border: highlight ? "1px solid rgba(136,192,208,0.4)" : "1px solid rgba(216,222,233,0.06)",
                      animation: highlight ? "pulse-ring 2s infinite" : undefined,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{tag.name}</div>
                      <div style={{ color: NORD.subtle, fontSize: "0.8rem", marginTop: "0.2rem" }}>{tag.tagId}</div>
                    </div>
                    <div>
                      <div style={{ color: NORD.subtle, fontSize: "0.75rem", textTransform: "uppercase" }}>Location</div>
                      <div style={{ fontWeight: 600, marginTop: "0.2rem" }}>{tag.location || "Unassigned"}</div>
                    </div>
                    <div>
                      <div style={{ color: NORD.subtle, fontSize: "0.75rem", textTransform: "uppercase" }}>Zone</div>
                      <div style={{ fontWeight: 600, marginTop: "0.2rem" }}>{tag.zone}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          padding: "0.3rem 0.65rem",
                          borderRadius: "999px",
                          fontWeight: 700,
                          fontSize: "0.78rem",
                          background: tag.status === "DISPOSED" ? "rgba(191,97,106,0.15)" : "rgba(163,190,140,0.15)",
                          color: tag.status === "DISPOSED" ? NORD.red : NORD.green,
                          border: `1px solid ${tag.status === "DISPOSED" ? "rgba(191,97,106,0.3)" : "rgba(163,190,140,0.3)"}`,
                        }}
                      >
                        <span style={{ width: "0.4rem", height: "0.4rem", borderRadius: "50%", background: "currentColor" }} />
                        {tag.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- MESSAGING PHASE ---- */}
        {phase === "messaging" && (
          <div className="demo-card" key={`msg-${step}`} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: NORD.subtle }}>
              X-400 / X-500 Messages — {messages.length} total
            </div>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {messages.map((msg, i) => {
                const highlight = i === step;
                return (
                  <div
                    key={msg.id}
                    style={{
                      borderRadius: "1rem",
                      padding: "1rem",
                      background: highlight ? "rgba(136,192,208,0.1)" : "rgba(59,66,82,0.55)",
                      border: highlight ? "1px solid rgba(136,192,208,0.35)" : "1px solid rgba(216,222,233,0.06)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{msg.title}</div>
                      <span
                        style={{
                          padding: "0.25rem 0.6rem",
                          borderRadius: "999px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: msg.channel === "X-400" ? "rgba(136,192,208,0.15)" : "rgba(208,135,112,0.15)",
                          color: msg.channel === "X-400" ? NORD.blue : NORD.orange,
                        }}
                      >
                        {msg.channel}
                      </span>
                    </div>
                    <div style={{ color: NORD.muted, marginTop: "0.5rem", lineHeight: 1.5 }}>{msg.body}</div>
                    <div style={{ color: NORD.subtle, fontSize: "0.78rem", marginTop: "0.5rem" }}>
                      {msg.author} · {new Date(msg.createdAt).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- SPECS PHASE ---- */}
        {phase === "specs" && (
          <div className="demo-card" key={`spec-${step}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
            <div
              style={{
                borderRadius: "1.2rem",
                padding: "1.2rem",
                background: "rgba(59,66,82,0.6)",
                border: step === 0 ? "1px solid rgba(136,192,208,0.4)" : "1px solid rgba(216,222,233,0.06)",
              }}
            >
              <div style={{ color: NORD.blue, fontWeight: 800, textTransform: "uppercase", fontSize: "0.78rem" }}>CTB Dimensions</div>
              <div style={{ color: NORD.muted, marginTop: "0.7rem", lineHeight: 1.5 }}>{ctb?.summary}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem", marginTop: "0.9rem" }}>
                {[
                  { label: "Width", val: `${ctb?.widthCm ?? 48} cm` },
                  { label: "Depth", val: `${ctb?.depthCm ?? 40} cm` },
                  { label: "Height", val: `${ctb?.heightCm ?? 33} cm` },
                ].map((dim) => (
                  <div key={dim.label} style={{ borderRadius: "0.8rem", background: "rgba(136,192,208,0.08)", padding: "0.7rem" }}>
                    <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: NORD.subtle, fontWeight: 800 }}>{dim.label}</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 900, marginTop: "0.2rem" }}>{dim.val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                borderRadius: "1.2rem",
                padding: "1.2rem",
                background: "rgba(59,66,82,0.6)",
                border: step === 1 ? "1px solid rgba(208,135,112,0.4)" : "1px solid rgba(216,222,233,0.06)",
              }}
            >
              <div style={{ color: NORD.orange, fontWeight: 800, textTransform: "uppercase", fontSize: "0.78rem" }}>Scanner Placement</div>
              <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.7rem" }}>
                {(briefing?.scannerLocations ?? []).map((loc) => (
                  <div key={loc} style={{ color: NORD.muted, lineHeight: 1.5 }}>{loc}</div>
                ))}
              </div>
            </div>

            <div
              style={{
                borderRadius: "1.2rem",
                padding: "1.2rem",
                background: "rgba(59,66,82,0.6)",
                border: step === 2 ? "1px solid rgba(163,190,140,0.4)" : "1px solid rgba(216,222,233,0.06)",
              }}
            >
              <div style={{ color: NORD.green, fontWeight: 800, textTransform: "uppercase", fontSize: "0.78rem" }}>Compatible Devices</div>
              <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.7rem" }}>
                {(briefing?.compatibleDevices ?? []).map((d) => (
                  <div key={d} style={{ color: NORD.muted, lineHeight: 1.5 }}>{d}</div>
                ))}
              </div>
            </div>

            <div
              style={{
                borderRadius: "1.2rem",
                padding: "1.2rem",
                background: "rgba(59,66,82,0.6)",
                border: step === 3 ? "1px solid rgba(235,203,139,0.4)" : "1px solid rgba(216,222,233,0.06)",
              }}
            >
              <div style={{ color: NORD.yellow, fontWeight: 800, textTransform: "uppercase", fontSize: "0.78rem" }}>Liftoff Effects on Cargo</div>
              <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.7rem" }}>
                {(briefing?.launchLoads ?? []).map((item) => (
                  <div key={item} style={{ color: NORD.muted, lineHeight: 1.5 }}>{item}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---- DONE / LOOP ---- */}
        {phase === "done" && (
          <div className="demo-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "1.2rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.6rem", fontWeight: 900, letterSpacing: "-0.03em" }}>Demo Complete</div>
            <div style={{ color: NORD.muted, maxWidth: "540px", lineHeight: 1.6 }}>
              Full supply-chain traceability from vendor release to auto-scanned disposal.
              Includes live RFID tracking, X-400/X-500 messaging, CTB packing specs, and
              the 2-D astronaut loading animation.
            </div>
            <div style={{ color: NORD.subtle, fontSize: "0.85rem" }}>Restarting in a moment…</div>
          </div>
        )}
      </main>

      {/* progress bar */}
      <div style={{ height: "4px", background: "rgba(216,222,233,0.08)" }}>
        <div
          style={{
            height: "100%",
            background: `linear-gradient(90deg, ${NORD.blue}, ${NORD.green})`,
            transition: "width 0.6s ease",
            width:
              phase === "workflow"
                ? `${((step + 1) / Math.max(workflow.length, 1)) * 100}%`
                : phase === "rfid"
                  ? `${((step + 1) / Math.max(activeTags.length, 1)) * 100}%`
                  : phase === "messaging"
                    ? `${((step + 1) / Math.max(messages.length, 1)) * 100}%`
                    : phase === "specs"
                      ? `${((step + 1) / 4) * 100}%`
                      : "100%",
          }}
        />
      </div>
    </div>
  );
}
