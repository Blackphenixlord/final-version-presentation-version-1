import { useEffect, useMemo, useState, type ReactNode } from "react";
import { apiUrl } from "../lib/apiBase";

interface Container {
  id: string;
  code: string;
  capacity: number;
  used: number;
  items: string[];
}

interface TreeNode {
  id: string;
  kind: string;
  name: string;
  parentId: string | null;
  childrenIds: string[];
}

interface TreeData {
  rootId: string;
  nodes: Record<string, TreeNode>;
}

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

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

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
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-base font-medium transition hover-lift",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-95",
        className,
      )}
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
  right,
  className,
  hideHeader = false,
}: {
  title?: string;
  children: ReactNode;
  right?: ReactNode;
  className?: string;
  hideHeader?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-5 shadow-sm flex flex-col animate-fade-up",
        className,
      )}
      style={{
        background: "rgba(var(--t-border-rgb),0.06)",
        border: `1px solid rgba(var(--t-border-rgb),0.14)`,
      }}
    >
      {!hideHeader ? (
        <>
          {title ? (
            <div className="flex items-start justify-between gap-3">
              <div>
                <div
                  className="text-base font-semibold"
                  style={{ color: NORD.text }}
                >
                  {title}
                </div>
              </div>
              {right ? <div className="shrink-0">{right}</div> : null}
            </div>
          ) : null}
          <div className="mt-4 flex-1 min-h-0">{children}</div>
        </>
      ) : (
        <div className="flex-1 min-h-0">{children}</div>
      )}
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
      className="w-full rounded-xl px-4 py-3 text-base outline-none"
      style={{
        background: "rgba(var(--t-border-rgb),0.08)",
        color: NORD.text,
        border: `1px solid rgba(var(--t-border-rgb),0.25)`,
      }}
    />
  );
}

