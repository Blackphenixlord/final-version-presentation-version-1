// IMSTree: insert / remove / move / lookup, with the can_insert dispatch from Section 4.
//
// Invariants from Section 3 are enforced on every mutation. The full whole-tree validation
// pass lives in validate.ts and should be run after bulk imports.

import {
  type BOBNode,
  type CTBNode,
  type CTBSize,
  type ContainerNode,
  type IMSNode,
  type ItemNode,
  type NodeKind,
  type SlotAddress,
  type SlotNode,
  type ZoneNode,
  IMSError,
  TOP_LEVEL_SIZE,
} from "./types";

const SLOT_CAPACITY = 3;
const BOB_CAPACITY = 4;
const MAX_CTB_DEPTH = 3;

function slotKey(addr: SlotAddress): string {
  return `slot:${addr.stack}/${addr.position}/${addr.slot}`;
}

function zoneKey(label: string): string {
  return `zone:${label}`;
}

export interface RemoveOptions {
  cascade?: boolean;
}

export interface NewCTBInput {
  id: string;
  size: CTBSize;
  label?: string;
}

export interface NewBOBInput {
  id: string;
}

export interface NewItemInput {
  id: string;
  isFood: boolean;
  boundingBox?: { l: number; w: number; h: number };
  subLabel?: string;
}

export class IMSTree {
  private readonly nodes = new Map<string, IMSNode>();

  // ---- top-level structures ---------------------------------------------------

  addSlot(address: SlotAddress): SlotNode {
    const id = slotKey(address);
    if (this.nodes.has(id)) {
      throw new IMSError(`slot already exists at ${id}`);
    }
    const node: SlotNode = { kind: "slot", id, address, parentId: null, childIds: [] };
    this.nodes.set(id, node);
    return node;
  }

  addZone(label: string): ZoneNode {
    const id = zoneKey(label);
    if (this.nodes.has(id)) {
      throw new IMSError(`zone already exists with label "${label}"`);
    }
    const node: ZoneNode = { kind: "zone", id, label, parentId: null, childIds: [] };
    this.nodes.set(id, node);
    return node;
  }

  // ---- lookup -----------------------------------------------------------------

  lookup(id: string): IMSNode | undefined {
    return this.nodes.get(id);
  }

  getOrThrow(id: string): IMSNode {
    const n = this.nodes.get(id);
    if (!n) throw new IMSError(`no node with id "${id}"`);
    return n;
  }

  getSlot(address: SlotAddress): SlotNode | undefined {
    const n = this.nodes.get(slotKey(address));
    return n?.kind === "slot" ? n : undefined;
  }

  getZone(label: string): ZoneNode | undefined {
    const n = this.nodes.get(zoneKey(label));
    return n?.kind === "zone" ? n : undefined;
  }

  // ---- insert -----------------------------------------------------------------

  insertCTB(input: NewCTBInput, parentId: string): CTBNode {
    if (this.nodes.has(input.id)) {
      throw new IMSError(`id "${input.id}" already exists`);
    }
    const parent = this.getContainerOrThrow(parentId);
    const node: CTBNode = {
      kind: "ctb",
      id: input.id,
      size: input.size,
      label: input.label,
      parentId: parent.id,
      childIds: [],
    };
    this.assertCanInsert(node, parent);
    this.nodes.set(node.id, node);
    parent.childIds.push(node.id);
    return node;
  }

  insertBOB(input: NewBOBInput, parentId: string): BOBNode {
    if (this.nodes.has(input.id)) {
      throw new IMSError(`id "${input.id}" already exists`);
    }
    const parent = this.getContainerOrThrow(parentId);
    const node: BOBNode = {
      kind: "bob",
      id: input.id,
      parentId: parent.id,
      childIds: [],
    };
    this.assertCanInsert(node, parent);
    this.nodes.set(node.id, node);
    parent.childIds.push(node.id);
    return node;
  }

