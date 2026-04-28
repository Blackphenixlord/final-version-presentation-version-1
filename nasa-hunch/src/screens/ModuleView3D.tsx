// src/screens/ModuleView3D.tsx — Interactive 3D DSLM (Deep Space Logistics Module)
// Geometry matches the real NASA DSLM: 3.7 m diameter × 4 m cylinder
// Cross-section: S-1 (top), C1 (upper-left), C2 (upper-right),
//                S-3 (lower-left), S-2 (lower-right), S-4 (under floor)
// Translation pathway clear in center (1.143 m × 0.813 m)

import { useEffect, useMemo, useRef, useState, useCallback, Suspense } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Text, RoundedBox, Html } from "@react-three/drei";
import * as THREE from "three";
import { apiUrl } from "../lib/apiBase";
import { useTheme } from "../lib/theme";

/* ── Theme palettes ────────────────────────── */
const DARK_C = {
  bg: "#0b0e14", panel: "#13161e", panel2: "#1a1e28", panel3: "#252a36",
  text: "#e6edf3", muted: "#9ba4b0", subtle: "#636d7c",
  blue: "#88c0d0", blue2: "#81a1c1", blue3: "#5e81ac",
  green: "#a3be8c", yellow: "#d08770", red: "#bf616a", purple: "#b48ead",
  surfRgb: "19,22,30", bordRgb: "230,237,243", dimRgb: "37,42,54", blueRgb: "136,192,208",
  hull: "#1a1e28", gridLine: "#252a36", canvasBg: "#0b0e14",
};
const LIGHT_C = {
  bg: "#ECEFF4", panel: "#E5E9F0", panel2: "#D8DEE9", panel3: "#CBD2DE",
  text: "#2E3440", muted: "#3B4252", subtle: "#4C566A",
  blue: "#5E81AC", blue2: "#81A1C1", blue3: "#88C0D0",
  green: "#A3BE8C", yellow: "#D08770", red: "#BF616A", purple: "#B48EAD",
  surfRgb: "229,233,240", bordRgb: "59,66,82", dimRgb: "216,222,233", blueRgb: "94,129,172",
  hull: "#4C566A", gridLine: "#667080", canvasBg: "#D8DEE9",
};
let C = DARK_C;

/* ── Types ────────────────────────────────── */
type StowLoc = {
  id: string; shelf: string; depth: string; level: string; status: string;
  unitId?: string | null; unitName?: string | null; unitKind?: string | null;
};
type SelSlot = StowLoc | null;
type LogEntry = { type: string; unitId?: string; payload?: any; when: string };
type ModuleProps = { mode?: "ground" | "crew"; focusLocationId?: string; compact?: boolean };
type ContainerChild = { id: string; name: string; kind: string; children?: ContainerChild[] };

/* ── DSLM Real Geometry ──────────────────── */
// Cross-section positions (y, z) for each stack center within the cylinder
// Module runs along X-axis: FWD at x=-2, AFT at x=+2
const STACK_POS: Record<string, [number, number]> = {
  S1: [0.9,  0],      // top center
  S2: [-0.1, 0.72],   // lower-right
  S3: [-0.1, -0.72],  // lower-left
};
// Stack face: 0.85m wide × 1.0m tall
const STACK_W = 0.85;
const STACK_H = 1.0;
// Module length = 4m, depths D1-D4 each span 1m
const DEPTH_X: Record<string, number> = { D1: -1.5, D2: -0.5, D3: 0.5, D4: 1.5 };
// Levels L1-L12 → 4 cols × 3 rows on each face
function levelOffset(level: string): [number, number] {
  const n = Math.max(0, parseInt(level.replace("L", ""), 10) - 1);
  const col = n % 4;
  const row = Math.floor(n / 4);
  const dy = (1 - row) * (STACK_H / 3);
  const dz = (col - 1.5) * (STACK_W / 4);
  return [dy, dz];
}

function slotPosition(loc: StowLoc): [number, number, number] {
  const sp = STACK_POS[loc.shelf] ?? [0, 0];
  const x = DEPTH_X[loc.depth] ?? 0;
  const [dy, dz] = levelOffset(loc.level);
  return [x, sp[0] + dy, sp[1] + dz];
}

function statusColor(s: string): string {
  if (s === "occupied") return C.green;
  if (s === "reserved") return C.yellow;
  return C.blue3;
}

function kindColor(kind: string | null | undefined): string {
  if (!kind) return C.subtle;
  const k = kind.toLowerCase();
  if (k === "ctb") return C.blue;
  if (k === "bob") return C.yellow;
  if (k === "meal") return C.purple;
  if (k === "irregular") return C.red;
  return C.muted;
}

function eventColor(type: string): string {
  switch (type) {
    case "STOW": return C.green;
    case "PACK": case "UNPACK": return C.blue;
    case "MOVE": return C.blue2;
    case "REMOVE": case "RETURN": return C.yellow;
    case "DISPOSE": return C.red;
    case "RECEIVE_COUNT": return C.purple;
    default: return C.subtle;
  }
}

