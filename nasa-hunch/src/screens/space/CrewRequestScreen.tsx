import { useEffect, useState } from "react";
import { apiUrl } from "../../lib/apiBase";

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
  green: "var(--t-green)",
  yellow: "var(--t-accent)",
  red: "var(--t-red)",
};

interface RequestItem { name: string; qty: string }
interface CrewRequest {
  id: string;
  category: string;
  description: string;
  urgency: string;
  items: { name: string; qty: number }[];
  status: string;
  createdAt: string;
}

const CATEGORIES = [
  "Food & Rations",
  "Medical Supplies",
  "Cleaning Supplies",
  "Personal Hygiene",
  "Maintenance Parts",
  "Scientific Equipment",
  "Clothing & Protective Gear",
  "Other",
];

export default function CrewRequestScreen() {
  const [requests, setRequests] = useState<CrewRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "urgent">("normal");
  const [items, setItems] = useState<RequestItem[]>([{ name: "", qty: "1" }]);
  const [submitting, setSubmitting] = useState(false);

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

  function resetForm() {
    setCategory(CATEGORIES[0]);
    setDescription("");
    setUrgency("normal");
    setItems([{ name: "", qty: "1" }]);
  }

  async function submitRequest() {
    const validItems = items.filter(it => it.name.trim() && Number(it.qty) > 0);
    if (!category || validItems.length === 0) return;
    setSubmitting(true);
    try {
      await fetch(apiUrl("/crew/requests"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          description,
          urgency,
          items: validItems.map(it => ({ name: it.name.trim(), qty: Number(it.qty) })),
        }),
      });
      setShowForm(false);
      resetForm();
      fetchRequests();
    } catch (_) {}
    setSubmitting(false);
  }

  const statusColor = (s: string) => {
    if (s === "pending") return NORD.yellow;
    if (s === "approved" || s === "fulfilled") return NORD.green;
    if (s === "denied") return NORD.red;
    return NORD.subtle;
  };

  const urgencyColor = (u: string) => u === "urgent" ? NORD.red : NORD.blue;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <style>{`
        .cr-input { background: var(--t-surface2); color: var(--t-text); border: 1px solid rgba(var(--t-border-rgb),0.18); border-radius: 0.55rem; padding: 0.5rem 0.75rem; font-size: 0.82rem; width: 100%; outline: none; transition: border-color 0.2s; }
        .cr-input:focus-visible { border-color: var(--t-accent); box-shadow: 0 0 0 3px rgba(var(--t-accent-rgb),0.15); }
        .cr-select { background: var(--t-surface2); color: var(--t-text); border: 1px solid rgba(var(--t-border-rgb),0.18); border-radius: 0.55rem; padding: 0.5rem 0.75rem; font-size: 0.82rem; width: 100%; outline: none; appearance: none; cursor: pointer; transition: border-color 0.18s ease, box-shadow 0.18s ease; }
        .cr-select:focus-visible { border-color: var(--t-accent); box-shadow: 0 0 0 3px rgba(var(--t-accent-rgb),0.15); }
        .cr-btn { padding: 0.35rem 0.75rem; border-radius: 0.55rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; border: none; transition: opacity 0.15s, transform 0.1s; }
        .cr-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .cr-btn:active { transform: translateY(0); }
        .cr-btn:disabled { opacity: 0.35; cursor: default; transform: none; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: NORD.text }}>Low Resources</h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: NORD.muted }}>Request supplies from Ground when resources are running low.</p>
        </div>
        <button className="cr-btn" onClick={() => { resetForm(); setShowForm(true); }} style={{ background: NORD.blue, color: "#fff", padding: "0.5rem 1rem", fontSize: "0.82rem" }}>
          + New Request
        </button>
      </div>

      {/* Quick Presets */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
        <span style={{ fontSize: "0.68rem", color: NORD.subtle, fontWeight: 600, textTransform: "uppercase", marginRight: "0.25rem" }}>Quick Supply Requests:</span>
        <button className="cr-btn" onClick={() => { setCategory("Food & Rations"); setDescription("Standard food resupply"); setItems([{ name: "Meal Packets", qty: "12" }, { name: "Protein Bars", qty: "8" }]); setShowForm(true); }} style={{ background: NORD.panel2, color: NORD.text, border: `1px solid rgba(var(--t-border-rgb),0.12)`, fontSize: "0.72rem" }}>
          Food Resupply
        </button>
        <button className="cr-btn" onClick={() => { setCategory("Medical Supplies"); setDescription("Standard medical re-stock"); setItems([{ name: "First Aid Kit", qty: "2" }, { name: "Bandages", qty: "20" }]); setShowForm(true); }} style={{ background: NORD.panel2, color: NORD.text, border: `1px solid rgba(var(--t-border-rgb),0.12)`, fontSize: "0.72rem" }}>
          Medical Re-stock
        </button>
        <button className="cr-btn" onClick={() => { setCategory("Maintenance Parts"); setDescription("Routine maintenance supplies"); setItems([{ name: "Filters", qty: "3" }, { name: "Lubricant", qty: "2" }]); setShowForm(true); }} style={{ background: NORD.panel2, color: NORD.text, border: `1px solid rgba(var(--t-border-rgb),0.12)`, fontSize: "0.72rem" }}>
          Maintenance Supplies
        </button>
      </div>

      {/* New Request Form */}
      {showForm && (
        <div style={{ background: NORD.panel, borderRadius: "0.75rem", border: `1px solid rgba(var(--t-blue-rgb),0.25)`, overflow: "hidden" }}>
          <div style={{ padding: "0.85rem 1.1rem", borderBottom: "1px solid rgba(var(--t-border-rgb),0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, color: NORD.text, fontSize: "0.92rem" }}>New Resource Request</span>
            <button className="cr-btn" onClick={() => setShowForm(false)} style={{ background: NORD.panel2, color: NORD.muted }}>Cancel</button>
          </div>
          <div style={{ padding: "1rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label>
              <div style={{ fontSize: "0.7rem", color: NORD.muted, marginBottom: "0.3rem", fontWeight: 600, textTransform: "uppercase" }}>Category *</div>
              <select className="cr-select" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>
              <div style={{ fontSize: "0.7rem", color: NORD.muted, marginBottom: "0.3rem", fontWeight: 600, textTransform: "uppercase" }}>Description</div>
              <input className="cr-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief explanation of why supplies are needed…" />
            </label>
            <div>
              <div style={{ fontSize: "0.7rem", color: NORD.muted, marginBottom: "0.3rem", fontWeight: 600, textTransform: "uppercase" }}>Urgency</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {(["normal", "urgent"] as const).map(u => (
                  <button key={u} className="cr-btn" onClick={() => setUrgency(u)} style={{
                    background: urgency === u ? (u === "urgent" ? "rgba(191,97,106,0.2)" : "rgba(var(--t-blue-rgb),0.15)") : NORD.panel2,
                    color: urgency === u ? urgencyColor(u) : NORD.muted,
                    border: `1px solid ${urgency === u ? (u === "urgent" ? "rgba(191,97,106,0.4)" : "rgba(var(--t-blue-rgb),0.3)") : "rgba(var(--t-border-rgb),0.12)"}`,
                    textTransform: "capitalize",
                  }}>{u}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.7rem", color: NORD.muted, fontWeight: 600, textTransform: "uppercase" }}>Items Needed *</span>
                <button className="cr-btn" onClick={() => setItems(p => [...p, { name: "", qty: "1" }])} style={{ background: NORD.blue2, color: "#fff", fontSize: "0.7rem" }}>+ Add Item</button>
              </div>
              {items.map((it, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 70px 28px", gap: "0.35rem", marginBottom: "0.3rem", alignItems: "center" }}>
                  <input className="cr-input" placeholder="Item name…" aria-label="Item name" value={it.name} onChange={e => setItems(p => p.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} />
                  <input className="cr-input" type="number" min="1" placeholder="1" value={it.qty} onChange={e => setItems(p => p.map((x, i) => i === idx ? { ...x, qty: e.target.value } : x))} />
                  <button className="cr-btn" disabled={items.length <= 1} onClick={() => setItems(p => p.filter((_, i) => i !== idx))} style={{ background: NORD.red, color: "#fff", padding: "0.2rem 0.4rem" }}>{"\u00d7"}</button>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "0.75rem 1.1rem", borderTop: "1px solid rgba(var(--t-border-rgb),0.1)", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button className="cr-btn" onClick={() => setShowForm(false)} style={{ background: NORD.panel2, color: NORD.muted, padding: "0.45rem 1rem" }}>Cancel</button>
            <button className="cr-btn" onClick={submitRequest} disabled={submitting || items.every(it => !it.name.trim())} style={{ background: NORD.blue, color: "#fff", padding: "0.45rem 1rem" }}>
              {submitting ? "Sending\u2026" : "Submit Request"}
            </button>
          </div>
        </div>
      )}

      {/* Requests list */}
      {requests.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: NORD.muted }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: NORD.text }}>No requests submitted yet</div>
          <div style={{ fontSize: "0.78rem", marginTop: "0.3rem", color: NORD.subtle }}>Click <strong style={{ color: NORD.blue }}>+ New Request</strong> when supplies are running low.</div>
        </div>
      )}

      {requests.length > 0 && (
        <div style={{ background: NORD.panel, borderRadius: "0.75rem", overflow: "hidden", border: "1px solid rgba(var(--t-border-rgb),0.08)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 80px 80px 100px", gap: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.65rem", fontWeight: 700, color: NORD.subtle, textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid rgba(var(--t-border-rgb),0.08)" }}>
            <span>ID</span><span>Category</span><span>Urgency</span><span>Items</span><span>Status</span>
          </div>
          {[...requests].reverse().map(r => (
            <div key={r.id} style={{ borderBottom: "1px solid rgba(216,222,233,0.06)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 80px 80px 100px", gap: "0.5rem", padding: "0.65rem 1rem", fontSize: "0.82rem", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: NORD.blue, fontFamily: "monospace", fontSize: "0.72rem" }}>{r.id.slice(0, 10)}</span>
                <div>
                  <span style={{ color: NORD.text }}>{r.category}</span>
                  {r.description && <div style={{ fontSize: "0.72rem", color: NORD.subtle, marginTop: "0.15rem" }}>{r.description}</div>}
                </div>
                <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", borderRadius: "999px", background: `${urgencyColor(r.urgency)}18`, color: urgencyColor(r.urgency), fontWeight: 600, textTransform: "capitalize" }}>{r.urgency}</span>
                <span style={{ color: NORD.muted, fontSize: "0.75rem" }}>{r.items.length} item{r.items.length !== 1 ? "s" : ""}</span>
                <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", borderRadius: "999px", background: `${statusColor(r.status)}22`, color: statusColor(r.status), fontWeight: 600, textTransform: "capitalize" }}>{r.status}</span>
              </div>
              <div style={{ padding: "0 1rem 0.65rem", display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {r.items.map((it, i) => (
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