export default function PackScreen() {
  const [containers, setContainers] = useState<Container[]>([]);

  const [selectedOutside, setSelectedOutside] = useState<Container | null>(
    null,
  );
  const [selectedInside, setSelectedInside] = useState<Container | null>(null);
  const [outsideInput, setOutsideInput] = useState("");
  const [insideInput, setInsideInput] = useState("");
  const [packAmount, setPackAmount] = useState(1);
  const [packError, setPackError] = useState<string | null>(null);
  const [packSuccess, setPackSuccess] = useState<string | null>(null);
  const [tree, setTree] = useState<TreeData | null>(null);

  async function refreshContainers() {
    const res = await fetch(apiUrl("/containers"));
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as Container[];
    setContainers(data);
  }

  useEffect(() => {
    refreshContainers().catch(console.error);
  }, []);

  useEffect(() => {
    const key = "pack_autoselect_outside";
    let nextId = "";
    try {
      nextId = localStorage.getItem(key) || "";
    } catch {
      nextId = "";
    }
    if (!nextId) return;

    const target = containers.find((c) => c.id === nextId || c.code === nextId);
    if (!target) return;

    setSelectedOutside(target);
    setPackSuccess(`Loaded ${target.code} from preset flow.`);
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore localStorage failures
    }
  }, [containers]);

  useEffect(() => {
    if (!selectedOutside) { setTree(null); return; }
    fetch(apiUrl(`/containers/${encodeURIComponent(selectedOutside.id)}/tree`))
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setTree(d))
      .catch(() => setTree(null));
  }, [selectedOutside, containers]);

  function normalizeCode(value: string) {
    return value.replace(/[^0-9A-Za-z]/g, "").toLowerCase();
  }

  function findContainer(value: string) {
    const needle = normalizeCode(value);
    if (!needle) return null;
    return (
      containers.find(
        (c) =>
          normalizeCode(c.code) === needle || normalizeCode(c.id) === needle,
      ) ||
      containers.find(
        (c) =>
          normalizeCode(c.code).includes(needle) ||
          normalizeCode(c.id).includes(needle),
      ) ||
      null
    );
  }

  function ensureContainer(value: string) {
    const existing = findContainer(value);
    if (existing) return existing;
    const id = value.trim();
    if (!id) return null;
    const created: Container = {
      id,
      code: id,
      capacity: 10,
      used: 0,
      items: [],
    };
    setContainers((prev) =>
      prev.some((c) => c.id === created.id) ? prev : [...prev, created],
    );
    return created;
  }

  const liveOutside = useMemo(() => {
    if (!selectedOutside) return null;
    return (
      containers.find((c) => c.id === selectedOutside.id) ?? selectedOutside
    );
  }, [containers, selectedOutside]);

  const liveInside = useMemo(() => {
    if (!selectedInside) return null;
    return containers.find((c) => c.id === selectedInside.id) ?? selectedInside;
  }, [containers, selectedInside]);

  const roomLeft = liveOutside
    ? Math.max(0, liveOutside.capacity - liveOutside.items.length)
    : 0;
  const insideSize = liveInside ? liveInside.items.length : 0;

  function handleOutsideScan() {
    const value = outsideInput.trim();
    if (!value) return;
    const container = ensureContainer(value);
    if (container) {
      setSelectedOutside(container);
      setOutsideInput("");
      setPackError(null);
    }
  }

  function handleInsideScan() {
    const value = insideInput.trim();
    if (!value) return;
    const container = ensureContainer(value);
    if (container) {
      setSelectedInside(container);
      setInsideInput("");
      setPackError(null);
    }
  }

  function handlePack() {
    if (selectedOutside && selectedInside) {
      setPackError(null);
      setPackSuccess(null);
      const qty = Math.min(100, Math.max(1, Number(packAmount || 1)));
      const applyLocalPack = () => {
        setContainers((prev) => {
          const next = prev.map((c) => {
            if (c.id !== selectedOutside.id) return c;
            const items = [...c.items];
            const base = selectedInside.id;
            const startIdx = items.filter((id) =>
              id.startsWith(`${base}#`),
            ).length;
            for (let i = 0; i < qty; i += 1) {
              const suffix = startIdx + i + 1;
              const token = qty === 1 ? base : `${base}#${suffix}`;
              items.push(token);
            }
            return { ...c, items, used: items.length };
          });
          if (!next.some((c) => c.id === selectedInside.id)) {
            next.push({ ...selectedInside });
          }
          return next;
        });
        setPackSuccess(
          `Packed ${selectedInside.code} ×${qty} into ${selectedOutside.code}`,
        );
      };
      fetch(apiUrl("/containers/pack"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outsideId: selectedOutside.id,
          insideId: selectedInside.id,
          qty,
        }),
      })
        .then((r) => {
          if (!r.ok) throw new Error("PACK_FAILED");
          return r.json();
        })
        .then(() => {
          applyLocalPack();
          return refreshContainers();
        })
        .catch((err) => {
          console.error(err);
          applyLocalPack();
        });
    }
  }

  function handleClearAll() {
    setSelectedOutside(null);
    setSelectedInside(null);
    setOutsideInput("");
    setInsideInput("");
    setPackAmount(1);
    setPackError(null);
    setPackSuccess(null);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div style={{ fontSize: "1.15rem", fontWeight: 600, color: NORD.text }}>
          Pack
        </div>
      </div>
      {packError ? (
        <div
          className="rounded-2xl px-4 py-3"
          style={{
            background: "rgba(191,97,106,0.18)",
            border: "1px solid rgba(191,97,106,0.45)",
          }}
        >
          <div className="text-sm" style={{ color: NORD.text }}>
            {packError}
          </div>
        </div>
      ) : null}
      {packSuccess ? (
        <div
          className="rounded-2xl px-4 py-3"
          style={{
            background: "rgba(163,190,140,0.18)",
            border: "1px solid rgba(163,190,140,0.45)",
          }}
        >
          <div className="text-sm" style={{ color: NORD.text }}>
            {packSuccess}
          </div>
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          gap: "1rem",
        }}
      >
        <div style={{ gridColumn: "span 12" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
              gap: "1rem",
            }}
          >
            <div style={{ gridColumn: "span 12" }}>
              <Card title="Outside">
                <div
                  style={{
                    borderRadius: "1rem",
                    padding: "1rem",
                    background: "rgba(var(--t-border-rgb),0.08)",
                    border: "1px solid rgba(var(--t-border-rgb),0.10)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      borderRadius: "1rem",
                      padding: "1rem",
                      background: selectedOutside
                        ? "rgba(136,192,208,0.12)"
                        : "var(--t-surface2)",
                      border: selectedOutside
                        ? "1px solid rgba(136,192,208,0.35)"
                        : "1px solid rgba(236,239,244,0.06)",
                      color: selectedOutside ? NORD.text : NORD.subtle,
                      textAlign: "center",
                      minHeight: "84px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 600,
                    }}
                  >
                    {liveOutside ? liveOutside.code : "Nothing selected"}
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <Input
                      value={outsideInput}
                      onChange={setOutsideInput}
                      placeholder="Scan outside RFID/ID"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleOutsideScan();
                      }}
                    />
                    <Button onClick={handleOutsideScan}>Scan</Button>
                  </div>
                </div>
              </Card>
            </div>

            <div style={{ gridColumn: "span 12" }}>
              <Card title="Inside">
                <div
                  style={{
                    borderRadius: "1rem",
                    padding: "1rem",
                    background: "rgba(var(--t-border-rgb),0.08)",
                    border: "1px solid rgba(var(--t-border-rgb),0.10)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      borderRadius: "1rem",
                      padding: "1rem",
                      background: selectedInside
                        ? "rgba(136,192,208,0.12)"
                        : "var(--t-surface2)",
                      border: selectedInside
                        ? "1px solid rgba(136,192,208,0.35)"
                        : "1px solid rgba(236,239,244,0.06)",
                      color: selectedInside ? NORD.text : NORD.subtle,
                      textAlign: "center",
                      minHeight: "84px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 600,
                    }}
                  >
                    {liveInside ? liveInside.code : "Nothing selected"}
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <Input
                      value={insideInput}
                      onChange={setInsideInput}
                      placeholder="Scan inside RFID/ID"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleInsideScan();
                      }}
                    />
                    <Button onClick={handleInsideScan}>Scan</Button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: NORD.subtle,
                        minWidth: "78px",
                      }}
                    >
                      Amount
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={packAmount}
                      onChange={(e) => {
                        const next = Math.min(
                          100,
                          Math.max(1, Number(e.target.value || 1)),
                        );
                        setPackAmount(next);
                      }}
                      className="w-full rounded-xl px-4 py-2 text-base outline-none"
                      style={{
                        background: "rgba(var(--t-border-rgb),0.08)",
                        color: NORD.text,
                        border: `1px solid rgba(var(--t-border-rgb),0.25)`,
                      }}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Card title="Verify">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              borderRadius: "1rem",
              padding: "1rem",
              background: "rgba(var(--t-border-rgb),0.08)",
              border: "1px solid rgba(var(--t-border-rgb),0.10)",
            }}
          >
            <div style={{ fontSize: "0.85rem", color: NORD.subtle }}>
              Outside contents
            </div>
            <div
              style={{
                marginTop: "0.5rem",
                fontSize: "2rem",
                fontWeight: 700,
                color: NORD.text,
              }}
            >
              {liveOutside ? liveOutside.items.length : 0}
            </div>
          </div>
          <div
            style={{
              borderRadius: "1rem",
              padding: "1rem",
              background: "rgba(var(--t-border-rgb),0.08)",
              border: "1px solid rgba(var(--t-border-rgb),0.10)",
            }}
          >
            <div style={{ fontSize: "0.85rem", color: NORD.subtle }}>
              Inside contents
            </div>
            <div
              style={{
                marginTop: "0.5rem",
                fontSize: "2rem",
                fontWeight: 700,
                color: NORD.text,
              }}
            >
              {liveInside ? liveInside.items.length : 0}
            </div>
          </div>
          <div
            style={{
              borderRadius: "1rem",
              padding: "1rem",
              background: "rgba(var(--t-border-rgb),0.08)",
              border: "1px solid rgba(var(--t-border-rgb),0.10)",
            }}
          >
            <div style={{ fontSize: "0.85rem", color: NORD.subtle }}>
              Room left
            </div>
            <div
              style={{
                marginTop: "0.5rem",
                fontSize: "1.5rem",
                fontWeight: 600,
                color: NORD.text,
              }}
            >
              {roomLeft}
            </div>
          </div>
          <div
            style={{
              borderRadius: "1rem",
              padding: "1rem",
              background: "rgba(var(--t-border-rgb),0.08)",
              border: "1px solid rgba(var(--t-border-rgb),0.10)",
            }}
          >
            <div style={{ fontSize: "0.85rem", color: NORD.subtle }}>
              Inside size
            </div>
            <div
              style={{
                marginTop: "0.5rem",
                fontSize: "1.5rem",
                fontWeight: 600,
                color: NORD.text,
              }}
            >
              {insideSize}
            </div>
          </div>
        </div>
      </Card>

      {tree && tree.nodes[tree.rootId] ? (
        <Card title="Contents Tree">
          <div style={{ fontSize: "0.85rem", fontFamily: "monospace" }}>
            {(function renderBranch(nodeId: string, depth: number): ReactNode[] {
              const node = tree.nodes[nodeId];
              if (!node) return [];
              const indent = depth * 16;
              const kindColor = node.kind === "CTB" ? NORD.blue : node.kind === "Bob" ? NORD.yellow : NORD.muted;
              const rows: ReactNode[] = [
                <div key={nodeId} style={{ paddingLeft: indent, paddingTop: 3, paddingBottom: 3, color: NORD.text }}>
                  <span style={{ color: kindColor, fontWeight: 600 }}>{node.kind}</span>
                  {" "}
                  <span style={{ color: NORD.subtle }}>{node.name || node.id}</span>
                </div>
              ];
              for (const cid of node.childrenIds) {
                rows.push(...renderBranch(cid, depth + 1));
              }
              return rows;
            })(tree.rootId, 0)}
          </div>
        </Card>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "0.75rem",
        }}
      >
        <Button
          onClick={handlePack}
          disabled={!selectedOutside || !selectedInside}
        >
          Pack
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            if (!selectedOutside || !selectedInside) return;
            setPackError(null);
            setPackSuccess(null);
            fetch(apiUrl("/unpack"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                outsideId: selectedOutside.id,
                insideId: selectedInside.id,
              }),
            })
              .then((r) => {
                if (!r.ok) throw new Error("UNPACK_FAILED");
                return r.json();
              })
              .then(() => {
                setPackSuccess(
                  `Unpacked ${selectedInside.code} from ${selectedOutside.code}`
                );
                return refreshContainers();
              })
              .catch(() => {
                setPackError("Unpack failed — items may not be packed together");
              });
          }}
          disabled={!selectedOutside || !selectedInside}
        >
          Unpack
        </Button>
        <Button variant="danger" onClick={handleClearAll}>
          Clear all
        </Button>
      </div>
    </div>
  );
}