function eventLabel(type: string): string {
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

// Readable stack names
const STACK_LABEL: Record<string, string> = { S1: "S-1", S2: "S-2", S3: "S-3" };

/* ── Module Hull — Real DSLM shape ────────── */
function ModuleHull() {
  const R = 1.85; // 3.7m diameter / 2
  const L = 4; // 4m length
  return (
    <group>
      {/* Main cylinder shell */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[R, R, L, 48, 1, true]} />
        <meshStandardMaterial color={C.hull} transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* End rings — FWD (hatch) and AFT (engine) */}
      {([-L / 2, L / 2] as number[]).map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <ringGeometry args={[R - 0.08, R, 48]} />
          <meshStandardMaterial color={C.blue3} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* FWD hatch opening */}
      <mesh position={[-L / 2 - 0.01, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.55, 32]} />
        <meshStandardMaterial color={C.panel2} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      {/* FWD label */}
      <Text position={[-L / 2 - 0.05, R + 0.2, 0]} fontSize={0.15} color={C.subtle} anchorX="center" font={undefined}>
        FWD · HATCH
      </Text>
      {/* AFT label */}
      <Text position={[L / 2 + 0.05, R + 0.2, 0]} fontSize={0.15} color={C.subtle} anchorX="center" font={undefined}>
        AFT · ENGINE
      </Text>
      {/* Floor panel */}
      <mesh position={[0, -0.65, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[L, 0.04, R * 1.6]} />
        <meshStandardMaterial color={C.hull} transparent opacity={0.4} />
      </mesh>
      {/* Translation pathway markers */}
      <mesh position={[0, -0.63, 0]}>
        <boxGeometry args={[L, 0.01, 0.813]} />
        <meshStandardMaterial color={C.blue3} transparent opacity={0.15} />
      </mesh>
      {/* Floor access hatches — every 0.5m */}
      {[-1.5, -1, -0.5, 0, 0.5, 1, 1.5].map((hx) => (
        <mesh key={hx} position={[hx, -0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.35, 0.65]} />
          <meshStandardMaterial color={C.blue3} transparent opacity={0.08} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Center pathway label */}
      <Text position={[0, -0.55, 0]} fontSize={0.08} color={C.subtle} anchorX="center" rotation={[-Math.PI / 2, 0, 0]} font={undefined}>
        TRANSLATION PATHWAY
      </Text>
      {/* C1 zone (upper-left curved-back column) */}
      <RoundedBox args={[L * 0.9, 0.7, 0.5]} radius={0.05} position={[0, 0.55, -0.9]}>
        <meshStandardMaterial color={C.panel3} transparent opacity={0.12} />
      </RoundedBox>
      <Text position={[0, 0.95, -0.9]} fontSize={0.1} color={C.subtle} anchorX="center" font={undefined}>
        C1
      </Text>
      {/* C2 zone (upper-right curved-back column) */}
      <RoundedBox args={[L * 0.9, 0.7, 0.5]} radius={0.05} position={[0, 0.55, 0.9]}>
        <meshStandardMaterial color={C.panel3} transparent opacity={0.12} />
      </RoundedBox>
      <Text position={[0, 0.95, 0.9]} fontSize={0.1} color={C.subtle} anchorX="center" font={undefined}>
        C2
      </Text>
      {/* S-4 zone (under floor) */}
      <RoundedBox args={[L * 0.8, 0.5, 1.0]} radius={0.05} position={[0, -1.1, 0]}>
        <meshStandardMaterial color={C.panel3} transparent opacity={0.1} />
      </RoundedBox>
      <Text position={[0, -1.4, 0]} fontSize={0.1} color={C.subtle} anchorX="center" font={undefined}>
        S-4 · LOCKERS
      </Text>
    </group>
  );
}

/* ── Stack Frame — wire frame around each stack ── */
function StackFrame({ shelf }: { shelf: string }) {
  const sp = STACK_POS[shelf];
  if (!sp) return null;
  const [cy, cz] = sp;
  const frameW = STACK_W + 0.08;
  const frameH = STACK_H + 0.35;
  const frameL = 4.1;
  const edgeColor = shelf === "S1" ? C.blue : shelf === "S2" ? C.green : C.purple;
  return (
    <group position={[0, cy, cz]}>
      {/* Stack outline box */}
      <mesh>
        <boxGeometry args={[frameL, frameH, frameW]} />
        <meshStandardMaterial color={edgeColor} wireframe transparent opacity={0.15} />
      </mesh>
      {/* Depth separators — vertical planes */}
      {[-1, 0, 1].map((dx) => (
        <mesh key={dx} position={[dx, 0, 0]}>
          <planeGeometry args={[0.01, frameH]} />
          <meshStandardMaterial color={edgeColor} transparent opacity={0.1} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Stack label */}
      <Text position={[0, frameH / 2 + 0.12, 0]} fontSize={0.14} color={edgeColor} anchorX="center" anchorY="middle" font={undefined} fontWeight={700}>
        {STACK_LABEL[shelf] ?? shelf}
      </Text>
      {/* Depth labels — only on S1 (top stack, most visible) */}
      {shelf === "S1" && (["D1", "D2", "D3", "D4"] as const).map((d) => (
        <Text key={d} position={[DEPTH_X[d], -frameH / 2 - 0.12, frameW / 2 + 0.08]}
          fontSize={0.09} color={C.subtle} anchorX="center" anchorY="middle" font={undefined} fontWeight={600}>
          {d}
        </Text>
      ))}
    </group>
  );
}

/* ── Single stow slot (CTB position) ──────── */
function SlotBox({
  loc, selected, highlighted, dimmed, fresh, onSelect, onDoubleClick,
}: {
  loc: StowLoc; selected: boolean; highlighted: boolean; dimmed: boolean; fresh: boolean;
  onSelect: (l: StowLoc) => void; onDoubleClick: (l: StowLoc) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const baseColor = useMemo(() => highlighted ? "#EBCB8B" : statusColor(loc.status), [loc.status, highlighted]);
  const [x, y, z] = slotPosition(loc);
  const pulseRef = useRef(0);
  // CTB-sized slot: ~0.21m wide (z) × 0.33m tall (y) × 0.9m deep (x along module)
  const slotW = (STACK_W / 4) * 0.85;
  const slotH = (STACK_H / 3) * 0.85;
  const slotD = 0.85;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (fresh) pulseRef.current += delta * 6;
    else pulseRef.current = 0;
    const pulse = fresh ? 1 + Math.sin(pulseRef.current) * 0.15 : 1;
    const scale = (selected ? 1.15 : hovered ? 1.08 : highlighted ? 1.1 : 1) * pulse;
    meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.12);
  });

  const baseOpacity = dimmed ? 0.1 : selected ? 0.92 : hovered ? 0.75 : highlighted ? 0.85 : fresh ? 0.8 : 0.45;

  return (
    <RoundedBox
      ref={meshRef}
      args={[slotD, slotH, slotW]}
      radius={0.02}
      position={[x, y, z]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(loc); }}
      onDoubleClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onDoubleClick(loc); }}
    >
      <meshStandardMaterial
        color={fresh ? C.green : baseColor}
        transparent opacity={baseOpacity}
        emissive={fresh ? C.green : baseColor}
        emissiveIntensity={fresh ? 0.6 : selected ? 0.45 : highlighted ? 0.5 : hovered ? 0.3 : 0.15}
      />
    </RoundedBox>
  );
}