  insertItem(input: NewItemInput, parentId: string): ItemNode {
    if (this.nodes.has(input.id)) {
      throw new IMSError(`id "${input.id}" already exists`);
    }
    const parent = this.getContainerOrThrow(parentId);
    const node: ItemNode = {
      kind: "item",
      id: input.id,
      isFood: input.isFood,
      boundingBox: input.boundingBox,
      subLabel: input.subLabel,
      parentId: parent.id,
      childIds: [],
    };
    this.assertCanInsert(node, parent);
    this.nodes.set(node.id, node);
    parent.childIds.push(node.id);
    return node;
  }

  // ---- can_insert (Section 4 + Section 7) -------------------------------------

  canInsert(child: IMSNode, parent: IMSNode): boolean {
    if (parent.kind === "slot") {
      if (child.kind !== "ctb") return false;
      if (child.size !== TOP_LEVEL_SIZE) return false;
      return parent.childIds.length < SLOT_CAPACITY;
    }
    if (parent.kind === "zone") {
      if (child.kind === "bob") return false;
      if (child.kind === "ctb") return this.ctbDepthUnder(parent) === 0;
      if (child.kind === "item") return !child.isFood;
      return false;
    }
    if (parent.kind === "ctb") {
      if (child.kind === "ctb") {
        if (child.size === TOP_LEVEL_SIZE) return false;
        return this.ctbDepthUnder(parent) < MAX_CTB_DEPTH;
      }
      if (child.kind === "bob") return true;
      if (child.kind === "item") return !child.isFood;
      return false;
    }
    if (parent.kind === "bob") {
      if (child.kind !== "item") return false;
      if (!child.isFood) return false;
      return parent.childIds.length < BOB_CAPACITY;
    }
    return false;
  }

  // ---- ctb_depth_under (Section 4) -------------------------------------------
  //
  // Number of CTB nodes on the path from the top-level container (slot or zone) down to
  // and including `parent`. Slots and zones return 0; a top-level CTB returns 1; etc.

  ctbDepthUnder(parent: IMSNode): number {
    let depth = 0;
    let cursor: IMSNode | undefined = parent;
    while (cursor) {
      if (cursor.kind === "ctb") depth += 1;
      cursor = cursor.parentId ? this.nodes.get(cursor.parentId) : undefined;
    }
    return depth;
  }

  // ---- remove -----------------------------------------------------------------
  //
  // Default behavior: refuse if subtree is non-empty. Pass { cascade: true } to delete
  // the whole subtree. (Section 6 resolved decision.)

  remove(id: string, opts: RemoveOptions = {}): void {
    const node = this.nodes.get(id);
    if (!node) throw new IMSError(`no node with id "${id}"`);
    if (node.kind === "slot" || node.kind === "zone") {
      throw new IMSError(`cannot remove ${node.kind} "${id}" (top-level structure)`);
    }
    if (node.childIds.length > 0 && !opts.cascade) {
      throw new IMSError(
        `cannot remove "${id}": subtree is non-empty (${node.childIds.length} children). Pass { cascade: true } to cascade-delete.`,
      );
    }
    this.detachAndDelete(node);
  }

  private detachAndDelete(node: IMSNode): void {
    for (const childId of [...node.childIds]) {
      const child = this.nodes.get(childId);
      if (child) this.detachAndDelete(child);
    }
    if (node.parentId) {
      const parent = this.nodes.get(node.parentId);
      if (parent) {
        parent.childIds = parent.childIds.filter((c) => c !== node.id);
      }
    }
    this.nodes.delete(node.id);
  }

  // ---- move -------------------------------------------------------------------
  //
  // Section 5: re-validate depth, capacity, and size at the destination. For a subtree
  // whose root has internal CTB-depth d (max CTB chain within the subtree, root counted
  // as 1), and a parent at ctb_depth_under == p, require p + d <= MAX_CTB_DEPTH.

