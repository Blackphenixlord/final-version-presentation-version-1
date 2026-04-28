// src/views/GroundView.tsx
import { lazy, Suspense, useEffect, useMemo, useState } from "react";

import ReceiveScreen from "../screens/ReceiveScreen";
import TagScreen from "../screens/TagScreen";
import PackScreen from "../screens/PackScreen";
import MoveScreen from "../screens/MoveScreen";
const ModuleView3D = lazy(() => import("../screens/ModuleView3D"));
import { apiUrl } from "../lib/apiBase";
import { useTheme } from "../lib/theme";

type OperationType = "dashboard" | "orders" | "receive" | "tag" | "pack" | "move" | "requests" | "module3d";

// Theme-aware tokens — resolved via CSS custom properties
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
};

function Icon({ name, active }: { name: OperationType; active?: boolean }) {
  const s = { width: "1.15rem", height: "1.15rem" } as const;
  const c1 = active ? "var(--t-green)" : "var(--t-muted)";
  const c2 = active ? "var(--t-text)" : "var(--t-subtle)";
  switch (name) {
    case "dashboard":
      return (<svg style={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke={c2} strokeWidth="1.8"/><rect x="14" y="3" width="7" height="4" rx="1.5" stroke={c1} strokeWidth="1.8"/><rect x="14" y="11" width="7" height="10" rx="1.5" stroke={c2} strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke={c1} strokeWidth="1.8"/></svg>);
    case "orders":
      return (<svg style={s} viewBox="0 0 24 24" fill="none"><rect x="5" y="3" width="14" height="18" rx="2" stroke={c2} strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 8h6M9 12h6M9 16h4" stroke={c1} strokeWidth="1.8" strokeLinecap="round"/></svg>);
    case "receive":
      return (<svg style={s} viewBox="0 0 24 24" fill="none"><path d="M4 7h16v10H4V7Z" stroke={c2} strokeWidth="1.8" strokeLinejoin="round"/><path d="M4 10h16" stroke={c2} strokeWidth="1.8" strokeLinecap="round"/><path d="M8 14h8" stroke={c1} strokeWidth="1.8" strokeLinecap="round"/></svg>);
    case "tag":
      return (<svg style={s} viewBox="0 0 24 24" fill="none"><path d="M20 13l-7 7-9-9V4h7l9 9Z" stroke={c2} strokeWidth="1.8" strokeLinejoin="round"/><path d="M7.5 7.5h.01" stroke={c1} strokeWidth="4" strokeLinecap="round"/></svg>);
    case "pack":
      return (<svg style={s} viewBox="0 0 24 24" fill="none"><path d="M7 8l5-5 5 5" stroke={c2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 10h14v11H5V10Z" stroke={c2} strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 14h6" stroke={c1} strokeWidth="1.8" strokeLinecap="round"/></svg>);
    case "move":
      return (<svg style={s} viewBox="0 0 24 24" fill="none"><path d="M7 7h10M7 17h10" stroke={c2} strokeWidth="1.8" strokeLinecap="round"/><path d="M9 9l-2-2 2-2" stroke={c1} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 15l2 2-2 2" stroke={c1} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>);
    case "module3d":
      return (<svg style={s} viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke={c1} strokeWidth="1.5" strokeLinejoin="round"/><path d="M2 17l10 5 10-5" stroke={c2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12l10 5 10-5" stroke={c2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);
    case "requests":
      return (<svg style={s} viewBox="0 0 24 24" fill="none"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke={c2} strokeWidth="1.8"/><path d="M12 8v4l3 3" stroke={c1} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>);
    default: return null;
  }
}

/* ── Live RFID + Messages ────────── */

type RfidEntry = { tagId: string; name: string; location: string; zone: string; status: string; eventType: string; detail: string; when: string; actor: string };
type Message = { id: string; channel: string; title: string; body: string; author: string; priority: string; createdAt: string };
type LogEntry = { type: string; unitId?: string; payload?: Record<string, unknown>; when: string };

function evColor(type: string): string {
  switch (type) {
    case "STOW": return NORD.green;
    case "PACK": case "UNPACK": return NORD.blue;
    case "MOVE": return NORD.blue2;
    case "REMOVE": case "RETURN": return NORD.yellow;
    case "DISPOSE": return NORD.red;
    default: return NORD.subtle;
  }
}

function evLabel(type: string): string {
  switch (type) {
    case "STOW": return "Stowed";
    case "PACK": return "Packed";
    case "UNPACK": return "Unpacked";
    case "MOVE": return "Moved";
    case "REMOVE": return "Removed";
    case "RETURN": return "Returned";
    case "DISPOSE": return "Disposed";
    case "RECEIVE_COUNT": return "Received";
    default: return type;
  }
}

function GroundDashboard() {
  const [rfidFeed, setRfidFeed] = useState<RfidEntry[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activityLog, setActivityLog] = useState<LogEntry[]>([]);

  useEffect(() => {
    let live = true;
    function poll() {
      fetch(apiUrl("/rfid/active")).then(r => r.ok ? r.json() : []).then(d => { if (live && Array.isArray(d)) setRfidFeed(d); }).catch(() => {});
      fetch(apiUrl("/messages")).then(r => r.ok ? r.json() : []).then(d => { if (live && Array.isArray(d)) setMessages(d); }).catch(() => {});
      fetch(apiUrl("/logs")).then(r => r.ok ? r.json() : []).then(d => { if (live && Array.isArray(d)) setActivityLog(d); }).catch(() => {});
    }
    poll();
    const id = window.setInterval(poll, 4000);
    return () => { live = false; window.clearInterval(id); };
  }, []);

  const statusColor = (s: string) => {
    if (["ACTIVE", "TAGGED"].includes(s)) return NORD.green;
    if (["DISPOSED"].includes(s)) return NORD.red;
    if (["NEEDS_VERIFY"].includes(s)) return NORD.yellow;
    return NORD.subtle;
  };

  const channelColor = (ch: string) => {
    if (ch === "X-400") return NORD.blue;
    if (ch === "X-500") return NORD.yellow;
    return NORD.subtle;
  };

  return (
    <div style={{ padding: "0.25rem 0.25rem", display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto", height: "100%" }}>

      {/* ── Stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", flexShrink: 0 }}>
        {([
          { label: "Active Tags",   value: rfidFeed.length,                                            accent: NORD.blue,   accentRgb: "var(--t-blue-rgb)"   },
          { label: "Needs Verify",  value: rfidFeed.filter(t => t.status === "NEEDS_VERIFY").length,   accent: NORD.yellow, accentRgb: "var(--t-accent-rgb)" },
          { label: "Disposed",      value: rfidFeed.filter(t => t.status === "DISPOSED").length,       accent: NORD.red,    accentRgb: "var(--t-red-rgb)"    },
          { label: "Messages",      value: messages.length,                                            accent: NORD.blue,   accentRgb: "var(--t-blue-rgb)"   },
        ] as { label: string; value: number; accent: string; accentRgb: string }[]).map((s) => (
          <div key={s.label} style={{
            background: NORD.panel, border: "1px solid rgba(var(--t-border-rgb),0.08)",
            borderRadius: "0.9rem", padding: "0.85rem 0.95rem",
            display: "flex", flexDirection: "column", gap: "0.55rem",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${s.accent}, transparent)` }} />
            <div style={{ fontSize: "0.6rem", fontWeight: 700, color: NORD.subtle, textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: NORD.text, letterSpacing: "-0.04em", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: "0.62rem", padding: "0.07rem 0.3rem", borderRadius: "4px", background: `rgba(${s.accentRgb},0.10)`, color: s.accent, fontWeight: 600, display: "inline-block", alignSelf: "flex-start" }}>
              {s.label === "Active Tags" ? "Live" : s.label === "Messages" ? "total" : s.value === 0 ? "clear" : "action"}
            </div>
          </div>
        ))}
      </div>

      {/* ── Three-column: Live RFID + History + Messages ────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.85rem", minHeight: 0, flex: 1 }}>
        {/* Live RFID Activity Feed */}
        <div style={{ background: NORD.panel, borderRadius: "0.95rem", border: "1px solid rgba(var(--t-border-rgb),0.07)", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.78rem 0.95rem", borderBottom: "1px solid rgba(var(--t-border-rgb),0.06)" }}>
            <div style={{ fontSize: "0.74rem", fontWeight: 700, color: NORD.text }}>Live RFID Activity</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.32rem" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: NORD.green, display: "inline-block", animation: "soft-pulse 2s infinite" }} />
              <span style={{ fontSize: "0.65rem", color: NORD.green, fontWeight: 600 }}>Live</span>
              <span style={{ fontSize: "0.63rem", color: NORD.muted }}>· {rfidFeed.length} tags</span>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0.45rem", display: "flex", flexDirection: "column", gap: "0.28rem" }}>
            {rfidFeed.length === 0 && (
              <div style={{ textAlign: "center", padding: "2rem 1rem", color: NORD.subtle, fontSize: "0.82rem" }}>
                No active RFID events yet. Scan items to see them here in real time.
              </div>
            )}
            {rfidFeed.slice(0, 50).map((tag, i) => (
              <div key={`${tag.tagId}-${i}`} style={{ display: "flex", alignItems: "center", gap: "0.58rem", padding: "0.5rem 0.62rem", background: NORD.panel2, borderRadius: "0.55rem", border: "1px solid rgba(var(--t-border-rgb),0.04)" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: statusColor(tag.status), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.38rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.77rem", color: NORD.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tag.name || tag.tagId}</span>
                    <span style={{ fontSize: "0.58rem", padding: "0.08rem 0.32rem", borderRadius: "4px", background: `${statusColor(tag.status)}22`, color: statusColor(tag.status), fontWeight: 700, letterSpacing: "0.03em" }}>{tag.status}</span>
                  </div>
                  <div style={{ fontSize: "0.6rem", color: NORD.subtle, marginTop: "0.1rem" }}>{tag.zone} · {tag.location}</div>
                </div>
                <span style={{ fontSize: "0.58rem", color: NORD.subtle, flexShrink: 0, fontFamily: "monospace" }}>{tag.eventType}</span>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div style={{ background: NORD.panel, borderRadius: "0.95rem", border: "1px solid rgba(var(--t-border-rgb),0.07)", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.78rem 0.95rem", borderBottom: "1px solid rgba(var(--t-border-rgb),0.06)" }}>
            <div style={{ fontSize: "0.74rem", fontWeight: 700, color: NORD.text }}>History</div>
            <span style={{ fontSize: "0.63rem", color: NORD.muted }}>{activityLog.length} events</span>
          </div>
          <div style={{ overflowY: "auto", padding: "0.45rem", display: "flex", flexDirection: "column", gap: "0.22rem" }}>
            {activityLog.length === 0 && (
              <div style={{ textAlign: "center", padding: "2rem 1rem", color: NORD.subtle, fontSize: "0.82rem" }}>
                No history yet. Actions like stow, pack, and move will appear here.
              </div>
            )}
            {activityLog.slice(0, 5).map((ev, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.52rem", padding: "0.45rem 0.58rem", background: NORD.panel2, borderRadius: "0.5rem", border: "1px solid rgba(var(--t-border-rgb),0.04)" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: evColor(ev.type), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: evColor(ev.type) }}>{evLabel(ev.type)}</span>
                    <span style={{ fontSize: "0.7rem", color: NORD.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.unitId ?? ""}</span>
                  </div>
                  <div style={{ fontSize: "0.58rem", color: NORD.subtle, marginTop: "0.06rem" }}>
                    {new Date(ev.when).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* X-400 / X-500 Messages */}
        <div style={{ background: NORD.panel, borderRadius: "0.95rem", border: "1px solid rgba(var(--t-border-rgb),0.07)", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.78rem 0.95rem", borderBottom: "1px solid rgba(var(--t-border-rgb),0.06)" }}>
            <div style={{ fontSize: "0.74rem", fontWeight: 700, color: NORD.text }}>X-400 / X-500 Messages</div>
            <span style={{ fontSize: "0.63rem", color: NORD.muted }}>{messages.length} total</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0.45rem", display: "flex", flexDirection: "column", gap: "0.28rem" }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "2rem 1rem", color: NORD.subtle, fontSize: "0.82rem" }}>
                No messages yet. Actions like trash disposal send X-400 messages automatically.
              </div>
            )}
            {messages.slice(0, 50).map((msg, i) => (
              <div key={msg.id || i} style={{ padding: "0.6rem 0.72rem", background: NORD.panel2, borderRadius: "0.55rem", border: `1px solid ${msg.priority === "high" ? "rgba(var(--t-red-rgb),0.14)" : "rgba(var(--t-border-rgb),0.04)"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.38rem", marginBottom: "0.26rem" }}>
                  <span style={{ fontSize: "0.57rem", padding: "0.08rem 0.38rem", borderRadius: "4px", background: `${channelColor(msg.channel)}22`, color: channelColor(msg.channel), fontWeight: 700, letterSpacing: "0.04em" }}>{msg.channel}</span>
                  <span style={{ fontWeight: 700, fontSize: "0.77rem", color: NORD.text, flex: 1 }}>{msg.title}</span>
                  {msg.priority === "high" && <span style={{ fontSize: "0.56rem", padding: "0.08rem 0.3rem", borderRadius: "4px", background: "rgba(var(--t-red-rgb),0.14)", color: NORD.red, fontWeight: 700, letterSpacing: "0.04em" }}>HIGH</span>}
                </div>
                <div style={{ fontSize: "0.7rem", color: NORD.muted, lineHeight: 1.45 }}>{msg.body}</div>
                <div style={{ display: "flex", gap: "0.45rem", marginTop: "0.26rem", fontSize: "0.58rem", color: NORD.subtle }}>
                  <span>{msg.author}</span>
                  {msg.createdAt && <span>{new Date(msg.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface GndOrderItem { name: string; qty: string; }
interface GndOrder { poNumber: string; description: string; dueDate: string; status: string; sourceRequestId?: string; items: { sku: string; name: string; qty: number }[]; createdAt: string; }

const ASK_OPTIONS = [
  "Medical Supplies Refill",
  "Food & Rations Resupply",
  "EVA Equipment",
  "Maintenance & Repair Parts",
  "Consumables Restock",
  "Science & Lab Supplies",
  "Crew Personal Items",
  "Communication Equipment",
  "Safety & Emergency Gear",
  "Cleaning Supplies",
  "Tools & Hardware",
  "Electrical Components",
  "Other",
];

function todayStr() { return new Date().toISOString().slice(0, 10); }

function GroundOrdersPanel(_unused?: { onOpenPackWithCtb?: (ctbId: string) => void }) {
  const [orders, setOrders] = useState<GndOrder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [draftAsk, setDraftAsk] = useState(ASK_OPTIONS[0]);
  const [draftDue, setDraftDue] = useState(todayStr);
  const [draftItems, setDraftItems] = useState<GndOrderItem[]>([{ name: "", qty: "" }]);
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = () => {
    fetch(apiUrl("/ground/orders"))
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { if (Array.isArray(data)) setOrders(data); })
      .catch(() => {});
  };

  useEffect(() => {
    fetchOrders();
    const id = window.setInterval(fetchOrders, 5000);
    return () => window.clearInterval(id);
  }, []);

  async function submitOrder() {
    const validItems = draftItems.filter((it) => it.name.trim() && Number(it.qty) > 0);
    if (!draftAsk || validItems.length === 0) return;
    setSubmitting(true);
    try {
      await fetch(apiUrl("/ground/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: draftAsk,
          dueDate: draftDue || undefined,
          items: validItems.map((it) => ({ name: it.name.trim(), qty: Number(it.qty) })),
        }),
      });
      setShowForm(false);
      setDraftAsk(ASK_OPTIONS[0]); setDraftDue(todayStr()); setDraftItems([{ name: "", qty: "" }]);
      fetchOrders();
    } catch (_) {}
    setSubmitting(false);
  }

  async function advanceOrder(o: GndOrder, nextStatus: string) {
    try {
      await fetch(apiUrl(`/ground/orders/${encodeURIComponent(o.poNumber)}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      // If shipped/received and this order was created from a space request, auto-fulfill it
      if ((nextStatus === "shipped" || nextStatus === "received") && o.sourceRequestId) {
        await fetch(apiUrl(`/crew/requests/${encodeURIComponent(o.sourceRequestId)}/status`), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "fulfilled" }),
        });
      }
      fetchOrders();
    } catch (_) {}
  }

  async function resetFlagged(poNumber: string) {
    try {
      await fetch(apiUrl(`/ground/orders/${encodeURIComponent(poNumber)}/reset-flagged`), { method: "POST" });
      fetchOrders();
    } catch (_) {}
  }

  const statusColor = (s: string) => {
    if (s === "open") return NORD.yellow;
    if (s === "shipped" || s === "received" || s === "fulfilled") return NORD.green;
    if (s === "in_progress") return NORD.blue;
    if (s === "flagged") return NORD.red;
    return NORD.subtle;
  };

  return (
    <div style={{ padding: "0.25rem 0.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <style>{`
        .g-input { background: var(--t-surface2); color: var(--t-text); border: 1px solid rgba(var(--t-border-rgb),0.18); border-radius: 0.55rem; padding: 0.5rem 0.75rem; font-size: 0.82rem; width: 100%; outline: none; box-shadow: inset 0 1.5px 3px rgba(0,0,0,0.10); transition: border-color 0.18s ease, box-shadow 0.18s ease; }
        .g-input:focus-visible { border-color: rgba(var(--t-accent-rgb),0.55); box-shadow: 0 0 0 3px rgba(var(--t-accent-rgb),0.13), inset 0 1px 2px rgba(0,0,0,0.06); }
        .g-select { background: var(--t-surface2); color: var(--t-text); border: 1px solid rgba(var(--t-border-rgb),0.18); border-radius: 0.55rem; padding: 0.5rem 0.75rem; font-size: 0.82rem; width: 100%; outline: none; box-shadow: inset 0 1.5px 3px rgba(0,0,0,0.10); transition: border-color 0.18s ease, box-shadow 0.18s ease; appearance: none; cursor: pointer; }
        .g-select:focus-visible { border-color: rgba(var(--t-accent-rgb),0.55); box-shadow: 0 0 0 3px rgba(var(--t-accent-rgb),0.13), inset 0 1px 2px rgba(0,0,0,0.06); }
        .g-btn { padding: 0.3rem 0.7rem; border-radius: 0.55rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; border: none; box-shadow: var(--shadow-xs); transition: opacity 0.12s ease, transform 0.1s ease, box-shadow 0.15s ease; }
        .g-btn:hover { opacity: 0.92; transform: translateY(-1px); box-shadow: var(--shadow-sm); }
        .g-btn:active { opacity: 1; transform: translateY(0.5px) scale(0.98); box-shadow: none; transition: transform 0.07s ease; }
        .g-btn:disabled { opacity: 0.35; cursor: default; transform: none; box-shadow: none; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: NORD.text }}>Purchase Orders to Vendor</h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: NORD.muted }}>Place orders here — the vendor will see them and fulfill them before shipping to Ground.</p>
        </div>
        <button className="g-btn" onClick={() => { setDraftAsk(ASK_OPTIONS[0]); setDraftDue(todayStr()); setDraftItems([{ name: "", qty: "" }]); setShowForm(true); }} style={{ background: NORD.green, color: "#fff", padding: "0.5rem 1rem", fontSize: "0.82rem" }}>
          + Place New Order
        </button>
      </div>

      {/* New Order Form */}
      {showForm && (
        <div style={{ background: NORD.panel, borderRadius: "0.75rem", border: `1px solid rgba(var(--t-blue-rgb),0.25)`, overflow: "hidden" }}>
          <div style={{ padding: "0.85rem 1.1rem", borderBottom: "1px solid rgba(var(--t-border-rgb),0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, color: NORD.text, fontSize: "0.92rem" }}>New Purchase Order</span>
            <button className="g-btn" onClick={() => { setShowForm(false); setDraftAsk(ASK_OPTIONS[0]); setDraftDue(todayStr()); setDraftItems([{ name: "", qty: "" }]); }} style={{ background: NORD.panel2, color: NORD.muted }}>Cancel</button>
          </div>
          <div style={{ padding: "1rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label>
              <div style={{ fontSize: "0.7rem", color: NORD.muted, marginBottom: "0.3rem", fontWeight: 600, textTransform: "uppercase" }}>Ask *</div>
              <select className="g-select" value={draftAsk} onChange={(e) => setDraftAsk(e.target.value)}>
                {ASK_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            <label>
              <div style={{ fontSize: "0.7rem", color: NORD.muted, marginBottom: "0.3rem", fontWeight: 600, textTransform: "uppercase" }}>Required By</div>
              <input className="g-input" type="date" value={draftDue} onChange={(e) => setDraftDue(e.target.value)} style={{ width: "auto" }} />
            </label>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.7rem", color: NORD.muted, fontWeight: 600, textTransform: "uppercase" }}>Items *</span>
                <button className="g-btn" onClick={() => setDraftItems((p) => [...p, { name: "", qty: "" }])} style={{ background: NORD.blue2, color: "#fff", fontSize: "0.7rem" }}>+ Add Item</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 28px", gap: "0.35rem", marginBottom: "0.3rem", fontSize: "0.62rem", color: NORD.subtle, fontWeight: 700, textTransform: "uppercase" }}>
                <span>Item Name</span><span>Qty</span><span></span>
              </div>
              {draftItems.map((it, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 70px 28px", gap: "0.35rem", marginBottom: "0.3rem", alignItems: "center" }}>
                  <input className="g-input" aria-label="Item name" placeholder="Item name…" value={it.name} onChange={(e) => setDraftItems((p) => p.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} />
                  <input className="g-input" aria-label="Quantity" type="number" min="1" placeholder="1" value={it.qty} onChange={(e) => setDraftItems((p) => p.map((x, i) => i === idx ? { ...x, qty: e.target.value } : x))} />
                  <button className="g-btn" aria-label="Remove item" disabled={draftItems.length <= 1} onClick={() => setDraftItems((p) => p.filter((_, i) => i !== idx))} style={{ background: NORD.red, color: "#fff", padding: "0.2rem 0.4rem" }}>{"\u00d7"}</button>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "0.75rem 1.1rem", borderTop: "1px solid rgba(var(--t-border-rgb),0.1)", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button className="g-btn" onClick={() => { setShowForm(false); setDraftAsk(ASK_OPTIONS[0]); setDraftDue(todayStr()); setDraftItems([{ name: "", qty: "" }]); }} style={{ background: NORD.panel2, color: NORD.muted, padding: "0.45rem 1rem" }}>Cancel</button>
            <button
              className="g-btn"
              onClick={submitOrder}
              disabled={submitting || !draftAsk || draftItems.every((it) => !it.name.trim() || !Number(it.qty))}
              style={{ background: NORD.green, color: "#fff", padding: "0.45rem 1rem" }}
            >
              {submitting ? "Sending\u2026" : "Send to Vendor"}
            </button>
          </div>
        </div>
      )}

      {/* Orders list */}
      {orders.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: NORD.muted }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: NORD.text }}>No orders placed yet</div>
          <div style={{ fontSize: "0.78rem", marginTop: "0.3rem", color: NORD.subtle }}>Click <strong style={{ color: NORD.green }}>+ Place New Order</strong> to send a Purchase Order to the vendor.</div>
        </div>
      )}

      {orders.length > 0 && (
        <div style={{ background: NORD.panel, borderRadius: "0.75rem", overflow: "hidden", border: "1px solid rgba(var(--t-border-rgb),0.08)" }}>
          {/* table header */}
          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 100px 80px 90px 1fr", gap: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.65rem", fontWeight: 700, color: NORD.subtle, textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid rgba(var(--t-border-rgb),0.08)" }}>
            <span>PO #</span><span>Ask</span><span>Due</span><span>Items</span><span>Status</span><span>Action</span>
          </div>
          {orders.map((o) => (
            <div key={o.poNumber} style={{ borderBottom: "1px solid rgba(216,222,233,0.06)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 100px 80px 90px 1fr", gap: "0.5rem", padding: "0.65rem 1rem", fontSize: "0.82rem", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: NORD.blue, fontFamily: "monospace", fontSize: "0.77rem" }}>{o.poNumber}</span>
                <span style={{ color: NORD.text }}>{o.description}</span>
                <span style={{ color: NORD.muted, fontSize: "0.75rem" }}>{o.dueDate}</span>
                <span style={{ color: NORD.muted, fontSize: "0.75rem" }}>{o.items.length} item{o.items.length !== 1 ? "s" : ""}</span>
                <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", borderRadius: "999px", background: `${statusColor(o.status)}22`, color: statusColor(o.status), fontWeight: 600, textTransform: "capitalize" }}>{o.status}</span>
                <span>
                  {o.status === "open" && (
                    <button className="g-btn" onClick={() => advanceOrder(o, "in_progress")} style={{ background: NORD.blue, color: "#fff", fontSize: "0.72rem", padding: "0.3rem 0.75rem" }}>Order</button>
                  )}
                  {o.status === "in_progress" && (
                    <span style={{ fontSize: "0.7rem", color: NORD.blue, fontWeight: 600 }}>Awaiting Vendor…</span>
                  )}
                  {o.status === "shipped" && (
                    <span style={{ fontSize: "0.7rem", color: NORD.yellow, fontWeight: 600 }}>In Transit →</span>
                  )}
                  {(o.status === "received" || o.status === "fulfilled") && (
                    <span style={{ fontSize: "0.7rem", color: NORD.green, fontWeight: 600 }}>✓ Received</span>
                  )}
                  {o.status === "flagged" && (
                    <button className="g-btn" onClick={() => resetFlagged(o.poNumber)} style={{ background: NORD.red, color: "#fff", fontSize: "0.72rem", padding: "0.3rem 0.75rem" }}>⚠ Reset &amp; Reorder</button>
                  )}
                </span>
              </div>
              {/* item sub-list */}
              <div style={{ padding: "0 1rem 0.65rem", display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {o.items.map((it, i) => (
                  <span key={i} style={{ fontSize: "0.68rem", padding: "0.2rem 0.5rem", borderRadius: "0.35rem", background: NORD.panel2, color: NORD.muted }}>
                    {it.name} {"\u00d7"} {it.qty}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Ground Space Requests (from Crew) ── */
interface CrewReq {
  id: string;
  category: string;
  description: string;
  urgency: string;
  items: { name: string; qty: number }[];
  status: string;
  createdAt: string;
}

function GroundSpaceRequests() {
  const [requests, setRequests] = useState<CrewReq[]>([]);

  function fetchRequests() {
    fetch(apiUrl("/crew/requests"))
      .then(r => r.ok ? r.json() : [])
      .then(d => { if (Array.isArray(d)) setRequests(d); })
      .catch(() => {});
  }

  useEffect(() => {
    fetchRequests();
    const id = window.setInterval(fetchRequests, 5000);
    return () => window.clearInterval(id);
  }, []);

  async function updateStatus(reqId: string, status: string) {
    try {
      await fetch(apiUrl(`/crew/requests/${encodeURIComponent(reqId)}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchRequests();
    } catch (_) {}
  }

  async function approveRequest(r: CrewReq) {
    // 1. Set request status → approved
    await updateStatus(r.id, "approved");
    // 2. Auto-create a ground order with the same details
    try {
      await fetch(apiUrl("/ground/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: r.category + (r.description ? ` — ${r.description}` : ""),
          dueDate: undefined,
          items: r.items.map(it => ({ name: it.name, qty: it.qty })),
          sourceRequestId: r.id,
        }),
      });
    } catch (_) {}
  }

  const statusColor = (s: string) => {
    if (s === "pending") return NORD.yellow;
    if (s === "approved") return NORD.blue;
    if (s === "fulfilled") return NORD.green;
    if (s === "denied") return NORD.red;
    return NORD.subtle;
  };

  const urgencyColor = (u: string) => u === "urgent" ? NORD.red : NORD.blue;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: NORD.text }}>Space Requests</h2>
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: NORD.muted }}>Resource requests submitted by Crew when supplies are running low.</p>
      </div>

      {requests.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: NORD.muted }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: NORD.text }}>No crew requests yet</div>
          <div style={{ fontSize: "0.78rem", marginTop: "0.3rem", color: NORD.subtle }}>Crew members can submit resource requests from their "Low Resources" tab.</div>
        </div>
      )}

      {requests.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {[...requests].reverse().map(r => (
            <div key={r.id} style={{
              background: NORD.panel, borderRadius: "0.75rem",
              border: `1px solid ${r.urgency === "urgent" ? "rgba(191,97,106,0.25)" : "rgba(var(--t-border-rgb),0.08)"}`,
              overflow: "hidden",
            }}>
              <div style={{ padding: "0.85rem 1.1rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, color: NORD.text, fontSize: "0.92rem" }}>{r.category}</span>
                    <span style={{ fontSize: "0.68rem", padding: "0.15rem 0.45rem", borderRadius: "999px", background: `${urgencyColor(r.urgency)}18`, color: urgencyColor(r.urgency), fontWeight: 600, textTransform: "capitalize" }}>{r.urgency}</span>
                    <span style={{ fontSize: "0.68rem", padding: "0.15rem 0.45rem", borderRadius: "999px", background: `${statusColor(r.status)}22`, color: statusColor(r.status), fontWeight: 600, textTransform: "capitalize" }}>{r.status}</span>
                  </div>
                  {r.description && <div style={{ fontSize: "0.78rem", color: NORD.subtle, marginTop: "0.3rem" }}>{r.description}</div>}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.5rem" }}>
                    {r.items.map((it, i) => (
                      <span key={i} style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", borderRadius: "0.35rem", background: NORD.panel2, color: NORD.muted }}>
                        {it.name} {"\u00d7"} {it.qty}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: NORD.subtle, marginTop: "0.4rem" }}>
                    {r.id} · {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", flexShrink: 0, alignItems: "stretch", minWidth: "140px" }}>
                  {r.status === "pending" && (
                    <>
                      <button
                        onClick={() => approveRequest(r)}
                        style={{
                          padding: "0.55rem 1rem", borderRadius: "0.75rem", border: "none",
                          background: NORD.green, color: "rgb(236,239,244)",
                          fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.18)", letterSpacing: "0.01em",
                          transition: "opacity 0.15s, transform 0.12s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}
                      >✓ Approve &amp; Order</button>
                      <button
                        onClick={() => updateStatus(r.id, "denied")}
                        style={{
                          padding: "0.45rem 1rem", borderRadius: "0.75rem",
                          border: `1px solid rgba(var(--t-border-rgb),0.25)`,
                          background: "transparent", color: NORD.red,
                          fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                          transition: "opacity 0.15s, background 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(191,97,106,0.10)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                      >✕ Deny</button>
                    </>
                  )}
                  {r.status === "approved" && (
                    <div style={{ fontSize: "0.75rem", color: NORD.blue, fontWeight: 600, textAlign: "center", padding: "0.4rem 0.6rem", borderRadius: "0.65rem", background: `${NORD.blue}18`, border: `1px solid ${NORD.blue}33` }}>Order Created</div>
                  )}
                  {r.status === "fulfilled" && (
                    <div style={{ fontSize: "0.75rem", color: NORD.green, fontWeight: 600, textAlign: "center", padding: "0.4rem 0.6rem", borderRadius: "0.65rem", background: `${NORD.green}18`, border: `1px solid ${NORD.green}33` }}>✓ Fulfilled</div>
                  )}
                  {r.status === "denied" && (
                    <div style={{ fontSize: "0.75rem", color: NORD.red, fontWeight: 600, textAlign: "center", padding: "0.4rem 0.6rem", borderRadius: "0.65rem", background: "rgba(191,97,106,0.10)", border: "1px solid rgba(191,97,106,0.25)" }}>Denied</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GroundView() {
  const { theme, toggle } = useTheme();
  const [activeOp, setActiveOp] = useState<OperationType>("dashboard");
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

  const workflowOps: { id: OperationType; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "receive",   label: "Receive"   },
    { id: "tag",       label: "Tag"       },
    { id: "pack",      label: "Pack"      },
    { id: "module3d",  label: "3D Module" },
    { id: "move",      label: "Move"      },
  ];

  const managementOps: { id: OperationType; label: string }[] = [
    { id: "orders",   label: "Orders"         },
    { id: "requests", label: "Space Requests"  },
  ];

  const renderScreen = () => {
    switch (activeOp) {
      case "dashboard": return <GroundDashboard />;
      case "orders": return <GroundOrdersPanel onOpenPackWithCtb={(ctbId) => {
        try { localStorage.setItem("pack_autoselect_outside", ctbId); } catch {}
        setActiveOp("pack");
      }} />;
      case "receive": return <ReceiveScreen />;
      case "tag": return <TagScreen />;
      case "pack": return <PackScreen />;
      case "move": return <MoveScreen />;
      case "requests": return <GroundSpaceRequests />;
      case "module3d":
        return (
          <Suspense fallback={<div style={{ display: "grid", placeItems: "center", height: "100%", color: NORD.subtle, fontSize: "0.9rem" }}>Loading 3D Module\u2026</div>}>
            <div style={{ flex: 1, minHeight: 0, height: "100%" }}>
              <ModuleView3D mode="ground" />
            </div>
          </Suspense>
        );
      default: return <GroundDashboard />;
    }
  };

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .ground-container { grid-template-columns: 1fr !important; }
          .ground-sidebar {
            flex-direction: row !important;
            gap: 0.25rem;
            padding: 0.75rem 1rem !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(var(--t-border-rgb),0.08);
            overflow-x: auto;
          }
          .ground-sidebar button { white-space: nowrap; }
          .ground-logout { display: none; }
        }
        .gnd-nav { transition: background 0.13s ease, color 0.13s ease; }
        .gnd-nav:hover { background: rgba(var(--t-green-rgb),0.10) !important; color: var(--t-text) !important; }
        .gnd-nav:active { transform: scale(0.984); transition: transform 0.07s ease; }
        .gnd-nav[aria-current="page"] { box-shadow: inset -1px 0 8px rgba(var(--t-green-rgb),0.06); }
        .gnd-nav:focus-visible { outline: 2px solid rgba(var(--t-green-rgb),0.55); outline-offset: 2px; border-radius: 0 0.6rem 0.6rem 0; }
        .skip-link { position: absolute; top: 0; left: 0; background: var(--t-green); color: #fff; padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: 600; border-radius: 0 0 0.4rem 0; z-index: 9999; transform: translateY(-100%); transition: transform 0.15s ease; text-decoration: none; }
        .skip-link:focus { transform: translateY(0); }
      `}</style>
      <a href="#ground-main" className="skip-link">Skip to main content</a>
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
              background: "linear-gradient(145deg, rgba(163,190,140,0.9), rgba(163,190,140,0.5))",
              display: "grid", placeItems: "center",
              boxShadow: "0 0 0 1px rgba(163,190,140,0.25), 0 2px 10px rgba(163,190,140,0.18)",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="rgba(0,0,0,0.65)"/>
                <path d="M2 17l10 5 10-5" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M2 12l10 5 10-5" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--t-text)", letterSpacing: "-0.01em" }}>
                DSLM <span style={{ color: "var(--t-subtle)", fontWeight: 500, fontSize: "0.76rem" }}>Ground</span>
              </div>
              <div style={{ fontSize: "0.62rem", color: "var(--t-subtle)" }}>Ground Control Station</div>
            </div>
          </div>
          {/* Mission badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.38rem",
            padding: "0.26rem 0.7rem", borderRadius: "999px",
            background: "rgba(var(--t-blue3-rgb),0.1)",
            border: "1px solid rgba(var(--t-blue3-rgb),0.2)",
            fontSize: "0.67rem", fontWeight: 600, color: "var(--t-blue2)",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--t-blue2)", animation: "pulse-dot 2.5s infinite" }} />
            ISS Expedition 72 — Phase 3
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.45rem" }}>
            {/* Live sync pill */}
            <div style={{
              display: "flex", alignItems: "center", gap: "0.35rem",
              fontSize: "0.67rem",
              background: "rgba(var(--t-green-rgb),0.07)",
              padding: "0.26rem 0.62rem", borderRadius: "999px",
              border: "1px solid rgba(var(--t-green-rgb),0.15)",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--t-green)", animation: "pulse-dot 2s infinite" }}/>
              <span style={{ fontWeight: 600, color: "var(--t-green)" }}>Live</span>
              <span style={{ color: "var(--t-subtle)" }}>{syncLabel}</span>
            </div>
            {/* Theme toggle */}
            <button onClick={toggle} aria-label="Toggle theme" style={{
              width: 30, height: 30, borderRadius: "7px", display: "grid", placeItems: "center",
              background: "rgba(var(--t-border-rgb),0.05)",
              border: "1px solid rgba(var(--t-border-rgb),0.09)",
              color: "var(--t-muted)", cursor: "pointer", fontSize: "0.82rem",
            }}>{theme === "dark" ? "☀" : "☾"}</button>
            {/* Logout */}
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
        <section className="ground-container" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 0, flex: 1, minHeight: 0 }}>

          {/* ─── Sidebar ─── */}
          <nav aria-label="Ground operations" className="ground-sidebar" style={{
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
              background: "rgba(var(--t-green-rgb),0.06)",
              border: "1px solid rgba(var(--t-green-rgb),0.12)",
              borderRadius: "0.72rem",
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: "8px", flexShrink: 0,
                background: "linear-gradient(145deg, rgba(163,190,140,0.65), rgba(94,129,172,0.5))",
                display: "grid", placeItems: "center", fontSize: "0.82rem",
              }}>👤</div>
              <div>
                <div style={{ fontSize: "0.79rem", fontWeight: 700, color: "var(--t-text)", lineHeight: 1.2 }}>Ground Operator</div>
                <div style={{ fontSize: "0.57rem", fontWeight: 700, color: "var(--t-green)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Ground Control</div>
              </div>
            </div>
            <div aria-hidden="true" style={{ fontSize: "0.57rem", fontWeight: 700, color: "var(--t-subtle)", textTransform: "uppercase", letterSpacing: "0.12em", padding: "0.52rem 0.72rem 0.22rem" }}>
              Workflow
            </div>

            {workflowOps.map((op) => {
              const active = activeOp === op.id;
              return (
                <button
                  className="gnd-nav"
                  key={op.id}
                  onClick={() => setActiveOp(op.id)}
                  aria-current={active ? "page" : undefined}
                  aria-label={op.label}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.62rem",
                    padding: "0.52rem 0.72rem", margin: 0,
                    border: "none",
                    background: active ? "rgba(var(--t-green-rgb),0.13)" : "transparent",
                    color: active ? "var(--t-text)" : "var(--t-muted)",
                    borderRadius: "0.55rem",
                    cursor: "pointer",
                    fontSize: "0.82rem", fontWeight: active ? 600 : 500,
                    textAlign: "left", width: "100%",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ display: "grid", placeItems: "center", width: "26px", height: "26px", borderRadius: "6px", flexShrink: 0, background: active ? "rgba(var(--t-green-rgb),0.18)" : "rgba(var(--t-border-rgb),0.05)" }}>
                    <Icon name={op.id} active={active} />
                  </span>
                  {op.label}
                </button>
              );
            })}

            {/* Management section divider */}
            <div aria-hidden="true" style={{ fontSize: "0.57rem", fontWeight: 700, color: "var(--t-subtle)", textTransform: "uppercase", letterSpacing: "0.12em", padding: "0.62rem 0.72rem 0.22rem", marginTop: "0.38rem", borderTop: "1px solid rgba(var(--t-border-rgb),0.06)" }}>
              Management
            </div>

            {managementOps.map((op) => {
              const active = activeOp === op.id;
              return (
                <button
                  className="gnd-nav"
                  key={op.id}
                  onClick={() => setActiveOp(op.id)}
                  aria-current={active ? "page" : undefined}
                  aria-label={op.label}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.62rem",
                    padding: "0.52rem 0.72rem", margin: 0,
                    border: "none",
                    background: active ? "rgba(var(--t-green-rgb),0.13)" : "transparent",
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
                    background: active ? "rgba(var(--t-green-rgb),0.18)" : "rgba(var(--t-border-rgb),0.05)",
                  }}>
                    <Icon name={op.id} active={active} />
                  </span>
                  {op.label}
                </button>
              );
            })}

            {/* Mission status footer */}
            <div style={{
              marginTop: "auto", marginBottom: "0.4rem",
              padding: "0.62rem 0.72rem", borderRadius: "0.62rem",
              background: "rgba(var(--t-blue3-rgb),0.07)",
              border: "1px solid rgba(var(--t-blue3-rgb),0.13)",
            }}>
              <div style={{ fontSize: "0.55rem", color: "var(--t-subtle)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.28rem" }}>Mission Status</div>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--t-blue2)" }}>Resupply Phase 3</div>
              <div style={{ fontSize: "0.62rem", color: "var(--t-muted)", marginTop: "0.1rem" }}>Next docking: T−14d 06h</div>
            </div>
            {/* footer */}
            <div className="ground-logout" style={{ paddingTop: "0.4rem", borderTop: "1px solid rgba(var(--t-border-rgb),0.06)" }}>
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
          <main id="ground-main" tabIndex={-1} aria-label="Ground control operations" style={{
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