/* ── Floating label on selected slot ──────── */
function SlotLabel({ loc }: { loc: StowLoc }) {
  const [x, y, z] = slotPosition(loc);
  return (
    <Html position={[x, y + 0.35, z]} center style={{ pointerEvents: "none" }}>
      <div style={{
      background: `rgba(${C.surfRgb},0.92)`, border: `1px solid ${C.blue}`, borderRadius: "0.5rem",
        padding: "0.35rem 0.65rem", color: C.text, fontSize: "0.72rem", fontFamily: "monospace",
        whiteSpace: "nowrap", backdropFilter: "blur(6px)", boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}>
        <span style={{ fontWeight: 700, color: C.blue }}>{loc.id}</span>
        {loc.unitName ? (
          <span style={{ marginLeft: "0.5rem", color: kindColor(loc.unitKind), fontWeight: 600 }}>
            {loc.unitName}
          </span>
        ) : (
          <span style={{ marginLeft: "0.5rem", color: statusColor(loc.status), fontWeight: 600 }}>
            {loc.status.toUpperCase()}
          </span>
        )}
      </div>
    </Html>
  );
}

/* ── Slow auto-rotation ───────────────────── */
function AutoRotate({ enabled }: { enabled: boolean }) {
  const { camera } = useThree();
  useFrame((_, delta) => {
    if (!enabled) return;
    camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), delta * 0.08);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/* ── Receiving dock visual ────────────────── */
function ReceiveDock({ count }: { count: number }) {
  const active = count > 0;
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    if (!ref.current || !active) return;
    ref.current.rotation.y += delta * 0.5;
  });
  return (
    <group position={[-3.2, -1.5, 0]}>
      <RoundedBox args={[1.2, 0.15, 1.4]} radius={0.04}>
        <meshStandardMaterial color={active ? C.green : C.panel3} transparent opacity={0.5}
          emissive={active ? C.green : "#000"} emissiveIntensity={active ? 0.3 : 0} />
      </RoundedBox>
      {active && (
        <mesh ref={ref} position={[0, 0.3, 0]}>
          <octahedronGeometry args={[0.12]} />
          <meshStandardMaterial color={C.green} emissive={C.green} emissiveIntensity={0.5} transparent opacity={0.8} />
        </mesh>
      )}
      <Text position={[0, 0.55, 0]} fontSize={0.1} color={active ? C.green : C.subtle}
        anchorX="center" anchorY="middle" font={undefined}>
        {active ? `RECEIVING (${count})` : "DOCK"}
      </Text>
    </group>
  );
}

