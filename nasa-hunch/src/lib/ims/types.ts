// IMS node model. Mirrors ims_nesting_handoff_prompt.md Sections 2-4 and 7.
//
// Resolved decisions (Section 6):
//   - Non-empty subtree removal: REFUSED by default. Pass { cascade: true } to remove() to
//     explicitly cascade. Orphan-to-holding is not implemented (no holding area exists yet).
//   - Food representation: a boolean flag `isFood` on item nodes. Simpler than a subtype.
//   - BOB-in-zone: forbidden. BOBs always require a CTB parent, including on the irregular side.

export type NodeKind = "slot" | "zone" | "ctb" | "bob" | "item";

// CTB catalog. Treat as a hard configuration constant. Add or rename sizes here only.
export const CTB_SIZES = ["XS", "S", "M", "L", "XL"] as const;
export type CTBSize = (typeof CTB_SIZES)[number];

// The single size that is slot-legal. Per Section 2: the largest. Slot-only inside the
// regular grid; zones accept any catalog size.
export const TOP_LEVEL_SIZE: CTBSize = "XL";

export interface SlotAddress {
  stack: number;
  position: number;
  slot: number;
}

export interface BoundingBox {
  l: number;
  w: number;
  h: number;
}

interface NodeBase {
  parentId: string | null;
  childIds: string[];
}

export interface SlotNode extends NodeBase {
  kind: "slot";
  // Slots have no item-namespace ID. We use a synthetic key for index lookup
  // ("slot:<stack>/<position>/<slot>") but it is not part of the global tracked-item namespace.
  id: string;
  address: SlotAddress;
}

export interface ZoneNode extends NodeBase {
  kind: "zone";
  // Zones use their string label as their key. Not part of the tracked-item namespace.
  id: string;
  label: string;
}

export interface CTBNode extends NodeBase {
  kind: "ctb";
  id: string;
  size: CTBSize;
  label?: string;
}

export interface BOBNode extends NodeBase {
  kind: "bob";
  id: string;
}

export interface ItemNode extends NodeBase {
  kind: "item";
  id: string;
  isFood: boolean;
  boundingBox?: BoundingBox;
  subLabel?: string;
}

export type IMSNode = SlotNode | ZoneNode | CTBNode | BOBNode | ItemNode;

// Containers: anything that can hold children.
export type ContainerNode = SlotNode | ZoneNode | CTBNode | BOBNode;

// Tracked items: live in the global ID namespace (Section 2).
export type TrackedItemNode = CTBNode | BOBNode | ItemNode;

export class IMSError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IMSError";
  }
}

export interface ValidationViolation {
  nodeId: string;
  kind: NodeKind;
  rule: string;
  detail: string;
}
