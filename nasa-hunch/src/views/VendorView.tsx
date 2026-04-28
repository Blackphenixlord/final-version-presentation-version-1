// src/views/VendorView.tsx — Vendor portal: real vendor perspective
import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "../lib/apiBase";
import { useTheme } from "../lib/theme";

/* ── Vendor company identity ───────────────────────────────── */
const VENDOR = {
  name: "Sunrise Supply Co.",
  vendorId: "NASA-VND-00847",
  contact: "J. Martinez",
  email: "j.martinez@sunrisesupply.com",
  phone: "(321) 555-0192",
};

/* ── Theme-aware tokens ─────────────────────────────────────── */
const C = {
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
  orange: "var(--t-accent)",
};

/* ── Status helpers ────────────────────────────────────────── */
const statusColor = (s: string) => {
  const l = s.toLowerCase();
  if (["shipped", "complete", "delivered", "accepted"].includes(l)) return C.green;
  if (["in-transit", "processing", "in-progress"].includes(l)) return C.blue;
  if (["pending", "awaiting-pickup", "draft"].includes(l)) return C.yellow;
  if (["rejected", "issue", "hold"].includes(l)) return C.red;
  return C.muted;
};

function Pill({ status }: { status: string }) {
  const c = statusColor(status);
  const rgbMap: Record<string, string> = {
    "var(--t-green)": "var(--t-green-rgb)",
    "var(--t-blue)": "var(--t-blue-rgb)",
    "var(--t-accent)": "var(--t-accent-rgb)",
    "var(--t-red)": "var(--t-red-rgb)",
    "var(--t-muted)": "var(--t-muted-rgb)",
  };
  const rgb = rgbMap[c] || "var(--t-muted-rgb)";
  return (
    <span style={{ fontSize: "0.68rem", padding: "0.2rem 0.55rem", borderRadius: "999px", background: `rgba(${rgb},0.13)`, color: c, fontWeight: 600, textTransform: "capitalize" }}>
      {status}
    </span>
  );
}

/* ── Price catalog (simple lookup for demo) ───── */
const PRICE_CATALOG: Record<string, number> = {
  "bandage": 4.50, "gauze": 3.25, "antiseptic": 6.00, "gloves": 8.50, "syringe": 2.75,
  "thermometer": 12.00, "aspirin": 5.50, "saline": 9.00, "scalpel": 15.00,
  "freeze-dried meal": 18.00, "protein bar": 3.50, "electrolyte mix": 7.00,
  "wrench set": 22.00, "screwdriver kit": 18.50, "duct tape": 6.50, "zip ties": 4.00,
  "batteries": 9.50, "flashlight": 14.00, "epoxy": 11.00,
  "toothbrush": 2.00, "toothpaste": 3.50, "soap": 4.00, "shampoo": 5.50,
  "disinfectant spray": 8.00, "wipes": 4.50, "trash bags": 6.00,
  "water filter": 24.00, "air filter": 32.00, "o-ring set": 7.50,
};
function itemPrice(name: string): number {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(PRICE_CATALOG)) {
    if (key.includes(k)) return v;
  }
  return 15.00;
}

/* ── Live data models ──────────────────────────────────────── */
interface OrderItem {
  sku: string;
  name: string;
  qty: number;
  picked: number;
  rfidTagged: boolean;
}
interface PurchaseOrder {
  poNumber: string;
  description: string;
  qtyOrdered: number;
  qtyShipped: number;
  dueDate: string;
  status: string;
  items: OrderItem[];
}
interface OutboundShipment {
  id: string;
  poNumber: string;
  carrier: string;
  tracking: string;
  status: string;
  shipped: string;
  items: number;
}
interface Invoice {
  invNumber: string;
  poNumber: string;
  issuedDate: string;
  totalUnits: number;
  totalPrice: number;
  items: { name: string; qty: number; unitPrice: number }[];
  status: "sent" | "acknowledged" | "paid" | "pending";
}

const INITIAL_POS: PurchaseOrder[] = [];
const INITIAL_SHIPMENTS: OutboundShipment[] = [];
const INITIAL_INVOICES: Invoice[] = [];

type PageType = "orders" | "invoices" | "shipments" | "past" | "packing";

/* ── Sidebar icons ─────────────────────────────────────────── */
function VendorIcon({ name, active }: { name: PageType; active?: boolean }) {
  const s = { width: "1.15rem", height: "1.15rem" } as const;
  const c1 = active ? "var(--t-accent)" : "var(--t-muted)";
  const c2 = active ? "var(--t-text)" : "var(--t-subtle)";
  switch (name) {
    case "orders":
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none">
          <rect x="5" y="3" width="14" height="18" rx="2" stroke={c2} strokeWidth="1.8" strokeLinejoin="round"/>
          <path d="M9 8h6M9 12h6M9 16h4" stroke={c1} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      );
    case "invoices":
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none">
          <rect x="4" y="2" width="16" height="20" rx="2" stroke={c2} strokeWidth="1.8" strokeLinejoin="round"/>
          <path d="M8 10h8M8 14h5" stroke={c2} strokeWidth="1.6" strokeLinecap="round"/>
          <path d="M12 6v1m0 10v1m-2.5-5.5c0-.83.67-1.5 1.5-1.5h2a1.5 1.5 0 010 3h-2a1.5 1.5 0 000 3h2c.83 0 1.5-.67 1.5-1.5" stroke={c1} strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      );
    case "shipments":
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none">
          <path d="M1 3h15v13H1z" stroke={c2} strokeWidth="1.8" strokeLinejoin="round"/>
          <path d="M16 8h4l3 3v5h-7V8Z" stroke={c2} strokeWidth="1.8" strokeLinejoin="round"/>
          <circle cx="5.5" cy="18.5" r="2.5" stroke={c1} strokeWidth="1.6"/>
          <circle cx="18.5" cy="18.5" r="2.5" stroke={c1} strokeWidth="1.6"/>
        </svg>
      );
    case "past":
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={c2} strokeWidth="1.8"/>
          <path d="M12 7v5l3 3" stroke={c1} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 3l3 3" stroke={c2} strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      );
    case "packing":
      return (
        <svg style={s} viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke={c2} strokeWidth="1.8" strokeLinejoin="round"/>
          <path d="M7 8h10M7 12h7M7 16h5" stroke={c1} strokeWidth="1.7" strokeLinecap="round"/>
          <path d="M17 15l1.5 1.5L21 14" stroke={c1} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    default:
      return null;
  }
}