/* ── Trash / disposal zone visual ─────────── */
function TrashZone({ count }: { count: number }) {
  const hasTrash = count > 0;
  return (
    <group position={[3.2, -1.5, 0]}>
      <RoundedBox args={[1.2, 0.15, 1.4]} radius={0.04}>
        <meshStandardMaterial color={hasTrash ? C.red : C.panel3} transparent opacity={0.5}
          emissive={hasTrash ? C.red : "#000"} emissiveIntensity={hasTrash ? 0.2 : 0} />
      </RoundedBox>
      {hasTrash && (
        <RoundedBox args={[0.35, 0.3, 0.35]} radius={0.03} position={[0, 0.25, 0]}>
          <meshStandardMaterial color={C.red} transparent opacity={0.4} emissive={C.red} emissiveIntensity={0.15} />
        </RoundedBox>
      )}
      <Text position={[0, hasTrash ? 0.55 : 0.35, 0]} fontSize={0.1} color={hasTrash ? C.red : C.subtle}
        anchorX="center" anchorY="middle" font={undefined}>
        {hasTrash ? `DISPOSED (${count})` : "DISPOSAL"}
      </Text>
    </group>
  );
}

/* ── Container contents tree (double-click popup) ── */
function ContentsTree({ tree, onClose }: { tree: ContainerChild[]; onClose: () => void }) {
  function renderNode(node: ContainerChild, depth: number) {
    return (
      <div key={node.id} style={{ paddingLeft: depth * 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0", fontSize: "0.72rem" }}>
          <span style={{ width: 6, height: 6, borderRadius: 2, background: kindColor(node.kind), flexShrink: 0 }} />
          <span style={{ color: C.text, fontWeight: 600 }}>{node.name || node.id}</span>
          <span style={{ color: C.subtle, fontSize: "0.6rem" }}>{node.kind}</span>
        </div>
        {node.children?.map((ch) => renderNode(ch, depth + 1))}
      </div>
    );
  }
  return (
    <div style={{
      position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
      background: `rgba(${C.surfRgb},0.96)`, border: `1px solid ${C.blue}44`, borderRadius: "0.75rem",
      padding: "1rem", minWidth: "260px", maxWidth: "400px", maxHeight: "350px",
      overflowY: "auto", zIndex: 20, backdropFilter: "blur(12px)", boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: C.blue, textTransform: "uppercase" }}>Contents</span>
        <button onClick={onClose} style={{
          background: C.panel2, border: "none", color: C.muted, cursor: "pointer",
          borderRadius: "0.35rem", padding: "0.2rem 0.5rem", fontSize: "0.68rem", fontWeight: 600,
        }}>Close</button>
      </div>
      {tree.length === 0 && <div style={{ color: C.subtle, fontSize: "0.72rem", fontStyle: "italic" }}>Empty — nothing inside</div>}
      {tree.map((n) => renderNode(n, 0))}
    </div>
  );
}

/* ── Camera focus animation for locator mode ── */
function CameraFocus({ target }: { target: [number, number, number] }) {
  const { camera } = useThree();
  const goalPos = useMemo(() => {
    const [tx, ty, tz] = target;
    // Position camera slightly offset from the target slot
    return new THREE.Vector3(tx + 2.5, ty + 1.5, tz + 2.5);
  }, [target]);
  const goalLook = useMemo(() => new THREE.Vector3(...target), [target]);

  useFrame(() => {
    camera.position.lerp(goalPos, 0.04);
    const look = new THREE.Vector3();
    camera.getWorldDirection(look);
    const currentLook = new THREE.Vector3().addVectors(camera.position, look);
    currentLook.lerp(goalLook, 0.04);
    camera.lookAt(goalLook);
  });
  return null;
}

/* ── Main 3D scene export ─────────────────── */
export default function ModuleView3D({ mode = "ground", focusLocationId, compact = false }: ModuleProps) {
  const { theme } = useTheme();
  C = theme === "dark" ? DARK_C : LIGHT_C;
  const [locations, setLocations] = useState<StowLoc[]>([]);
  const [selected, setSelected] = useState<SelSlot>(null);
  // stowTarget removed — stowing is not available in the 3D module
  const [interacting, setInteracting] = useState(false);
  const [filter, setFilter] = useState<"all" | "empty" | "occupied">("all");
  const [depthFilter, setDepthFilter] = useState<"all" | "D1" | "D2" | "D3" | "D4">("all");
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<LogEntry[]>([]);
  const [inboundCount, setInboundCount] = useState(0);
  const [disposedCount, setDisposedCount] = useState(0);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [contentsTree, setContentsTree] = useState<ContainerChild[] | null>(null);
  const [resettingModel, setResettingModel] = useState(false);
  const interactRef = useRef(false);
  const prevStatusRef = useRef<Map<string, string>>(new Map());

  // Poll stow locations + detect changes for animation
  useEffect(() => {
    let live = true;
    function poll() {
      fetch(apiUrl("/stow/locations"))
        .then((r) => (r.ok ? r.json() : []))
        .then((d: StowLoc[]) => {
          if (!live || !Array.isArray(d)) return;
          const changed = new Set<string>();
          const prev = prevStatusRef.current;
          for (const loc of d) {
            const old = prev.get(loc.id);
            if (old !== undefined && old !== loc.status) changed.add(loc.id);
            prev.set(loc.id, loc.status);
          }
          if (changed.size > 0) {
            setFreshIds((f) => new Set([...f, ...changed]));
            setTimeout(() => {
              setFreshIds((f) => {
                const next = new Set(f);
                changed.forEach((id) => next.delete(id));
                return next;
              });
            }, 3000);
          }
          setLocations(d);
        })
        .catch(() => {});
    }
    poll();
    const id = window.setInterval(poll, 4000);
    return () => { live = false; window.clearInterval(id); };
  }, []);

  // Poll activity logs
  useEffect(() => {
    let live = true;
    function poll() {
      fetch(apiUrl("/logs"))
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => {
          if (!live || !Array.isArray(d)) return;
          setEvents(d.slice(-20).reverse());
          setDisposedCount(d.filter((e: LogEntry) => e.type === "DISPOSE").length);
        })
        .catch(() => {});
    }
    poll();
    const id = window.setInterval(poll, 5000);
    return () => { live = false; window.clearInterval(id); };
  }, []);

  // Poll inbound shipments count
  useEffect(() => {
    let live = true;
    function poll() {
      fetch(apiUrl("/shipments/inbound"))
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => {
          if (!live || !Array.isArray(d)) return;
          setInboundCount(d.filter((s: any) => s.status !== "complete").length);
        })
        .catch(() => {});
    }
    poll();
    const id = window.setInterval(poll, 8000);
    return () => { live = false; window.clearInterval(id); };
  }, []);

  const resetModelOccupancy = useCallback(async () => {
    setResettingModel(true);
    try {
      const res = await fetch(apiUrl("/stow/reset"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("RESET_FAILED");

      const refresh = await fetch(apiUrl("/stow/locations"));
      if (refresh.ok) {
        const data = await refresh.json();
        if (Array.isArray(data)) setLocations(data);
      }

      setSelected(null);
      setSearch("");
      setContentsTree(null);
      setFreshIds(new Set());
      prevStatusRef.current = new Map();
    } catch (_) {
      // Keep the current scene if reset fails.
    }
    setResettingModel(false);
  }, []);

  // Double-click: fetch container tree
  const handleDoubleClick = useCallback((loc: StowLoc) => {
    if (!loc.unitId) return;
    fetch(apiUrl(`/containers/${loc.unitId}/tree`))
      .then((r) => (r.ok ? r.json() : { children: [] }))
      .then((d) => setContentsTree(d.children ?? []))
      .catch(() => setContentsTree([]));
  }, []);

  // Single click handler
  const handleSelect = useCallback((loc: StowLoc) => {
    setSelected(loc);
    setSearch("");
    setContentsTree(null);
  }, []);

  const searchNeedle = search.trim().toLowerCase();
  const matchedIds = useMemo(() => {
    if (!searchNeedle) return new Set<string>();
    const s = new Set<string>();
    for (const loc of locations) {
      const hay = `${loc.id} ${loc.unitId ?? ""} ${loc.unitName ?? ""} ${loc.unitKind ?? ""}`.toLowerCase();
      if (hay.includes(searchNeedle)) s.add(loc.id);
    }
    return s;
  }, [locations, searchNeedle]);

  const hasSearch = searchNeedle.length > 0;

  const filtered = useMemo(
    () => {
      let list = filter === "all" ? locations : locations.filter((l) => l.status === filter);
      if (depthFilter !== "all") list = list.filter((l) => l.depth === depthFilter);
      return list;
    },
    [locations, filter, depthFilter],
  );

  const counts = useMemo(() => {
    const c = { empty: 0, occupied: 0 };
    locations.forEach((l) => { if (l.status in c) c[l.status as keyof typeof c]++; });
    return c;
  }, [locations]);

  // Focus mode: find the target location for camera zoom + dimming
  const focusLoc = useMemo(
    () => (focusLocationId ? locations.find((l) => l.id === focusLocationId) ?? null : null),
    [locations, focusLocationId],
  );
  const focusPos = useMemo<[number, number, number] | null>(
    () => (focusLoc ? slotPosition(focusLoc) : null),
    [focusLoc],
  );
  const isFocusMode = !!focusLoc;

  const storedItems = useMemo(
    () => locations.filter((l) => l.unitId).sort((a, b) => (a.unitName ?? "").localeCompare(b.unitName ?? "")),
    [locations],
  );

  const handleSelectItem = useCallback((loc: StowLoc) => {
    setSelected(loc);
    setSearch("");
    setContentsTree(null);
  }, []);

  useEffect(() => () => { document.body.style.cursor = "auto"; }, []);

  const modeLabel = mode === "crew" ? "Crew Operations" : "Ground Operations";
  const modeAccent = mode === "crew" ? C.purple : C.blue;

  return (
    <div style={{ display: "flex", height: "100%", background: C.bg, fontFamily: "system-ui, sans-serif" }}>
      {/* ── Left panel (hidden in compact mode) ── */}
      {!compact && <div style={{ width: "280px", flexShrink: 0, padding: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem", borderRight: `1px solid rgba(${C.bordRgb},0.08)`, overflowY: "auto" }}>
        {/* Header with mode */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: modeAccent, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: C.subtle, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              DSLM 3D Module
            </div>
            <div style={{ fontSize: "0.62rem", color: modeAccent, fontWeight: 600 }}>{modeLabel}</div>
          </div>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items, slots\u2026"
          spellCheck={false}
          style={{
            width: "100%", padding: "0.45rem 0.6rem", borderRadius: "0.5rem",
            background: `rgba(${C.bordRgb},0.06)`, color: C.text,
            border: `1px solid rgba(${C.dimRgb},0.45)`, outline: "none",
            fontSize: "0.82rem", fontFamily: "inherit",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.blue; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = `rgba(${C.dimRgb},0.45)`; }}
        />

        {/* Search results */}
        {hasSearch && matchedIds.size > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", maxHeight: "160px", overflowY: "auto" }}>
            <div style={{ fontSize: "0.65rem", color: C.subtle, fontWeight: 600, textTransform: "uppercase" }}>
              {matchedIds.size} result{matchedIds.size !== 1 ? "s" : ""}
            </div>
            {locations.filter((l) => matchedIds.has(l.id)).map((loc) => (
              <button key={loc.id} onClick={() => handleSelectItem(loc)} style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.3rem 0.45rem", borderRadius: "0.4rem",
                background: selected?.id === loc.id ? `${C.blue}22` : "transparent",
                border: "none", color: C.text, cursor: "pointer", font: "inherit", fontSize: "0.72rem", textAlign: "left",
              }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, flexShrink: 0, background: statusColor(loc.status) }} />
                <span style={{ fontFamily: "monospace", fontWeight: 600, color: C.blue, flexShrink: 0 }}>{loc.id}</span>
                {loc.unitName && <span style={{ color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc.unitName}</span>}
              </button>
            ))}
          </div>
        )}
        {hasSearch && matchedIds.size === 0 && (
          <div style={{ fontSize: "0.72rem", color: C.subtle }}>No matches</div>
        )}

        {/* Activity feed */}
        {events.length > 0 && !hasSearch && (
          <div>
            <div style={{ fontSize: "0.62rem", color: C.subtle, fontWeight: 600, textTransform: "uppercase", marginBottom: "0.25rem" }}>
              Activity
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
              {events.slice(0, 2).map((ev, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "0.35rem",
                  padding: "0.25rem 0.4rem", borderRadius: "0.35rem",
                  background: i === 0 && freshIds.size > 0 ? `${eventColor(ev.type)}11` : "transparent",
                  fontSize: "0.68rem",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: eventColor(ev.type), flexShrink: 0 }} />
                  <span style={{ color: eventColor(ev.type), fontWeight: 600, flexShrink: 0 }}>{eventLabel(ev.type)}</span>
                  <span style={{ color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ev.unitId ?? ""}
                  </span>
                  <span style={{ marginLeft: "auto", fontSize: "0.58rem", color: C.subtle, flexShrink: 0 }}>
                    {new Date(ev.when).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Counts */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {([
            { label: "Empty", value: counts.empty, color: C.blue3, key: "empty" as const },
            { label: "Occupied", value: counts.occupied, color: C.green, key: "occupied" as const },
          ]).map((s) => (
            <button key={s.key} onClick={() => setFilter((f) => (f === s.key ? "all" : s.key))}
              aria-pressed={filter === s.key}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.35rem 0.55rem", borderRadius: "0.45rem",
                background: filter === s.key ? `${s.color}22` : "transparent",
                border: filter === s.key ? `1px solid ${s.color}44` : "1px solid transparent",
                cursor: "pointer", color: C.text, font: "inherit", textAlign: "left",
              }}>
              <span style={{ width: "9px", height: "9px", borderRadius: "3px", background: s.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: "0.75rem" }}>{s.label}</span>
              <span style={{ fontWeight: 700, fontSize: "0.78rem", color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
            </button>
          ))}
          {/* Depth layer filter */}
          <div style={{ marginTop: "0.3rem" }}>
            <div style={{ fontSize: "0.58rem", color: C.subtle, fontWeight: 600, textTransform: "uppercase", marginBottom: "0.2rem" }}>
              Depth Layer
            </div>
            <div style={{ display: "flex", gap: "0.25rem" }}>
              {(["all", "D1", "D2", "D3", "D4"] as const).map((d) => (
                <button key={d} onClick={() => setDepthFilter((f) => (f === d ? "all" : d))}
                  style={{
                    flex: 1, padding: "0.25rem 0", borderRadius: "0.35rem",
                    background: depthFilter === d ? `${C.blue}22` : "transparent",
                    border: depthFilter === d ? `1px solid ${C.blue}44` : `1px solid rgba(${C.dimRgb},0.3)`,
                    cursor: "pointer", color: depthFilter === d ? C.blue : C.muted,
                    font: "inherit", fontSize: "0.65rem", fontWeight: depthFilter === d ? 700 : 500,
                  }}>
                  {d === "all" ? "All" : d}
                </button>
              ))}
            </div>
          </div>
          {/* Pipeline status */}
          <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.15rem" }}>
            <div style={{ flex: 1, padding: "0.3rem", borderRadius: "0.4rem", background: `${C.green}15`, textAlign: "center", fontSize: "0.62rem" }}>
              <div style={{ fontWeight: 700, color: C.green, fontSize: "0.82rem" }}>{mode === "crew" ? storedItems.length : inboundCount}</div>
              <div style={{ color: C.subtle }}>{mode === "crew" ? "Available" : "Incoming"}</div>
            </div>
            <div style={{ flex: 1, padding: "0.3rem", borderRadius: "0.4rem", background: `${C.red}15`, textAlign: "center", fontSize: "0.62rem" }}>
              <div style={{ fontWeight: 700, color: C.red, fontSize: "0.82rem" }}>{disposedCount}</div>
              <div style={{ color: C.subtle }}>Disposed</div>
            </div>
          </div>
          <button
            onClick={() => { setFilter("all"); setDepthFilter("all"); setSelected(null); setSearch(""); setContentsTree(null); }}
            style={{
              marginTop: "0.2rem", padding: "0.3rem 0.55rem", borderRadius: "0.45rem",
              background: C.panel2, border: "none", color: C.muted, cursor: "pointer",
              fontSize: "0.68rem", fontWeight: 600, font: "inherit",
            }}>
            Reset View
          </button>
          {mode === "ground" && (
            <button
              onClick={resetModelOccupancy}
              disabled={resettingModel}
              style={{
                marginTop: "0.2rem", padding: "0.3rem 0.55rem", borderRadius: "0.45rem",
                background: C.red, border: "none", color: "#fff", cursor: resettingModel ? "default" : "pointer",
                fontSize: "0.68rem", fontWeight: 700, font: "inherit", opacity: resettingModel ? 0.6 : 1,
              }}>
              {resettingModel ? "Resetting Model…" : "Reset Model Occupancy"}
            </button>
          )}
        </div>

        {/* Selected slot detail */}
        {selected && (
          <div style={{ background: C.panel, borderRadius: "0.6rem", padding: "0.65rem", border: `1px solid ${C.blue}33` }}>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, color: C.subtle, textTransform: "uppercase", marginBottom: "0.35rem" }}>Selected Slot</div>
            <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.95rem", color: C.blue, marginBottom: "0.3rem" }}>{selected.id}</div>
            {([
              { k: "Stack", v: STACK_LABEL[selected.shelf] ?? selected.shelf },
              { k: "Position", v: selected.depth },
              { k: "Slot", v: selected.level },
              { k: "Status", v: selected.status.toUpperCase(), c: statusColor(selected.status) },
            ]).map((r) => (
              <div key={r.k} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", padding: "0.12rem 0" }}>
                <span style={{ color: C.subtle }}>{r.k}</span>
                <span style={{ fontWeight: 600, color: r.c ?? C.text }}>{r.v}</span>
              </div>
            ))}
            {selected.unitId && (
              <div style={{ marginTop: "0.4rem", padding: "0.45rem", borderRadius: "0.4rem", background: `rgba(${C.blueRgb},0.08)`, border: `1px solid rgba(${C.blueRgb},0.15)` }}>
                <div style={{ fontSize: "0.58rem", fontWeight: 700, color: C.subtle, textTransform: "uppercase", marginBottom: "0.2rem" }}>Contents</div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: kindColor(selected.unitKind) }}>
                  {selected.unitName ?? selected.unitId}
                </div>
                <div style={{ fontSize: "0.68rem", color: C.subtle, marginTop: "0.12rem" }}>
                  {selected.unitKind ?? "Item"} &middot; {selected.unitId}
                </div>
                {mode === "crew" && (
                  <div style={{ marginTop: "0.3rem", fontSize: "0.65rem", color: C.blue2, fontWeight: 600 }}>
                    Path: {STACK_LABEL[selected.shelf]} &rarr; {selected.depth} &rarr; {selected.level}
                  </div>
                )}
                <button
                  onClick={() => handleDoubleClick(selected)}
                  style={{
                    marginTop: "0.35rem", width: "100%", padding: "0.3rem", borderRadius: "0.35rem",
                    background: C.panel2, border: `1px solid ${C.panel3}`, color: C.blue,
                    cursor: "pointer", fontSize: "0.65rem", fontWeight: 600,
                  }}>
                  View Contents Tree
                </button>
              </div>
            )}
            {!selected.unitId && selected.status === "empty" && (
              <div style={{ marginTop: "0.4rem", fontSize: "0.68rem", color: C.subtle, fontStyle: "italic" }}>Slot is empty</div>
            )}
          </div>
        )}

        {/* Stored items list */}
        {storedItems.length > 0 && !hasSearch && (
          <div style={{ marginTop: "auto" }}>
            <div style={{ fontSize: "0.58rem", color: C.subtle, fontWeight: 600, textTransform: "uppercase", marginBottom: "0.25rem" }}>
              {mode === "crew" ? "Items You Can Access" : "Stored Items"} ({storedItems.length})
            </div>
            <div style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.1rem" }}>
              {storedItems.map((loc) => (
                <button key={loc.id} onClick={() => handleSelectItem(loc)} style={{
                  display: "flex", alignItems: "center", gap: "0.35rem",
                  padding: "0.25rem 0.4rem", borderRadius: "0.35rem",
                  background: selected?.id === loc.id ? `${C.blue}22` : "transparent",
                  border: "none", color: C.text, cursor: "pointer", font: "inherit", fontSize: "0.68rem", textAlign: "left",
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: 2, flexShrink: 0, background: kindColor(loc.unitKind) }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: C.muted }}>
                    {loc.unitName ?? loc.unitId}
                  </span>
                  <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: "0.58rem", color: C.subtle, flexShrink: 0 }}>{loc.id}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Layout legend */}
        {storedItems.length === 0 && !hasSearch && (
          <div style={{ marginTop: "auto" }}>
            <div style={{ fontSize: "0.58rem", color: C.subtle, marginBottom: "0.25rem", fontWeight: 600, textTransform: "uppercase" }}>DSLM Layout</div>
            <div style={{ fontSize: "0.65rem", color: C.muted, lineHeight: 1.5 }}>
              S-1 (top) · S-2 (right) · S-3 (left)<br />
              C1, C2 curved columns · S-4 lockers<br />
              4 depths (D1-D4) · 12 slots per depth<br />
              <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{locations.length}</span> total slots
            </div>
          </div>
        )}
      </div>}

      {/* ── 3D Canvas ── */}
      <div style={{ flex: 1, position: "relative" }}>
        <Canvas
          camera={{ position: [5, 3, 5], fov: 50, near: 0.1, far: 100 }}
          style={{ background: C.canvasBg }}
          onPointerDown={() => { interactRef.current = true; setInteracting(true); }}
          onPointerUp={() => { interactRef.current = false; setTimeout(() => setInteracting(false), 2000); }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[4, 6, 3]} intensity={1.0} />
          <directionalLight position={[-4, 3, -3]} intensity={0.3} />
          <pointLight position={[-3, 4, -2]} intensity={0.4} color={C.blue} />

          <Suspense fallback={null}>
            <ModuleHull />
            {["S1", "S2", "S3"].map((s) => <StackFrame key={s} shelf={s} />)}
            {filtered.map((loc) => (
              <SlotBox
                key={loc.id}
                loc={loc}
                selected={isFocusMode ? loc.id === focusLocationId : selected?.id === loc.id}
                highlighted={isFocusMode ? loc.id === focusLocationId : hasSearch && matchedIds.has(loc.id)}
                dimmed={isFocusMode ? loc.id !== focusLocationId : hasSearch && !matchedIds.has(loc.id)}
                fresh={freshIds.has(loc.id)}
                onSelect={handleSelect}
                onDoubleClick={handleDoubleClick}
              />
            ))}
            {(isFocusMode && focusLoc) && <SlotLabel loc={focusLoc} />}
            {(!isFocusMode && selected) && <SlotLabel loc={selected} />}
            {isFocusMode && focusPos && <CameraFocus target={focusPos} />}
            <ReceiveDock count={inboundCount} />
            <TrashZone count={disposedCount} />
          </Suspense>

          <OrbitControls enablePan enableZoom enableRotate minDistance={2} maxDistance={15} makeDefault />
          <AutoRotate enabled={!interacting && !selected && !isFocusMode} />
          <gridHelper args={[10, 10, C.gridLine, C.gridLine]} position={[0, -2.0, 0]} />
        </Canvas>

        {/* Mode badge */}
        {!compact && <div style={{
          position: "absolute", top: "0.75rem", right: "0.75rem",
          background: `${modeAccent}22`, border: `1px solid ${modeAccent}44`,
          borderRadius: "0.5rem", padding: "0.35rem 0.65rem",
          fontSize: "0.68rem", fontWeight: 700, color: modeAccent,
          backdropFilter: "blur(8px)", textTransform: "uppercase", letterSpacing: "0.04em",
        }}>
          {mode === "crew" ? "CREW VIEW" : "GROUND OPS"}
        </div>}

        {!compact && <div style={{
          position: "absolute", bottom: "0.75rem", left: "0.75rem",
          background: `rgba(${C.surfRgb},0.85)`, backdropFilter: "blur(8px)",
          borderRadius: "0.5rem", padding: "0.5rem 0.75rem",
          display: "flex", gap: "0.75rem", fontSize: "0.68rem", color: C.muted,
        }}>
          <span>Drag to orbit</span>
          <span>Scroll to zoom</span>
          <span>Click slot to inspect</span>
          <span>Double-click to view contents</span>
        </div>}

        {/* Container contents tree overlay */}
        {contentsTree !== null && (
          <ContentsTree tree={contentsTree} onClose={() => setContentsTree(null)} />
        )}
      </div>
    </div>
  );
}
