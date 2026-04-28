import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "../lib/apiBase";

const PALETTE = {
  ink: "#1B263B",
  muted: "#415A77",
  accent: "#0B6E8A",
  accentSoft: "#DCEFF4",
  warm: "#C97A40",
  warmSoft: "#F3E1D3",
  moss: "#627C53",
  mossSoft: "#E5EBD9",
  paper: "#F7F4ED",
  panel: "#FFFCF7",
  border: "rgba(27,38,59,0.12)",
};

type WorkflowStep = {
  id: string;
  title: string;
  detail: string;
};

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
  status: string;
};

function Panel({ title, children, tone = "cool" }: { title: string; children: React.ReactNode; tone?: "cool" | "warm" | "moss" }) {
  const tones = {
    cool: { bg: PALETTE.accentSoft, fg: PALETTE.accent },
    warm: { bg: PALETTE.warmSoft, fg: PALETTE.warm },
    moss: { bg: PALETTE.mossSoft, fg: PALETTE.moss },
  } as const;
  const style = tones[tone];

  return (
    <section
      style={{
        background: PALETTE.panel,
        border: `1px solid ${PALETTE.border}`,
        borderRadius: "1.2rem",
        padding: "1rem",
        boxShadow: "0 14px 34px rgba(27,38,59,0.06)",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.55rem",
          padding: "0.35rem 0.75rem",
          borderRadius: "999px",
          background: style.bg,
          color: style.fg,
          fontSize: "0.78rem",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {title}
      </div>
      <div style={{ marginTop: "0.9rem" }}>{children}</div>
    </section>
  );
}

export default function TrifoldBrochureScreen() {
  const [briefing, setBriefing] = useState<OpsBriefing | null>(null);
  const [activeTags, setActiveTags] = useState<ActiveTag[]>([]);

  useEffect(() => {
    async function load() {
      const [briefingRes, activeRes] = await Promise.all([
        fetch(apiUrl("/ops/briefing")),
        fetch(apiUrl("/rfid/active")),
      ]);

      if (briefingRes.ok) setBriefing((await briefingRes.json()) as OpsBriefing);
      if (activeRes.ok) setActiveTags((await activeRes.json()) as ActiveTag[]);
    }

    load().catch(console.error);
  }, []);

  const workflow = briefing?.workflow ?? [];
  const brochureUrl = briefing?.brochureUrl ?? "https://hunch.nasa.gov/dslm-demo";
  const disposedCount = useMemo(() => activeTags.filter((entry) => entry.status === "DISPOSED").length, [activeTags]);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "1.5rem",
        background: "radial-gradient(circle at top left, rgba(11,110,138,0.18), transparent 26%), linear-gradient(180deg, #F8F2E8, #EFE7D8)",
        color: PALETTE.ink,
      }}
    >
      <style>{`
        @media print {
          .trifold-actions {
            display: none !important;
          }
          .trifold-shell {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
          body {
            background: white !important;
          }
        }
        @media (max-width: 1180px) {
          .trifold-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div
        className="trifold-shell"
        style={{
          maxWidth: "1420px",
          margin: "0 auto",
          borderRadius: "1.5rem",
          border: `1px solid ${PALETTE.border}`,
          background: "rgba(255,252,247,0.92)",
          boxShadow: "0 30px 80px rgba(27,38,59,0.12)",
          padding: "1.5rem",
        }}
      >
        <div className="trifold-actions" style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ color: PALETTE.muted, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Printable Route</div>
            <div style={{ color: PALETTE.ink, fontWeight: 700, marginTop: "0.2rem" }}>DSLM Trifold Brief</div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                border: "none",
                borderRadius: "999px",
                padding: "0.8rem 1.1rem",
                background: PALETTE.accent,
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Print / Save PDF
            </button>
            <a
              href="/ground"
              style={{
                display: "inline-flex",
                alignItems: "center",
                borderRadius: "999px",
                padding: "0.8rem 1.1rem",
                border: `1px solid ${PALETTE.border}`,
                color: PALETTE.ink,
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Back To Ground
            </a>
          </div>
        </div>

        <div className="trifold-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "1rem" }}>
          <div style={{ display: "grid", gap: "1rem", alignContent: "start" }}>
            <Panel title="Mission Brief" tone="cool">
              <div style={{ fontSize: "2.2rem", lineHeight: 1, fontWeight: 900, letterSpacing: "-0.04em" }}>DSLM RFID Supply Chain</div>
              <div style={{ marginTop: "0.75rem", color: PALETTE.muted, fontSize: "1rem", lineHeight: 1.55 }}>
                A full demo pathway from vendor release to astronaut use and auto-scanned disposal, built for NASA HUNCH review, Florida collaboration, and virtual walkthroughs.
              </div>
              <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.65rem" }}>
                <div style={{ borderRadius: "1rem", background: PALETTE.accentSoft, padding: "0.8rem" }}>
                  <div style={{ color: PALETTE.accent, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800 }}>Live RFID</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, marginTop: "0.2rem" }}>{activeTags.length}</div>
                </div>
                <div style={{ borderRadius: "1rem", background: PALETTE.warmSoft, padding: "0.8rem" }}>
                  <div style={{ color: PALETTE.warm, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800 }}>Disposed Logged</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, marginTop: "0.2rem" }}>{disposedCount}</div>
                </div>
              </div>
            </Panel>

            <Panel title="Brochure URL" tone="warm">
              <div style={{ fontSize: "1.1rem", fontWeight: 800, wordBreak: "break-word" }}>{brochureUrl}</div>
              <div style={{ marginTop: "0.7rem", color: PALETTE.muted, lineHeight: 1.5 }}>
                Use this link in the brochure, trifold, and command-center presentation so Hayes and IMS teams review the same source of truth.
              </div>
            </Panel>

            <Panel title="CTB Dimensions" tone="moss">
              <div style={{ color: PALETTE.muted, lineHeight: 1.5 }}>{briefing?.ctbDimensions?.summary}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.6rem", marginTop: "0.85rem" }}>
                <div style={{ borderRadius: "1rem", background: PALETTE.mossSoft, padding: "0.75rem" }}>
                  <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: PALETTE.moss, fontWeight: 800 }}>Width</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 900, marginTop: "0.2rem" }}>{briefing?.ctbDimensions?.widthCm ?? 48} cm</div>
                </div>
                <div style={{ borderRadius: "1rem", background: PALETTE.mossSoft, padding: "0.75rem" }}>
                  <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: PALETTE.moss, fontWeight: 800 }}>Depth</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 900, marginTop: "0.2rem" }}>{briefing?.ctbDimensions?.depthCm ?? 40} cm</div>
                </div>
                <div style={{ borderRadius: "1rem", background: PALETTE.mossSoft, padding: "0.75rem" }}>
                  <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: PALETTE.moss, fontWeight: 800 }}>Height</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 900, marginTop: "0.2rem" }}>{briefing?.ctbDimensions?.heightCm ?? 33} cm</div>
                </div>
              </div>
              <div style={{ marginTop: "0.8rem", display: "grid", gap: "0.45rem", color: PALETTE.muted }}>
                {(briefing?.ctbDimensions?.notes ?? []).map((note) => (
                  <div key={note}>{note}</div>
                ))}
              </div>
            </Panel>
          </div>

          <div style={{ display: "grid", gap: "1rem", alignContent: "start" }}>
            <Panel title="Workflow" tone="cool">
              <div style={{ display: "grid", gap: "0.7rem" }}>
                {workflow.map((step, index) => (
                  <div key={step.id} style={{ display: "grid", gridTemplateColumns: "42px 1fr", gap: "0.75rem", alignItems: "start" }}>
                    <div style={{ width: "42px", height: "42px", display: "grid", placeItems: "center", borderRadius: "50%", background: PALETTE.accentSoft, color: PALETTE.accent, fontWeight: 900 }}>
                      {index + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "1rem" }}>{step.title}</div>
                      <div style={{ color: PALETTE.muted, lineHeight: 1.5, marginTop: "0.2rem" }}>{step.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Scanner Placement" tone="warm">
              <div style={{ display: "grid", gap: "0.55rem", color: PALETTE.muted, lineHeight: 1.5 }}>
                {(briefing?.scannerLocations ?? []).map((location) => (
                  <div key={location}>{location}</div>
                ))}
              </div>
            </Panel>

            <Panel title="Devices" tone="moss">
              <div style={{ display: "grid", gap: "0.55rem", color: PALETTE.muted, lineHeight: 1.5 }}>
                {(briefing?.compatibleDevices ?? []).map((device) => (
                  <div key={device}>{device}</div>
                ))}
              </div>
            </Panel>
          </div>

          <div style={{ display: "grid", gap: "1rem", alignContent: "start" }}>
            <Panel title="Launch Loads" tone="warm">
              <div style={{ display: "grid", gap: "0.6rem", color: PALETTE.muted, lineHeight: 1.5 }}>
                {(briefing?.launchLoads ?? []).map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>
            </Panel>

            <Panel title="Review + Demo" tone="cool">
              <div style={{ fontWeight: 800, fontSize: "1rem" }}>{briefing?.floridaReview?.title ?? "IMS supply-chain review"}</div>
              <div style={{ color: PALETTE.muted, lineHeight: 1.5, marginTop: "0.4rem" }}>{briefing?.floridaReview?.detail}</div>
              <div style={{ marginTop: "0.9rem", display: "grid", gap: "0.55rem", color: PALETTE.muted, lineHeight: 1.5 }}>
                {(briefing?.demoPlan ?? []).map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>
            </Panel>

            <Panel title="Why It Matters" tone="moss">
              <div style={{ color: PALETTE.muted, lineHeight: 1.58 }}>
                The project now shows innovative move-style workflows across the website and operations views, makes scanner usage explicit, tracks active RFIDs in real time, and provides a clear briefing artifact for outreach and review.
              </div>

              <div style={{ marginTop: "1rem", display: "grid", gap: "0.65rem" }}>
                <div style={{ fontWeight: 800, fontSize: "0.84rem", textTransform: "uppercase", color: PALETTE.accent }}>Innovational Functions</div>
                {[
                  "Move — relocate any unit between containers, shelves, or locations with full audit trail",
                  "Auto-scan trash — items auto-dispose 1.4 s after crossing the trash-can inlet reader",
                  "Pack — nest items into CTBs with capacity and cycle-count validation",
                  "Stow — slot-grid visualization across 144+ shelf-depth-level positions",
                  "Live RFID tracking — real-time activity feed for ground and virtual participants",
                  "X-400 / X-500 messaging — operational and outreach communication channels",
                ].map((line) => (
                  <div key={line} style={{ color: PALETTE.muted, lineHeight: 1.5, paddingLeft: "0.5rem", borderLeft: `2px solid ${PALETTE.accent}` }}>{line}</div>
                ))}
              </div>

              <div
                style={{
                  marginTop: "1rem",
                  borderRadius: "1rem",
                  padding: "1rem",
                  background: "linear-gradient(135deg, rgba(98,124,83,0.12), rgba(11,110,138,0.10))",
                  border: `1px solid ${PALETTE.border}`,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: "0.84rem", textTransform: "uppercase", color: PALETTE.moss }}>Current visual stand-in</div>
                <div style={{ marginTop: "0.4rem", color: PALETTE.ink, fontWeight: 800, fontSize: "1.05rem" }}>2-D astronaut loading/unloading animation included in-app</div>
                <div style={{ marginTop: "0.35rem", color: PALETTE.muted, lineHeight: 1.5 }}>
                  This supports Hayes' concept now while leaving room to replace it later with a recorded or rendered sequence.
                </div>
              </div>

              <div style={{ marginTop: "1rem", display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
                <a
                  href="/demo"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.65rem 1rem",
                    borderRadius: "999px",
                    background: PALETTE.accent,
                    color: "white",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                  }}
                >
                  Watch Demo Playback
                </a>
                <a
                  href="/ground"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.65rem 1rem",
                    borderRadius: "999px",
                    border: `1px solid ${PALETTE.border}`,
                    color: PALETTE.ink,
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                  }}
                >
                  Open Ground Ops
                </a>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}