/* ── Main view ────────────────────────────────────────────── */
export default function VendorView() {
  const { theme, toggle } = useTheme();
  const [shipments, setShipments] = useState<OutboundShipment[]>(INITIAL_SHIPMENTS);
  const [pos, setPOs] = useState<PurchaseOrder[]>(INITIAL_POS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [expandedPO, setExpandedPO] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<PageType>("orders");
  const [shippedPOs, setShippedPOs] = useState<Set<string>>(() => {
    try { const saved = localStorage.getItem("vendor_shipped"); return saved ? new Set(JSON.parse(saved)) : new Set(); }
    catch { return new Set(); }
  });
  const [pastOrders, setPastOrders] = useState<PurchaseOrder[]>(() => {
    try { const saved = localStorage.getItem("vendor_past_orders"); return saved ? JSON.parse(saved) : []; }
    catch { return []; }
  });

  useEffect(() => {
    let live = true;
    function pollOrders() {
      fetch(apiUrl("/ground/orders"))
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!live || !Array.isArray(data)) return;
          setPOs((prev) => {
            const next = data
              .filter((serverPO: { poNumber: string }) => !shippedPOs.has(serverPO.poNumber))
              .map((serverPO: { poNumber: string; description: string; dueDate: string; status: string; items: { sku: string; name: string; qty: number }[] }) => {
                const existing = prev.find((p) => p.poNumber === serverPO.poNumber);
                return {
                  poNumber: serverPO.poNumber,
                  description: serverPO.description,
                  dueDate: serverPO.dueDate,
                  status: existing && ["shipped", "complete"].includes(existing.status) ? existing.status : (serverPO.status || "pending"),
                  qtyOrdered: serverPO.items.reduce((a: number, it: { qty: number }) => a + Number(it.qty), 0),
                  qtyShipped: existing ? existing.qtyShipped : 0,
                  items: serverPO.items.map((serverItem: { sku: string; name: string; qty: number }, idx: number) => {
                    const existingItem = existing?.items[idx];
                    return {
                      sku: serverItem.sku,
                      name: serverItem.name,
                      qty: Number(serverItem.qty),
                      picked: existingItem?.picked ?? 0,
                      rfidTagged: existingItem?.rfidTagged ?? false,
                    };
                  }),
                };
              });
            return next;
          });
        })
        .catch(() => {});
    }
    pollOrders();
    const id = window.setInterval(pollOrders, 5000);
    return () => { live = false; window.clearInterval(id); };
  }, [shippedPOs]);

  useEffect(() => {
    let live = true;
    fetch(apiUrl("/shipments"))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!live || !Array.isArray(data) || data.length === 0) return;
        setShipments(data.map((s: { id: string; vendor: string; status: string }) => ({
          id: s.id, poNumber: "—", carrier: "—", tracking: "—", status: s.status, shipped: "—", items: 0,
        })));
      })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  const syncLabel = useMemo(
    () => new Date().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
    [],
  );

  function logout() {
    localStorage.removeItem("actor");
    localStorage.removeItem("uiMode");
    window.location.href = "/";
  }

  function markPicked(poNumber: string, sku: string) {
    setPOs((prev) => prev.map((po) => {
      if (po.poNumber !== poNumber) return po;
      const newItems = po.items.map((it) => it.sku === sku ? { ...it, picked: it.qty } : it);
      return { ...po, items: newItems, qtyShipped: newItems.reduce((a, it) => a + it.picked, 0) };
    }));
  }

  function pickAll(poNumber: string) {
    setPOs((prev) => prev.map((po) => {
      if (po.poNumber !== poNumber) return po;
      const newItems = po.items.map((it) => ({ ...it, picked: it.qty }));
      return { ...po, items: newItems, qtyShipped: newItems.reduce((a, it) => a + it.qty, 0), status: "in-progress" };
    }));
  }

  function tagAll(poNumber: string) {
    setPOs((prev) => prev.map((po) => {
      if (po.poNumber !== poNumber) return po;
      return { ...po, items: po.items.map((it) => ({ ...it, rfidTagged: true })) };
    }));
  }

  function toggleRFID(poNumber: string, sku: string) {
    setPOs((prev) => prev.map((po) => {
      if (po.poNumber !== poNumber) return po;
      return { ...po, items: po.items.map((it) => it.sku === sku ? { ...it, rfidTagged: !it.rfidTagged } : it) };
    }));
  }

  async function shipPO(poNumber: string) {
    const po = pos.find((p) => p.poNumber === poNumber);
    if (!po) return;
    try {
      await fetch(apiUrl("/vendor/ship"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poNumber,
          vendorName: VENDOR.name,
          description: po.description,
          items: po.items.map((it) => ({ sku: it.sku, name: it.name, qty: it.qty })),
        }),
      });
      await fetch(apiUrl(`/ground/orders/${poNumber}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "shipped" }),
      });
    } catch (_) {}
    const totalUnits = po.items.reduce((a, it) => a + it.qty, 0);
    const invoiceItems = po.items.map((it) => ({ name: it.name, qty: it.qty, unitPrice: itemPrice(it.name) }));
    const totalPrice = invoiceItems.reduce((a, it) => a + it.qty * it.unitPrice, 0);
    const invTag = Date.now().toString(36).slice(-4).toUpperCase();
    setInvoices((prev) => [{
      invNumber: `INV-${invTag}`,
      poNumber,
      issuedDate: new Date().toISOString().slice(0, 10),
      totalUnits,
      totalPrice,
      items: invoiceItems,
      status: "sent",
    }, ...prev]);
    setPOs((prev) => prev.map((p) => p.poNumber === poNumber ? { ...p, status: "shipped", qtyShipped: totalUnits } : p));
    const finishedPO = { ...po, status: "shipped", qtyShipped: totalUnits };
    setPastOrders((prev) => {
      const next = [finishedPO, ...prev.filter((p) => p.poNumber !== poNumber)];
      try { localStorage.setItem("vendor_past_orders", JSON.stringify(next)); } catch {}
      return next;
    });
    setShippedPOs((prev) => {
      const next = new Set(prev);
      next.add(poNumber);
      try { localStorage.setItem("vendor_shipped", JSON.stringify([...next])); } catch {}
      return next;
    });
    window.setTimeout(() => {
      setPOs((prev) => prev.filter((p) => p.poNumber !== poNumber));
    }, 600);
    const shipTag = Date.now().toString(36).slice(-4).toUpperCase();
    setShipments((prev) => [{
      id: `SHIP-VND-${shipTag}`,
      poNumber,
      carrier: "NASA Logistics",
      tracking: `TRK-${shipTag}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      status: "in-transit",
      shipped: new Date().toISOString().slice(0, 10),
      items: totalUnits,
    }, ...prev]);
  }

  /* ── KPI numbers ── */
  const openPOs = pos.filter((p) => !["complete", "shipped"].includes(p.status)).length;
  const totalUnits = pos.reduce((a, p) => a + p.qtyOrdered, 0);
  const unitsShipped = pos.reduce((a, p) => a + p.qtyShipped, 0);
  const fillRate = totalUnits > 0 ? Math.round((unitsShipped / totalUnits) * 100) : 0;

  /* ── Action items ── */
  const actionItems: { text: string; color: string }[] = [];
  pos.forEach((po) => {
    po.items.forEach((it) => {
      if (it.picked < it.qty) actionItems.push({ text: `Pick ${it.qty - it.picked}× "${it.name}" for ${po.poNumber}`, color: C.yellow });
      if (it.picked > 0 && !it.rfidTagged) actionItems.push({ text: `RFID-tag "${it.name}" before packing (${po.poNumber})`, color: C.orange });
    });
  });

  const pages: { id: PageType; label: string }[] = [
    { id: "orders",    label: "My Orders"     },
    { id: "packing",   label: "Packing Rules" },
    { id: "shipments", label: "My Shipments"  },
    { id: "invoices",  label: "Invoices"      },
    { id: "past",      label: "Past Orders"   },
  ];

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .vendor-container { grid-template-columns: 1fr !important; }
          .vendor-sidebar {
            flex-direction: row !important;
            gap: 0.25rem;
            padding: 0.75rem 1rem !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(var(--t-border-rgb),0.08);
            overflow-x: auto;
          }
          .vendor-sidebar button { white-space: nowrap; }
          .vendor-logout { display: none; }
        }
        .vnd-nav { transition: background 0.13s ease, color 0.13s ease; }
        .vnd-nav:hover { background: rgba(var(--t-accent-rgb),0.10) !important; color: var(--t-text) !important; }
        .vnd-nav:active { transform: scale(0.984); transition: transform 0.07s ease; }
        .vnd-nav[aria-current="page"] { box-shadow: inset 0 0 0 1px rgba(var(--t-accent-rgb),0.12); }
        .vnd-nav:focus-visible { outline: 2px solid rgba(var(--t-accent-rgb),0.55); outline-offset: 2px; border-radius: 0.55rem; }
        .skip-link { position: absolute; top: 0; left: 0; background: var(--t-accent); color: #fff; padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: 600; border-radius: 0 0 0.4rem 0; z-index: 9999; transform: translateY(-100%); transition: transform 0.15s ease; text-decoration: none; }
        .skip-link:focus { transform: translateY(0); }
        .v-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 900px) { .v-grid { grid-template-columns: 1fr; } }
        .v-row:hover { background: var(--t-surface3) !important; box-shadow: var(--shadow-xs); }
        .v-btn { padding: 0.25rem 0.55rem; border-radius: 0.4rem; font-size: 0.68rem; font-weight: 600; cursor: pointer; border: none; box-shadow: 0 1px 2px rgba(0,0,0,0.18); transition: opacity 0.12s ease, transform 0.1s ease, box-shadow 0.15s ease; }
        .v-btn:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 3px 7px rgba(0,0,0,0.22); }
        .v-btn:active { opacity: 1; transform: translateY(0.5px) scale(0.97); box-shadow: none; transition: transform 0.07s ease; }
        .v-btn:disabled { opacity: 0.35; cursor: default; transform: none; box-shadow: none; }
        .v-input { background: var(--t-surface); color: var(--t-text); border: 1px solid rgba(var(--t-border-rgb),0.18); border-radius: 0.45rem; padding: 0.4rem 0.65rem; font-size: 0.82rem; width: 100%; outline: none; box-shadow: inset 0 1.5px 3px rgba(0,0,0,0.10); transition: border-color 0.18s ease, box-shadow 0.18s ease; }
        .v-input:focus-visible { border-color: rgba(var(--t-accent-rgb),0.55); box-shadow: 0 0 0 2px rgba(var(--t-accent-rgb),0.14), inset 0 1px 2px rgba(0,0,0,0.06); }
      `}</style>

      <a href="#vendor-main" className="skip-link">Skip to main content</a>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: C.bg, fontFamily: "system-ui, sans-serif" }}>

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
              background: "linear-gradient(145deg, rgba(208,135,112,0.9), rgba(191,97,106,0.5))",
              display: "grid", placeItems: "center",
              boxShadow: "0 0 0 1px rgba(208,135,112,0.25), 0 2px 10px rgba(208,135,112,0.15)",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 21V7h6V3h6v8h6v10" stroke="rgba(0,0,0,0.65)" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M9 21V13h6v8" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--t-text)", letterSpacing: "-0.01em" }}>
                {VENDOR.name} <span style={{ color: "var(--t-subtle)", fontWeight: 500, fontSize: "0.76rem" }}>Vendor</span>
              </div>
              <div style={{ fontSize: "0.62rem", color: "var(--t-subtle)" }}>
                <span style={{ color: "var(--t-blue)", fontFamily: "monospace" }}>{VENDOR.vendorId}</span>
                &nbsp;·&nbsp;{VENDOR.contact}
              </div>
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.45rem" }}>
            {openPOs > 0 && (
              <div style={{
                display: "flex", alignItems: "center", gap: "0.35rem",
                fontSize: "0.67rem",
                background: "rgba(var(--t-accent-rgb),0.07)",
                padding: "0.26rem 0.62rem", borderRadius: "999px",
                border: "1px solid rgba(var(--t-accent-rgb),0.18)",
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--t-accent)", animation: "pulse-dot 2s infinite" }}/>
                <span style={{ fontWeight: 600, color: "var(--t-accent)" }}>{openPOs} new order{openPOs !== 1 ? "s" : ""}</span>
              </div>
            )}
            <div style={{
              display: "flex", alignItems: "center", gap: "0.35rem",
              fontSize: "0.67rem",
              background: "rgba(var(--t-green-rgb),0.07)",
              padding: "0.26rem 0.62rem", borderRadius: "999px",
              border: "1px solid rgba(var(--t-green-rgb),0.14)",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--t-green)", animation: "pulse-dot 2s infinite" }}/>
              <span style={{ fontWeight: 600, color: "var(--t-green)" }}>Live</span>
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
        <section className="vendor-container" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 0, flex: 1, minHeight: 0 }}>

          {/* ─── Sidebar ─── */}
          <nav aria-label="Vendor operations" className="vendor-sidebar" style={{
            display: "flex", flexDirection: "column", gap: "0.25rem",
            padding: "0.75rem 0.65rem",
            background: "var(--t-sidebar)",
            borderRight: "1px solid rgba(var(--t-border-rgb),0.08)",
            overflowY: "auto",
          }}>
            {/* User role card */}
            <div style={{
              margin: "0 0 0.55rem",
              padding: "0.65rem 0.75rem",
              borderRadius: "0.65rem",
              background: "rgba(var(--t-accent-rgb),0.06)",
              border: "1px solid rgba(var(--t-accent-rgb),0.12)",
              display: "flex", alignItems: "center", gap: "0.6rem",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(145deg, rgba(208,135,112,0.5), rgba(191,97,106,0.3))",
                display: "grid", placeItems: "center", fontSize: "0.95rem",
              }}>🏭</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--t-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{VENDOR.name}</div>
                <div style={{ fontSize: "0.57rem", fontWeight: 700, color: "var(--t-accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Vendor</div>
              </div>
            </div>

            <div aria-hidden="true" style={{ fontSize: "0.57rem", fontWeight: 700, color: "var(--t-subtle)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "0.5rem 0.75rem 0.4rem", marginBottom: "0.15rem" }}>
              Operations
            </div>

            {pages.map((page) => {
              const active = activePage === page.id;
              return (
                <button
                  className="vnd-nav"
                  key={page.id}
                  onClick={() => setActivePage(page.id)}
                  aria-current={active ? "page" : undefined}
                  aria-label={page.label}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.65rem",
                    padding: "0.55rem 0.75rem", margin: 0,
                    border: "none",
                    background: active ? "rgba(var(--t-accent-rgb),0.13)" : "transparent",
                    color: active ? "var(--t-text)" : "var(--t-muted)",
                    borderRadius: "0.55rem",
                    cursor: "pointer",
                    fontSize: "0.84rem", fontWeight: active ? 700 : 500,
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{
                    display: "grid", placeItems: "center",
                    width: 26, height: 26, borderRadius: "0.45rem",
                    background: active ? "rgba(var(--t-accent-rgb),0.18)" : "rgba(var(--t-border-rgb),0.06)",
                    flexShrink: 0,
                  }}>
                    <VendorIcon name={page.id} active={active} />
                  </span>
                  {page.label}
                  {/* Badge for open orders */}
                  {page.id === "orders" && openPOs > 0 && (
                    <span style={{
                      marginLeft: "auto", fontSize: "0.62rem", fontWeight: 700,
                      background: "var(--t-accent)", color: "#fff",
                      borderRadius: "999px", padding: "0.1rem 0.4rem", minWidth: "1.2rem", textAlign: "center",
                    }}>{openPOs}</span>
                  )}
                </button>
              );
            })}

            {/* KPI summary in sidebar */}
            <div style={{ marginTop: "0.75rem", padding: "0.6rem 0.75rem", borderRadius: "0.6rem", background: "rgba(var(--t-border-rgb),0.04)", border: "1px solid rgba(var(--t-border-rgb),0.07)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--t-subtle)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.1rem" }}>Summary</div>
              {[
                { label: "Open POs", value: openPOs, color: C.yellow },
                { label: "Units Shipped", value: unitsShipped, color: C.green },
                { label: "Fill Rate", value: `${fillRate}%`, color: fillRate >= 90 ? C.green : fillRate >= 50 ? C.yellow : C.red },
                { label: "Active Shipments", value: shipments.filter((s) => s.status !== "delivered").length, color: C.orange },
              ].map((m) => (
                <div key={m.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--t-subtle)" }}>{m.label}</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: m.color }}>{m.value}</span>
                </div>
              ))}
            </div>

            {/* footer */}
            <div className="vendor-logout" style={{ marginTop: "auto", paddingTop: "0.5rem", borderTop: "1px solid rgba(var(--t-border-rgb),0.06)" }}>
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
          <main id="vendor-main" tabIndex={-1} aria-label="Vendor portal content" style={{
            display: "flex", flexDirection: "column",
            overflow: "hidden", background: "var(--t-bg)", minHeight: 0,
            flex: 1,
          }}>

            {/* Action required alerts */}
            {actionItems.length > 0 && (
              <div style={{ background: "rgba(var(--t-accent-rgb),0.07)", borderBottom: "1px solid rgba(var(--t-accent-rgb),0.2)", padding: "0.5rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", overflowX: "auto", flexShrink: 0 }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: C.yellow, whiteSpace: "nowrap" }}>ACTION NEEDED:</span>
                {actionItems.slice(0, 3).map((a, i) => (
                  <span key={i} style={{ fontSize: "0.72rem", color: a.color, whiteSpace: "nowrap", background: "rgba(var(--t-accent-rgb),0.09)", padding: "0.2rem 0.55rem", borderRadius: "999px" }}>{a.text}</span>
                ))}
                {actionItems.length > 3 && <span style={{ fontSize: "0.7rem", color: C.muted }}>+{actionItems.length - 3} more</span>}
              </div>
            )}

            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

              {/* ── ORDERS page ───────────────────────────────────────── */}
              {activePage === "orders" && (
                <div style={{ background: C.panel, borderRadius: "1rem", padding: "1.25rem 1.5rem", borderTop: `3px solid ${C.blue}`, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: C.text }}>
                      Orders from Ground — pick items, tag RFID, then ship
                    </h3>
                    <span style={{ fontSize: "0.72rem", color: C.muted, background: C.panel2, padding: "0.3rem 0.65rem", borderRadius: "0.65rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ width: "0.45rem", height: "0.45rem", borderRadius: "50%", background: C.green, display: "inline-block" }} />
                      Live — polling every 5s
                    </span>
                  </div>

                  {pos.length === 0 && (
                    <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: C.muted }}>
                      <div style={{ fontSize: "0.95rem", marginBottom: "0.5rem", color: C.subtle }}>—</div>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: C.text }}>No orders from Ground yet</div>
                      <div style={{ fontSize: "0.8rem", marginTop: "0.3rem", color: C.subtle }}>Ground will place Purchase Orders here. Once they appear, pick the items, tag RFID, and ship to Ground.</div>
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "20px 108px 1fr 62px 62px 88px 78px", gap: "0.5rem", padding: "0.35rem 0.75rem", fontSize: "0.65rem", fontWeight: 700, color: C.subtle, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      <span></span><span>PO #</span><span>Description</span><span>Ordered</span><span>Shipped</span><span>Due</span><span>Status</span>
                    </div>
                    {pos.map((po) => {
                      const isOpen = expandedPO === po.poNumber;
                      const totalPicked = po.items.reduce((a, it) => a + it.picked, 0);
                      const totalQty = po.items.reduce((a, it) => a + it.qty, 0);
                      const allTagged = po.items.every((it) => it.rfidTagged);
                      const readyToShip = totalPicked >= totalQty && allTagged;
                      return (
                        <div key={po.poNumber}>
                          <button
                            onClick={() => setExpandedPO(isOpen ? null : po.poNumber)}
                            aria-expanded={isOpen}
                            aria-label={`Toggle order ${po.poNumber}`}
                            className="v-row"
                            style={{ display: "grid", gridTemplateColumns: "20px 108px 1fr 62px 62px 88px 78px", gap: "0.5rem", padding: "0.55rem 0.75rem", borderRadius: isOpen ? "0.5rem 0.5rem 0 0" : "0.5rem", background: C.panel2, fontSize: "0.82rem", alignItems: "center", cursor: "pointer", transition: "background 0.15s", border: readyToShip ? "1px solid rgba(var(--t-green-rgb),0.27)" : "1px solid transparent", width: "100%", textAlign: "left", font: "inherit", color: "inherit" }}
                          >
                            <span aria-hidden="true" style={{ color: C.muted, fontSize: "0.7rem" }}>{isOpen ? "▾" : "▸"}</span>
                            <span style={{ fontWeight: 700, color: C.blue, fontFamily: "monospace", fontSize: "0.77rem" }}>{po.poNumber}</span>
                            <span style={{ color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{po.description}</span>
                            <span style={{ color: C.muted, textAlign: "center" }}>{po.qtyOrdered}</span>
                            <span style={{ color: po.qtyShipped >= po.qtyOrdered ? C.green : C.yellow, textAlign: "center", fontWeight: 600 }}>{po.qtyShipped}</span>
                            <span style={{ color: C.subtle, fontSize: "0.72rem" }}>{po.dueDate}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <Pill status={po.status} />
                              {readyToShip && <span style={{ fontSize: "0.62rem", color: C.green }}>✓ Ready</span>}
                            </span>
                          </button>

                          {isOpen && (
                            <div style={{ background: C.panel3, borderRadius: "0 0 0.6rem 0.6rem", padding: "0.75rem 0.75rem 0.65rem", borderTop: "1px solid rgba(var(--t-border-rgb),0.07)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: C.text }}>Item Pick List</span>
                                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                  {!po.items.every((it) => it.picked >= it.qty) && (
                                    <button className="v-btn" onClick={(e) => { e.stopPropagation(); pickAll(po.poNumber); }} style={{ background: C.green, color: "#fff", padding: "0.25rem 0.65rem" }}>
                                      ✔ Pick All
                                    </button>
                                  )}
                                  {po.items.some((it) => it.picked > 0 && !it.rfidTagged) && (
                                    <button className="v-btn" onClick={(e) => { e.stopPropagation(); tagAll(po.poNumber); }} style={{ background: C.orange, color: "#fff", padding: "0.25rem 0.65rem" }}>
                                      ⚡ Tag All RFID
                                    </button>
                                  )}
                                  <span style={{ fontSize: "0.68rem", color: allTagged ? C.green : C.yellow, fontWeight: 600 }}>
                                    {allTagged ? "✓ All RFID tagged" : "Tag needed"}
                                  </span>
                                </div>
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "85px 1fr 55px 55px 75px 90px 90px", gap: "0.4rem", padding: "0.25rem 0.5rem", fontSize: "0.63rem", fontWeight: 700, color: C.subtle, textTransform: "uppercase" }}>
                                <span>SKU</span><span>Item Name</span><span>Needed</span><span>Picked</span><span>RFID</span><span></span><span></span>
                              </div>

                              {po.items.map((it) => (
                                <div key={it.sku} style={{ display: "grid", gridTemplateColumns: "85px 1fr 55px 55px 75px 90px 90px", gap: "0.4rem", padding: "0.4rem 0.5rem", fontSize: "0.78rem", alignItems: "center", borderRadius: "0.35rem", background: C.panel2, marginBottom: "0.25rem" }}>
                                  <span style={{ fontFamily: "monospace", fontSize: "0.68rem", color: C.blue }}>{it.sku}</span>
                                  <span style={{ color: C.text }}>{it.name}</span>
                                  <span style={{ color: C.muted, textAlign: "center" }}>{it.qty}</span>
                                  <span style={{ color: it.picked >= it.qty ? C.green : C.yellow, textAlign: "center", fontWeight: 700 }}>{it.picked}</span>
                                  <span style={{ fontSize: "0.68rem", color: it.rfidTagged ? C.green : C.red, fontWeight: 600 }}>
                                    {it.rfidTagged ? "✓ Tagged" : "✗ Needed"}
                                  </span>
                                  <button
                                    className="v-btn"
                                    disabled={it.picked >= it.qty || !["pending", "in-progress", "draft"].includes(po.status)}
                                    onClick={(e) => { e.stopPropagation(); markPicked(po.poNumber, it.sku); }}
                                    style={{ background: it.picked >= it.qty ? C.panel3 : C.green, color: it.picked >= it.qty ? C.subtle : "#fff" }}
                                  >
                                    {it.picked >= it.qty ? "✓ All picked" : `+ Pick`}
                                  </button>
                                  <button
                                    className="v-btn"
                                    disabled={it.picked === 0}
                                    onClick={(e) => { e.stopPropagation(); toggleRFID(po.poNumber, it.sku); }}
                                    style={{ background: it.rfidTagged ? "rgba(var(--t-green-rgb),0.2)" : C.orange, color: it.rfidTagged ? C.green : "#fff" }}
                                  >
                                    {it.rfidTagged ? "✓ RFID on" : "Tag RFID"}
                                  </button>
                                </div>
                              ))}

                              <div style={{ marginTop: "0.55rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                <div style={{ flex: 1, height: 5, borderRadius: 3, background: C.panel }}>
                                  <div style={{ width: `${totalQty > 0 ? (totalPicked / totalQty) * 100 : 0}%`, height: "100%", borderRadius: 3, background: totalPicked >= totalQty ? C.green : C.yellow, transition: "width 0.3s" }} />
                                </div>
                                <span style={{ fontSize: "0.65rem", color: C.muted, whiteSpace: "nowrap" }}>{totalPicked}/{totalQty} picked</span>
                                {readyToShip && !["shipped", "complete"].includes(po.status) && (
                                  <button
                                    className="v-btn"
                                    onClick={(e) => { e.stopPropagation(); shipPO(po.poNumber); }}
                                    style={{ background: C.green, color: "#fff", padding: "0.3rem 0.7rem", fontSize: "0.72rem" }}
                                  >
                                    Ship to Ground →
                                  </button>
                                )}
                                {["shipped", "complete"].includes(po.status) && (
                                  <span style={{ fontSize: "0.68rem", color: C.green, fontWeight: 700, whiteSpace: "nowrap" }}>✓ Shipped to Ground</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── INVOICES page ─────────────────────────────────────── */}
              {activePage === "invoices" && (
                <div style={{ background: C.panel, borderRadius: "1rem", padding: "1.25rem 1.5rem", borderTop: `3px solid ${C.yellow}`, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
                  <h3 style={{ margin: "0 0 0.3rem", fontSize: "0.95rem", fontWeight: 700, color: C.text }}>Invoices Sent to Ground</h3>
                  <p style={{ margin: "0 0 0.85rem", fontSize: "0.75rem", color: C.muted }}>
                    When you ship items, an invoice is sent to NASA Ground. Ground uses this to verify they received everything on the list.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "120px 100px 90px 65px 100px 1fr", gap: "0.5rem", padding: "0.35rem 0.75rem", fontSize: "0.65rem", fontWeight: 700, color: C.subtle, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    <span>Invoice #</span><span>PO #</span><span>Issued</span><span>Units</span><span>Total</span><span>Status</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {invoices.map((inv) => (
                      <div key={inv.invNumber}>
                        <div style={{ display: "grid", gridTemplateColumns: "120px 100px 90px 65px 100px 1fr", gap: "0.5rem", padding: "0.55rem 0.75rem", borderRadius: "0.5rem", background: C.panel2, fontSize: "0.82rem", alignItems: "center" }}>
                          <span style={{ fontWeight: 700, color: C.yellow, fontFamily: "monospace", fontSize: "0.78rem" }}>{inv.invNumber}</span>
                          <span style={{ color: C.blue, fontFamily: "monospace", fontSize: "0.78rem" }}>{inv.poNumber}</span>
                          <span style={{ color: C.muted, fontSize: "0.75rem" }}>{inv.issuedDate}</span>
                          <span style={{ color: C.text, fontWeight: 600 }}>{inv.totalUnits}</span>
                          <span style={{ color: C.green, fontWeight: 700, fontSize: "0.82rem" }}>${inv.totalPrice.toFixed(2)}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Pill status={inv.status} />
                          </div>
                        </div>
                        {inv.items && inv.items.length > 0 && (
                          <div style={{ marginLeft: "1rem", marginTop: "0.3rem", marginBottom: "0.3rem", padding: "0.5rem 0.65rem", borderRadius: "0.4rem", background: C.panel3, fontSize: "0.75rem" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 55px 80px 90px", gap: "0.4rem", padding: "0.2rem 0", fontSize: "0.63rem", fontWeight: 700, color: C.subtle, textTransform: "uppercase" }}>
                              <span>Item</span><span style={{ textAlign: "center" }}>Qty</span><span style={{ textAlign: "right" }}>Unit Price</span><span style={{ textAlign: "right" }}>Line Total</span>
                            </div>
                            {inv.items.map((li, idx) => (
                              <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 55px 80px 90px", gap: "0.4rem", padding: "0.25rem 0", borderTop: "1px solid rgba(var(--t-border-rgb),0.06)", alignItems: "center" }}>
                                <span style={{ color: C.text }}>{li.name}</span>
                                <span style={{ color: C.muted, textAlign: "center" }}>{li.qty}</span>
                                <span style={{ color: C.muted, textAlign: "right" }}>${li.unitPrice.toFixed(2)}</span>
                                <span style={{ color: C.text, fontWeight: 600, textAlign: "right" }}>${(li.qty * li.unitPrice).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {invoices.length === 0 && (
                      <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: C.muted }}>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: C.text }}>No invoices yet</div>
                        <div style={{ fontSize: "0.8rem", marginTop: "0.3rem", color: C.subtle }}>Ship an order to auto-generate an invoice here.</div>
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: "1rem", padding: "0.75rem", borderRadius: "0.6rem", background: "rgba(var(--t-blue-rgb),0.07)", border: "1px solid rgba(var(--t-blue-rgb),0.2)", fontSize: "0.75rem", color: C.muted }}>
                    <b style={{ color: C.blue }}>How invoices work:</b> When you finish picking &amp; tagging items and mark them as shipped, an invoice is automatically generated and sent to NASA Ground Operations. Ground will verify the delivered items against this invoice line-by-line.
                  </div>
                </div>
              )}

              {/* ── SHIPMENTS page ────────────────────────────────────── */}
              {activePage === "shipments" && (
                <div style={{ background: C.panel, borderRadius: "1rem", padding: "1.25rem 1.5rem", borderTop: `3px solid ${C.green}`, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
                  <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", fontWeight: 700, color: C.text }}>My Shipments to NASA Ground</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                    {shipments.map((s) => {
                      const steps = [
                        { label: "Packed", done: true },
                        { label: "Picked Up", done: ["in-transit", "delivered", "complete"].includes(s.status) },
                        { label: "In Transit", done: ["in-transit", "delivered", "complete"].includes(s.status) },
                        { label: "Delivered to Ground", done: ["delivered", "complete"].includes(s.status) },
                      ];
                      return (
                        <div key={s.id} style={{ padding: "0.85rem", borderRadius: "0.6rem", background: C.panel2 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                              <span style={{ fontWeight: 700, color: C.text, fontSize: "0.9rem" }}>{s.id}</span>
                              <span style={{ fontFamily: "monospace", fontSize: "0.72rem", color: C.blue }}>{s.poNumber}</span>
                            </div>
                            <Pill status={s.status} />
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.75rem", color: C.muted, marginBottom: "0.6rem" }}>
                            <span>{s.items} items</span>
                            <span>Carrier: {s.carrier}</span>
                            <span>Shipped: {s.shipped}</span>
                          </div>
                          {s.tracking !== "—" && (
                            <div style={{ marginBottom: "0.6rem", fontSize: "0.68rem", color: C.subtle, fontFamily: "monospace", background: C.panel3, padding: "0.3rem 0.5rem", borderRadius: "0.3rem", display: "inline-block" }}>
                              Tracking: {s.tracking}
                            </div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: "0.3rem" }}>
                            {steps.map((step, i) => (
                              <div key={step.label} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : undefined }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
                                  <div style={{
                                    width: 20, height: 20, borderRadius: "50%",
                                    background: step.done ? C.green : C.panel3,
                                    display: "grid", placeItems: "center",
                                    fontSize: "0.6rem", color: step.done ? "#fff" : C.subtle, fontWeight: 700,
                                    border: step.done ? "none" : `1px solid rgba(var(--t-border-rgb),0.2)`,
                                  }}>
                                    {step.done ? "✓" : i + 1}
                                  </div>
                                  <span style={{ fontSize: "0.58rem", color: step.done ? C.text : C.subtle, fontWeight: step.done ? 600 : 400, whiteSpace: "nowrap" }}>{step.label}</span>
                                </div>
                                {i < steps.length - 1 && (
                                  <div style={{ flex: 1, height: 2, background: step.done ? C.green : C.panel3, margin: "0 0.3rem", marginBottom: "1rem" }} />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {shipments.length === 0 && (
                      <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: C.muted }}>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: C.text }}>No shipments yet</div>
                        <div style={{ fontSize: "0.8rem", marginTop: "0.3rem", color: C.subtle }}>Ship an order and it will appear here with live tracking.</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── PAST ORDERS page ──────────────────────────────────── */}
              {activePage === "past" && (
                <div style={{ background: C.panel, borderRadius: "1rem", padding: "1.25rem 1.5rem", borderTop: `3px solid ${C.muted}`, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: C.text }}>Completed Orders</h3>
                    <span style={{ fontSize: "0.72rem", color: C.muted }}>{pastOrders.length} orders</span>
                  </div>
                  {pastOrders.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: C.muted }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: C.text }}>No past orders yet</div>
                      <div style={{ fontSize: "0.8rem", marginTop: "0.3rem", color: C.subtle }}>Shipped orders will appear here for your records.</div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "108px 1fr 62px 62px 88px 78px", gap: "0.5rem", padding: "0.35rem 0.75rem", fontSize: "0.65rem", fontWeight: 700, color: C.subtle, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        <span>PO #</span><span>Description</span><span>Ordered</span><span>Shipped</span><span>Due</span><span>Status</span>
                      </div>
                      {pastOrders.map((po) => (
                        <div key={po.poNumber} style={{ display: "grid", gridTemplateColumns: "108px 1fr 62px 62px 88px 78px", gap: "0.5rem", padding: "0.55rem 0.75rem", borderRadius: "0.5rem", background: C.panel2, fontSize: "0.82rem", alignItems: "center" }}>
                          <span style={{ fontWeight: 700, color: C.blue, fontFamily: "monospace", fontSize: "0.77rem" }}>{po.poNumber}</span>
                          <span style={{ color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{po.description}</span>
                          <span style={{ color: C.muted, textAlign: "center" }}>{po.qtyOrdered}</span>
                          <span style={{ color: C.green, textAlign: "center", fontWeight: 600 }}>{po.qtyShipped}</span>
                          <span style={{ color: C.subtle, fontSize: "0.72rem" }}>{po.dueDate}</span>
                          <Pill status={po.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── PACKING RULES page ────────────────────────────────── */}
              {activePage === "packing" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ background: C.panel, borderRadius: "1rem", padding: "1.25rem 1.5rem", borderTop: `3px solid var(--t-accent)`, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
                    <h3 style={{ margin: "0 0 0.25rem", fontSize: "0.95rem", fontWeight: 700, color: C.text }}>NASA ISS Vendor Packing Requirements</h3>
                    <p style={{ margin: "0 0 1rem", fontSize: "0.75rem", color: C.muted }}>All shipments to Kennedy Space Center must comply with these specifications. Non-compliant packages will be rejected at Ground receiving.</p>

                    {/* CTB dimensions */}
                    <div style={{ marginBottom: "1rem" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--t-accent)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>Cargo Transfer Bag (CTB) Specifications</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                        {[
                          { dim: "48 cm", label: "Width (hatch-facing)" },
                          { dim: "40 cm", label: "Depth (handle to wall)" },
                          { dim: "33 cm", label: "Height (base to lid)" },
                        ].map((d) => (
                          <div key={d.label} style={{ background: C.panel2, borderRadius: "0.6rem", padding: "0.75rem 1rem", textAlign: "center" }}>
                            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--t-accent)", fontFamily: "monospace" }}>{d.dim}</div>
                            <div style={{ fontSize: "0.68rem", color: C.subtle, marginTop: "0.2rem" }}>{d.label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: "0.5rem", padding: "0.6rem 0.85rem", borderRadius: "0.5rem", background: "rgba(var(--t-accent-rgb),0.07)", border: "1px solid rgba(var(--t-accent-rgb),0.2)", fontSize: "0.75rem", color: C.muted }}>
                        <b style={{ color: "var(--t-accent)" }}>Max gross weight:</b> 15 kg per CTB. Items must be individually bagged in clear poly bags before placement inside a CTB.
                      </div>
                    </div>

                    {/* RFID tagging */}
                    <div style={{ marginBottom: "1rem" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: C.blue, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>RFID Tagging Requirements</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        {[
                          "Every individual item must carry a unique UHF RFID tag (EPC Gen 2, 860–960 MHz).",
                          "Tag must be placed on a flat, non-metallic surface of the item or its poly bag.",
                          "Do not place tags within 2 cm of metal surfaces — this causes read failures.",
                          "Verify all tags are readable before sealing the CTB (use Tag screen to confirm ✓ status).",
                          "Record each tag UID in the packing manifest — Ground will cross-check on receipt.",
                        ].map((rule, i) => (
                          <div key={i} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", padding: "0.45rem 0.65rem", background: C.panel2, borderRadius: "0.45rem", fontSize: "0.78rem", color: C.text }}>
                            <span style={{ color: C.blue, fontWeight: 700, flexShrink: 0, marginTop: "0.05rem" }}>{i + 1}.</span>
                            {rule}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Prohibited items */}
                    <div style={{ marginBottom: "1rem" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: C.red, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>Prohibited / Restricted Items</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem" }}>
                        {[
                          "Flammable liquids or aerosols",
                          "Loose granular or powder materials",
                          "Items with sharp unsheathed edges",
                          "Magnetic materials (unshielded)",
                          "Lithium batteries over 100 Wh",
                          "Pressurized containers",
                          "Items exceeding individual 5 kg limit",
                          "Food without NASA nutrition approval",
                        ].map((item) => (
                          <div key={item} style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.4rem 0.65rem", background: "rgba(var(--t-red-rgb),0.07)", borderRadius: "0.45rem", fontSize: "0.75rem", color: C.text }}>
                            <span style={{ color: C.red, fontWeight: 700, flexShrink: 0 }}>✗</span>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Labeling */}
                    <div style={{ marginBottom: "1rem" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>Labeling & Documentation</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        {[
                          { label: "Outer label", detail: "Vendor ID, PO number, CTB number, gross weight, item count — printed on all 4 sides." },
                          { label: "Packing slip", detail: "One copy inside the CTB, one copy taped to the exterior under clear film." },
                          { label: "Invoice", detail: 'Auto-generated when you click "Ship to Ground" — send the same INV number to your NASA point of contact.' },
                          { label: "Hazmat declaration", detail: "Required for any chemical reagents, batteries, or pressurized items. Submit form NASA-VND-HAZ-01 separately." },
                        ].map((row) => (
                          <div key={row.label} style={{ display: "flex", gap: "0.75rem", padding: "0.5rem 0.75rem", background: C.panel2, borderRadius: "0.45rem", fontSize: "0.78rem" }}>
                            <span style={{ color: C.green, fontWeight: 700, minWidth: "90px", flexShrink: 0 }}>{row.label}</span>
                            <span style={{ color: C.muted }}>{row.detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Checklist */}
                    <div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: C.subtle, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>Pre-Shipment Checklist</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem" }}>
                        {[
                          "All items picked against PO line items",
                          "Every item has an RFID tag (verified ✓)",
                          "Items individually bagged in clear poly",
                          "CTB weight ≤ 15 kg",
                          "CTB dimensions fit within spec",
                          "Packing slip inside + outside CTB",
                          "Outer label on all 4 sides",
                          "Invoice generated and INV # recorded",
                        ].map((item) => (
                          <div key={item} style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.4rem 0.65rem", background: "rgba(var(--t-green-rgb),0.06)", borderRadius: "0.45rem", fontSize: "0.75rem", color: C.text }}>
                            <span style={{ color: C.green, fontWeight: 700, flexShrink: 0 }}>☐</span>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </main>
        </section>
      </div>
    </>
  );
}