  move(id: string, newParentId: string): void {
    const node = this.nodes.get(id);
    if (!node) throw new IMSError(`no node with id "${id}"`);
    if (node.kind === "slot" || node.kind === "zone") {
      throw new IMSError(`cannot move ${node.kind} "${id}" (top-level structure)`);
    }
    const newParent = this.getContainerOrThrow(newParentId);

    if (this.isAncestor(node.id, newParent.id)) {
      throw new IMSError(`cannot move "${id}" into its own descendant "${newParentId}"`);
    }

    if (!this.canInsert(node, newParent)) {
      throw new IMSError(
        `cannot move "${id}" into "${newParentId}": fails ${node.kind}-into-${newParent.kind} insertion rules`,
      );
    }

    if (node.kind === "ctb") {
      const subtreeDepth = this.maxCTBChainWithin(node);
      const parentDepth = this.ctbDepthUnder(newParent);
      if (parentDepth + subtreeDepth > MAX_CTB_DEPTH) {
        throw new IMSError(
          `cannot move CTB "${id}": parent depth ${parentDepth} + subtree depth ${subtreeDepth} > ${MAX_CTB_DEPTH}`,
        );
      }
    }

    const oldParent = node.parentId ? this.nodes.get(node.parentId) : undefined;
    if (oldParent) {
      oldParent.childIds = oldParent.childIds.filter((c) => c !== node.id);
    }
    node.parentId = newParent.id;
    newParent.childIds.push(node.id);
  }

  // Max number of CTB nodes on any root-to-leaf path within a subtree, with the
  // subtree root counted as 1 if it is itself a CTB.
  private maxCTBChainWithin(root: IMSNode): number {
    const here = root.kind === "ctb" ? 1 : 0;
    let best = 0;
    for (const childId of root.childIds) {
      const child = this.nodes.get(childId);
      if (!child) continue;
      const sub = this.maxCTBChainWithin(child);
      if (sub > best) best = sub;
    }
    return here + best;
  }

  private isAncestor(ancestorId: string, descendantId: string): boolean {
    let cursor: IMSNode | undefined = this.nodes.get(descendantId);
    while (cursor && cursor.parentId) {
      if (cursor.parentId === ancestorId) return true;
      cursor = this.nodes.get(cursor.parentId);
    }
    return false;
  }

  // ---- list / render ----------------------------------------------------------

  // All tracked-item leaves under a node (CTBs/BOBs are containers, items are leaves).
  flattenLeaves(rootId: string): ItemNode[] {
    const root = this.getOrThrow(rootId);
    const out: ItemNode[] = [];
    const walk = (n: IMSNode): void => {
      if (n.kind === "item") {
        out.push(n);
        return;
      }
      for (const childId of n.childIds) {
        const c = this.nodes.get(childId);
        if (c) walk(c);
      }
    };
    walk(root);
    return out;
  }

  // Whole subtree as a nested plain object, useful for rendering and snapshot tests.
  renderNested(rootId: string): RenderedNode {
    const root = this.getOrThrow(rootId);
    return this.renderNode(root);
  }

  private renderNode(n: IMSNode): RenderedNode {
    return {
      id: n.id,
      kind: n.kind,
      children: n.childIds
        .map((c) => this.nodes.get(c))
        .filter((c): c is IMSNode => c !== undefined)
        .map((c) => this.renderNode(c)),
    };
  }

  // ---- iteration --------------------------------------------------------------

  allNodes(): IterableIterator<IMSNode> {
    return this.nodes.values();
  }

  // ---- internals --------------------------------------------------------------

  private assertCanInsert(child: IMSNode, parent: IMSNode): void {
    if (!this.canInsert(child, parent)) {
      throw new IMSError(
        `cannot insert ${child.kind} "${child.id}" into ${parent.kind} "${parent.id}"`,
      );
    }
  }

  private getContainerOrThrow(parentId: string): ContainerNode {
    const parent = this.nodes.get(parentId);
    if (!parent) throw new IMSError(`no parent node with id "${parentId}"`);
    if (parent.kind === "item") {
      throw new IMSError(`parent "${parentId}" is an item (leaf), cannot have children`);
    }
    return parent;
  }
}

export interface RenderedNode {
  id: string;
  kind: NodeKind;
  children: RenderedNode[];
}

