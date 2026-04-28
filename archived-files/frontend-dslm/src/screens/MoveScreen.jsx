import React, { useMemo, useState } from "react";

// MoveScreen: standalone screen module
// Uses shared UI primitives, but keeps a couple of tiny helpers local.
import { Card, Button, Input, useTheme } from "../components/ui";

function ScreenHeader({ title, right }) {
  const NORD = useTheme();
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-lg font-semibold" style={{ color: NORD.text }}>
          {title}
        </div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function Select({ value, onChange, options }) {
  const NORD = useTheme();
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="rounded-2xl px-4 py-3 text-lg outline-none"
      style={{
        background: NORD.panel2,
        color: NORD.text,
        border: `1px solid rgba(76,86,106,0.45)`,
      }}
    >
      {options.map((o) => (
        <option
          key={o}
          value={o}
          style={{ background: NORD.bg, color: NORD.text }}
        >
          {o}
        </option>
      ))}
    </select>
  );
}

function safeGet(obj, path, fallback) {
  try {
    const parts = Array.isArray(path)
      ? path
      : String(path).split(".").filter(Boolean);
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return fallback;
      cur = cur[p];
    }
    return cur == null ? fallback : cur;
  } catch {
    return fallback;
  }
}

function hashStringToInt(s) {
  const str = String(s ?? "");
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function normalizeId(x) {
  return String(x ?? "").trim();
}

function parseLocationPath(s) {
  const raw = String(s ?? "").trim();
  if (!raw) return { slotKey: "", chainIds: [] };
  const parts = raw
    .split("/")
    .map((p) => String(p ?? "").trim())
    .filter(Boolean);

  const slotKey = parts[0] ?? "";
  const chainIds = parts
    .slice(1)
    .map((p) => normalizeId(p))
    .filter(Boolean);

  return { slotKey, chainIds };
}

function getLocationMappingFromData(data) {
  return (
    safeGet(data, "stowedByLocation") ??
    safeGet(data, "locationToContainerId") ??
    safeGet(data, "slotToCtb") ??
    safeGet(data, "stowage") ??
    null
  );
}

function resolveContainerFromLocationPath({ pathStr, data, graphById }) {
  const { slotKey, chainIds } = parseLocationPath(pathStr);
  if (!slotKey) {
    return {
      slotKey: "",
      chainIds: [],
      topContainerId: "",
      targetContainerId: "",
    };
  }

  const mapping = getLocationMappingFromData(data);
  let topContainerId = "";

  if (mapping && typeof mapping === "object") {
    topContainerId = normalizeId(
      mapping[slotKey] ?? mapping?.[slotKey?.toUpperCase?.()] ?? "",
    );
  }

  // Default target is the top-level container at that slot.
  let targetContainerId = topContainerId;

  // If deeper path exists, use deepest segment that exists in the graph.
  if (chainIds.length) {
    for (const cid of chainIds) {
      const id = normalizeId(cid);
      if (!id) continue;
      if (graphById && graphById[id]) {
        targetContainerId = id;
      } else if (!graphById) {
        targetContainerId = id;
      }
    }
  }

  return { slotKey, chainIds, topContainerId, targetContainerId };
}

function ensureMockPath({ byId, rootId, chainIds }) {
  let cur = normalizeId(rootId);
  if (!cur || !byId?.[cur]) return { rootId, highlightId: "" };

  let highlightId = "";

  for (const rawId of chainIds ?? []) {
    const id = normalizeId(rawId);
    if (!id) continue;

    if (!byId[id]) {
      byId[id] = {
        id,
        name: id,
        parentId: cur,
        childrenIds: [],
        kind: id.startsWith("CTB")
          ? "CTB"
          : id.startsWith("BOB")
            ? "Bob"
            : id.startsWith("MEAL")
              ? "Meal"
              : id.startsWith("PKG")
                ? "Package"
                : "Item",
      };

      const curNode = byId[cur];
      const kids = Array.isArray(curNode?.childrenIds)
        ? curNode.childrenIds
        : [];
      if (!kids.includes(id)) {
        curNode.childrenIds = [...kids, id];
      }
    } else {
      const node = byId[id];
      if (!node.parentId) node.parentId = cur;
      const curNode = byId[cur];
      const kids = Array.isArray(curNode?.childrenIds)
        ? curNode.childrenIds
        : [];
      if (!kids.includes(id)) {
        curNode.childrenIds = [...kids, id];
      }
    }

    highlightId = id;
    cur = id;
  }

  return { rootId, highlightId };
}

function pickGraphFromData(data) {
  const maps = [];

  const byIdCandidates = [
    safeGet(data, "nodesById"),
    safeGet(data, "inventory.nodesById"),
    safeGet(data, "inventoryById"),
    safeGet(data, "inventory.nodes"),
    safeGet(data, "inventoryNodesById"),
  ].filter(Boolean);

  for (const c of byIdCandidates) {
    if (c && typeof c === "object" && !Array.isArray(c)) {
      maps.push({ type: "map", byId: c });
    }
  }

  const arrayCandidates = [
    safeGet(data, "nodes"),
    safeGet(data, "inventory.nodes"),
    safeGet(data, "inventoryNodes"),
    safeGet(data, "items"),
  ].filter(Boolean);

  for (const c of arrayCandidates) {
    if (Array.isArray(c) && c.length) {
      const byId = {};
      for (const n of c) {
        const id = normalizeId(n?.id ?? n?.nodeId ?? n?.key);
        if (id) byId[id] = n;
      }
      if (Object.keys(byId).length) maps.push({ type: "array", byId });
    }
  }

  if (!maps.length) return null;
  return maps[0].byId;
}

function resolveChildrenIds(node) {
  const ids =
    node?.childrenIds ??
    node?.children ??
    node?.contents ??
    node?.items ??
    node?.childIds ??
    [];

  if (Array.isArray(ids)) {
    return ids
      .map((x) => (typeof x === "string" ? x : (x?.id ?? x?.nodeId ?? x?.key)))
      .map(normalizeId)
      .filter(Boolean);
  }

  if (ids && typeof ids === "object") {
    return Object.keys(ids).map(normalizeId).filter(Boolean);
  }

  return [];
}

function resolveParentId(node) {
  return normalizeId(node?.parentId ?? node?.parent ?? node?.containerId);
}

function inferContainerRoot(byId, focusId) {
  const seen = new Set();
  let curId = normalizeId(focusId);
  let cur = byId?.[curId];

  if (!curId || !cur) return null;

  while (cur) {
    if (seen.has(curId)) break;
    seen.add(curId);
    const parentId = resolveParentId(cur);
    if (!parentId) break;
    if (!byId?.[parentId]) break;
    curId = parentId;
    cur = byId[parentId];
  }

  return curId;
}

function mockTreeForFocus({ focusId, mode }) {
  const seed = hashStringToInt(`${mode}:${focusId}`);
  const rootId = focusId?.startsWith("CTB")
    ? focusId
    : `CTB-${String(seed % 9000).padStart(4, "0")}`;

  const makeNode = (id, extras = {}) => ({
    id,
    name: extras.name ?? id,
    parentId: extras.parentId ?? null,
    childrenIds: extras.childrenIds ?? [],
    kind:
      extras.kind ??
      (id.startsWith("CTB")
        ? "CTB"
        : id.startsWith("BOB")
          ? "Bob"
          : id.startsWith("MEAL")
            ? "Meal"
            : id.startsWith("PKG")
              ? "Package"
              : "Item"),
  });

  const byId = {};
  byId[rootId] = makeNode(rootId, { name: rootId, kind: "CTB" });

  // Branch 1 (4 deep): CTB -> CTB -> BOB -> MEAL
  const cA = `CTB-${String((seed + 7) % 9000).padStart(4, "0")}`;
  const cA2 = `CTB-${String((seed + 17) % 9000).padStart(4, "0")}`;
  const bob = `BOB-${String((seed + 27) % 9000).padStart(4, "0")}`;
  const meal = `MEAL-${String((seed + 37) % 9000).padStart(4, "0")}`;

  // Branch 2 (4 deep): CTB -> CTB -> PKG -> ITM
  const cB = `CTB-${String((seed + 13) % 9000).padStart(4, "0")}`;
  const pkg = `PKG-${String((seed + 23) % 9000).padStart(4, "0")}`;
  const itm = `ITM-${String((seed + 33) % 9000).padStart(4, "0")}`;

  byId[cA] = makeNode(cA, { parentId: rootId, kind: "CTB" });
  byId[cA2] = makeNode(cA2, { parentId: cA, kind: "CTB" });
  byId[bob] = makeNode(bob, { parentId: cA2, kind: "Bob" });
  byId[meal] = makeNode(meal, {
    parentId: bob,
    kind: "Meal",
    name: "Meal pack",
  });

  byId[cB] = makeNode(cB, { parentId: rootId, kind: "CTB" });
  byId[pkg] = makeNode(pkg, { parentId: cB, kind: "Package" });
  byId[itm] = makeNode(itm, { parentId: pkg, kind: "Item" });

  byId[rootId].childrenIds = [cA, cB];
  byId[cA].childrenIds = [cA2];
  byId[cA2].childrenIds = [bob];
  byId[bob].childrenIds = [meal];

  byId[cB].childrenIds = [pkg];
  byId[pkg].childrenIds = [itm];

  const f = normalizeId(focusId);
  if (f && !byId[f]) {
    byId[f] = makeNode(f, { parentId: pkg, kind: "Item" });
    byId[pkg].childrenIds = [...byId[pkg].childrenIds, f];
  }

  return { byId, rootId };
}

function mockTreeForLocation({ location, mode }) {
  const seed = hashStringToInt(`${mode}:${location}`);
  const rootId = `CTB-${String(seed % 9000).padStart(4, "0")}`;

  const makeNode = (id, extras = {}) => ({
    id,
    name: extras.name ?? id,
    parentId: extras.parentId ?? null,
    childrenIds: extras.childrenIds ?? [],
    kind:
      extras.kind ??
      (id.startsWith("CTB")
        ? "CTB"
        : id.startsWith("BOB")
          ? "Bob"
          : id.startsWith("MEAL")
            ? "Meal"
            : id.startsWith("PKG")
              ? "Package"
              : "Item"),
  });

  const byId = {};
  byId[rootId] = makeNode(rootId, { kind: "CTB" });

  const cA = `CTB-${String((seed + 101) % 9000).padStart(4, "0")}`;
  const cA2 = `CTB-${String((seed + 202) % 9000).padStart(4, "0")}`;
  const bob = `BOB-${String((seed + 303) % 9000).padStart(4, "0")}`;
  const meal = `MEAL-${String((seed + 404) % 9000).padStart(4, "0")}`;

  const cB = `CTB-${String((seed + 505) % 9000).padStart(4, "0")}`;
  const pkg = `PKG-${String((seed + 606) % 9000).padStart(4, "0")}`;
  const itm = `ITM-${String((seed + 707) % 9000).padStart(4, "0")}`;

  byId[cA] = makeNode(cA, { parentId: rootId, kind: "CTB" });
  byId[cA2] = makeNode(cA2, { parentId: cA, kind: "CTB" });
  byId[bob] = makeNode(bob, { parentId: cA2, kind: "Bob" });
  byId[meal] = makeNode(meal, {
    parentId: bob,
    kind: "Meal",
    name: "Meal pack",
  });

  byId[cB] = makeNode(cB, { parentId: rootId, kind: "CTB" });
  byId[pkg] = makeNode(pkg, { parentId: cB, kind: "Package" });
  byId[itm] = makeNode(itm, { parentId: pkg, kind: "Item" });

  byId[rootId].childrenIds = [cA, cB];
  byId[cA].childrenIds = [cA2];
  byId[cA2].childrenIds = [bob];
  byId[bob].childrenIds = [meal];

  byId[cB].childrenIds = [pkg];
  byId[pkg].childrenIds = [itm];

  return { byId, rootId };
}

function TreeNode({
  byId,
  nodeId,
  focusId,
  highlightId,
  depth = 0,
  maxDepth = 4,
}) {
  const NORD = useTheme();
  const id = normalizeId(nodeId);
  const node = byId?.[id];
  if (!node) return null;

  const children = resolveChildrenIds(node);

  const isFocus = id && normalizeId(focusId) && id === normalizeId(focusId);
  const isHighlight =
    id && normalizeId(highlightId) && id === normalizeId(highlightId);

  const bg = isFocus
    ? "rgba(136,192,208,0.20)"
    : isHighlight
      ? "rgba(163,190,140,0.18)"
      : "transparent";

  const border = isFocus
    ? "1px solid rgba(136,192,208,0.36)"
    : isHighlight
      ? "1px solid rgba(163,190,140,0.34)"
      : "1px solid rgba(76,86,106,0.22)";

  return (
    <li className="min-w-0">
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-2.5"
        style={{ background: bg, border, color: NORD.text }}
      >
        <div
          className="h-3 w-3 rounded-full shrink-0"
          style={{
            background: isFocus
              ? NORD.blue
              : isHighlight
                ? NORD.green
                : NORD.muted,
          }}
        />
        <div className="min-w-0">
          <div className="text-base font-semibold truncate">{id}</div>
        </div>
      </div>

      {children.length && depth < maxDepth ? (
        <ul
          className="mt-2 space-y-2"
          style={{
            marginLeft: 16,
            paddingLeft: 14,
            borderLeft: `2px solid rgba(76,86,106,0.24)`,
          }}
        >
          {children.map((cid) => (
            <TreeNode
              key={cid}
              byId={byId}
              nodeId={cid}
              focusId={focusId}
              highlightId={highlightId}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function ContextTree({ title, byId, rootId, focusId, highlightId, tone }) {
  const NORD = useTheme();
  const toneColors =
    tone === "green"
      ? { border: "rgba(163,190,140,0.28)", wash: "rgba(163,190,140,0.10)" }
      : tone === "blue"
        ? { border: "rgba(136,192,208,0.28)", wash: "rgba(136,192,208,0.10)" }
        : tone === "purple"
          ? { border: "rgba(180,142,173,0.28)", wash: "rgba(180,142,173,0.10)" }
          : { border: "rgba(216,222,233,0.10)", wash: "rgba(0,0,0,0)" };
  const hasSignal = Boolean(normalizeId(rootId));

  if (!hasSignal || !byId || !rootId) {
    return (
      <div
        className="rounded-2xl p-5 h-full flex flex-col min-h-0 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${toneColors.wash}, rgba(0,0,0,0)), ${NORD.panel2}`,
          border: `1px solid ${toneColors.border}`,
        }}
      >
        <div className="text-base font-semibold" style={{ color: NORD.text }}>
          {title}
        </div>
        <div className="mt-3 text-base" style={{ color: NORD.muted }}>
          No context available.
        </div>
        <div className="flex-1 min-h-0" />
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5 h-full flex flex-col min-h-0 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${toneColors.wash}, rgba(0,0,0,0)), ${NORD.panel2}`,
        border: `1px solid ${toneColors.border}`,
      }}
    >
      <div className="text-base font-semibold" style={{ color: NORD.text }}>
        {title}
      </div>

      {/* IMPORTANT: constrain this viewport so overflow-y-auto actually scrolls */}
      <div
        className="mt-3 flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1"
        style={{ maxHeight: "clamp(240px, 34vh, 520px)" }}
      >
        <ul className="space-y-2">
          <TreeNode
            byId={byId}
            nodeId={rootId}
            focusId={focusId}
            highlightId={highlightId}
          />
        </ul>
      </div>
    </div>
  );
}

function defaultMakeInspectorForMove(m) {
  return {
    title: m?.ctb ?? "Move",
    subtitle: `${m?.from ?? ""} → ${m?.to ?? ""}`,
    pills: [{ label: "Relocation", tone: "progress" }],
    details: {
      From: m?.from,
      To: m?.to,
      Reason: m?.reason ?? "(logged)",
      Operator: m?.who ?? "(mock)",
      Time: m?.when ?? "(mock)",
    },
    history: [
      { when: "(mock)", what: "Move created" },
      { when: "(mock)", what: "Awaiting verify read" },
    ],
  };
}

export default function MoveScreen({
  data,
  setInspector,
  makeInspectorForMove,
}) {
  const NORD = useTheme();

  const makeMoveInspector = useMemo(
    () => makeInspectorForMove ?? defaultMakeInspectorForMove,
    [makeInspectorForMove],
  );

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [ctb, setCtb] = useState("");
  const [reason, setReason] = useState("Space constraint");

  function makeDeepMockPath(slotKey) {
    const n = 10000;
    const pick = (p) =>
      `${p}-${String(Math.floor(Math.random() * n)).padStart(4, "0")}`;

    const c1 = pick("CTB");
    const c2 = pick("CTB");
    const c3 = pick("CTB");
    const bob = pick("BOB");
    const meal = pick("MEAL");
    const pkg = pick("PKG");
    const itm = pick("ITM");

    const options = [
      `${slotKey}/${c1}/${c2}/${bob}/${meal}`, // MEAL in BOB in CTB in CTB
      `${slotKey}/${c1}/${c2}/${pkg}/${itm}`,
      `${slotKey}/${c1}/${c2}/${itm}`,
      `${slotKey}/${c1}/${itm}`,
      `${slotKey}/${c1}/${c2}/${c3}`,
    ];

    return options[Math.floor(Math.random() * options.length)];
  }

  const graphById = useMemo(() => pickGraphFromData(data), [data]);

  const sourceContext = useMemo(() => {
    const fromResolved = resolveContainerFromLocationPath({
      pathStr: from,
      data,
      graphById,
    });

    const focusId = normalizeId(fromResolved?.targetContainerId);

    if (!focusId) {
      return { byId: null, rootId: null, focusId: "", highlightId: "" };
    }

    if (graphById && graphById[focusId]) {
      const rootId = inferContainerRoot(graphById, focusId);
      return { byId: graphById, rootId, focusId, highlightId: focusId };
    }

    const mock = mockTreeForFocus({ focusId, mode: "source" });
    return {
      byId: mock.byId,
      rootId: mock.rootId,
      focusId,
      highlightId: focusId,
    };
  }, [from, data, graphById]);

  const destContext = useMemo(() => {
    const locStr = normalizeId(to);
    if (!locStr) return { byId: null, rootId: null, highlightId: "" };

    const resolved = resolveContainerFromLocationPath({
      pathStr: to,
      data,
      graphById,
    });

    const rootId = normalizeId(resolved?.topContainerId);
    const highlightId = normalizeId(resolved?.targetContainerId);

    if (rootId && graphById && graphById[rootId]) {
      return { byId: graphById, rootId, highlightId: highlightId || rootId };
    }

    const slotKey = normalizeId(resolved?.slotKey) || locStr;
    const mock = mockTreeForLocation({ location: slotKey, mode: "dest" });
    const ensured = ensureMockPath({
      byId: mock.byId,
      rootId: mock.rootId,
      chainIds: resolved?.chainIds ?? [],
    });

    return {
      byId: mock.byId,
      rootId: mock.rootId,
      highlightId: ensured.highlightId || mock.rootId,
    };
  }, [to, data, graphById]);

  function openDraft() {
    setInspector?.(makeMoveInspector({ ctb, from, to, reason }));
  }

  function clearDraft() {
    setFrom("");
    setTo("");
    setCtb("");
    setReason("Space constraint");
  }

  function executeMove() {
    // Mock execute: real implementation would validate + persist.
    clearDraft();
  }

  return (
    <div className="flex flex-col gap-2 min-h-[calc(100vh-24px)]">
      <ScreenHeader
        title="Move"
        right={
          <Button
            variant="ghost"
            onClick={openDraft}
            style={{
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 10,
              paddingBottom: 10,
              fontSize: 16,
            }}
          >
            Open Draft
          </Button>
        }
      />

      <div className="flex-1 min-h-0 flex flex-col gap-2">
        {/* Top row (From/To) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1 min-h-0">
          <div className="min-h-0">
            <Card title="From">
              <div className="h-full">
                <div
                  className="rounded-2xl p-6 h-full flex flex-col"
                  style={{
                    background: `linear-gradient(135deg, rgba(136,192,208,0.12), rgba(0,0,0,0)), ${NORD.panel2}`,
                    border: `1px solid rgba(136,192,208,0.28)`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div
                        className="text-2xl font-semibold"
                        style={{ color: NORD.text }}
                      >
                        {from?.trim() ? from : "None selected"}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <Button
                        onClick={() => {
                          const shelf = ["S1", "S2", "S3"][
                            Math.floor(Math.random() * 3)
                          ];
                          const loc = String(
                            1 + Math.floor(Math.random() * 16),
                          ).padStart(2, "0");
                          const slotKey = `${shelf}-L${loc}`;
                          setFrom(makeDeepMockPath(slotKey));
                        }}
                        style={{
                          paddingLeft: 16,
                          paddingRight: 16,
                          paddingTop: 10,
                          paddingBottom: 10,
                          fontSize: 16,
                        }}
                      >
                        Scan
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setFrom("")}
                        style={{
                          paddingLeft: 16,
                          paddingRight: 16,
                          paddingTop: 10,
                          paddingBottom: 10,
                          fontSize: 16,
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0" />

                  <div className="mt-4">
                    <Input
                      value={from}
                      onChange={setFrom}
                      placeholder="S1-L12/CTB-0001/CTB-0002"
                      className="text-lg"
                      style={{ fontSize: 18 }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="min-h-0">
            <Card title="To">
              <div className="h-full">
                <div
                  className="rounded-2xl p-6 h-full flex flex-col"
                  style={{
                    background: `linear-gradient(135deg, rgba(163,190,140,0.12), rgba(0,0,0,0)), ${NORD.panel2}`,
                    border: `1px solid rgba(163,190,140,0.28)`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div
                        className="text-2xl font-semibold"
                        style={{ color: NORD.text }}
                      >
                        {to?.trim() ? to : "None selected"}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <Button
                        onClick={() => {
                          const shelf = ["S1", "S2", "S3"][
                            Math.floor(Math.random() * 3)
                          ];
                          const loc = String(
                            1 + Math.floor(Math.random() * 16),
                          ).padStart(2, "0");
                          const slotKey = `${shelf}-L${loc}`;
                          setTo(makeDeepMockPath(slotKey));
                        }}
                        style={{
                          paddingLeft: 16,
                          paddingRight: 16,
                          paddingTop: 10,
                          paddingBottom: 10,
                          fontSize: 16,
                        }}
                      >
                        Scan
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setTo("")}
                        style={{
                          paddingLeft: 16,
                          paddingRight: 16,
                          paddingTop: 10,
                          paddingBottom: 10,
                          fontSize: 16,
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0" />

                  <div className="mt-4">
                    <Input
                      value={to}
                      onChange={setTo}
                      placeholder="S2-L02/CTB-0001/CTB-0002"
                      className="text-lg"
                      style={{ fontSize: 18 }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom card */}
        <div className="flex-1 min-h-0">
          <Card title="Move">
            <div
              className="rounded-2xl p-6 h-full flex flex-col"
              style={{
                background: `linear-gradient(135deg, rgba(180,142,173,0.12), rgba(0,0,0,0)), ${NORD.panel2}`,
                border: `1px solid rgba(180,142,173,0.26)`,
              }}
            >
              <div className="flex flex-col gap-4 h-full min-h-0">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div
                      className="text-lg font-semibold"
                      style={{ color: NORD.muted }}
                    >
                      Reason
                    </div>
                    <Select
                      value={reason}
                      onChange={setReason}
                      options={[
                        "Space constraint",
                        "Late arrival",
                        "Priority access",
                        "Issue / damage",
                        "Other",
                      ]}
                    />
                    <Button
                      variant="ghost"
                      onClick={clearDraft}
                      style={{
                        paddingLeft: 16,
                        paddingRight: 16,
                        paddingTop: 10,
                        paddingBottom: 10,
                        fontSize: 16,
                      }}
                    >
                      Clear
                    </Button>
                  </div>

                  <Button
                    onClick={executeMove}
                    className="w-full md:w-auto"
                    style={{
                      paddingLeft: 22,
                      paddingRight: 22,
                      paddingTop: 14,
                      paddingBottom: 14,
                      fontSize: 18,
                    }}
                  >
                    Execute move
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 flex-1 min-h-0">
                  <div className="min-h-0 h-full">
                    <ContextTree
                      title="Source container"
                      byId={sourceContext.byId}
                      rootId={sourceContext.rootId}
                      focusId={sourceContext.focusId}
                      highlightId={sourceContext.highlightId}
                      tone="blue"
                    />
                  </div>
                  <div className="min-h-0 h-full">
                    <ContextTree
                      title="Destination container"
                      byId={destContext.byId}
                      rootId={destContext.rootId}
                      focusId={""}
                      highlightId={destContext.highlightId}
                      tone="green"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
