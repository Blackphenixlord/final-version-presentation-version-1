// Whole-tree validation pass. Runs every invariant in Section 3 and the zone carve-outs
// in Section 7. Returns a list of violations rather than throwing -- run after bulk imports
// or as a debug command, then decide what to do with the result.

import { type IMSNode, type ValidationViolation, TOP_LEVEL_SIZE } from "./types";
import { IMSTree } from "./tree";

const SLOT_CAPACITY = 3;
const BOB_CAPACITY = 4;
const MAX_CTB_DEPTH = 3;

export function validate(tree: IMSTree): ValidationViolation[] {
  const violations: ValidationViolation[] = [];

  // For invariant 11 (global ID uniqueness across tracked items). Slots/zones use
  // synthetic prefixed keys and are excluded from the tracked-item namespace check.
  const trackedIds = new Set<string>();

  for (const node of tree.allNodes()) {
    // Parent linkage check: parentId resolves and the parent claims this child.
    if (node.parentId) {
      const parent = tree.lookup(node.parentId);
      if (!parent) {
        violations.push({
          nodeId: node.id,
          kind: node.kind,
          rule: "parent-link",
          detail: `parentId "${node.parentId}" does not resolve`,
        });
      } else if (!parent.childIds.includes(node.id)) {
        violations.push({
          nodeId: node.id,
          kind: node.kind,
          rule: "parent-link",
          detail: `parent "${parent.id}" does not list this node as a child`,
        });
      }
    }

    switch (node.kind) {
      case "slot":
        if (node.parentId !== null) {
          violations.push(v(node, "Section 3.1", "slot must be root (parentId == null)"));
        }
        if (node.childIds.length > SLOT_CAPACITY) {
          violations.push(
            v(node, "Section 3.7", `slot has ${node.childIds.length} children, max ${SLOT_CAPACITY}`),
          );
        }
        for (const childId of node.childIds) {
          const child = tree.lookup(childId);
          if (!child) continue;
          if (child.kind !== "ctb") {
            violations.push(
              v(node, "Section 3.2", `slot child "${childId}" is a ${child.kind}, must be a ctb`),
            );
          } else if (child.size !== TOP_LEVEL_SIZE) {
            violations.push(
              v(child, "Section 3.10", `top-level CTB has size "${child.size}", must be "${TOP_LEVEL_SIZE}"`),
            );
          }
        }
        break;

      case "zone":
        if (node.parentId !== null) {
          violations.push(v(node, "Section 7", "zone must be root (parentId == null)"));
        }
        for (const childId of node.childIds) {
          const child = tree.lookup(childId);
          if (!child) continue;
          if (child.kind === "bob") {
            violations.push(v(child, "Section 6 BOB-in-zone", `BOB "${childId}" cannot live directly in a zone`));
          } else if (child.kind === "item" && child.isFood) {
            violations.push(v(child, "Section 3.5", `food item "${childId}" must live in a BOB`));
          } else if (child.kind === "slot" || child.kind === "zone") {
            violations.push(v(child, "Section 7", `zone child "${childId}" cannot be a ${child.kind}`));
          }
        }
        break;

      case "ctb": {
        trackTrackedId(node.id, trackedIds, violations, node);
        // size + parent kind invariants (3.2, 3.3, 3.10)
        const parent = node.parentId ? tree.lookup(node.parentId) : undefined;
        if (!parent) {
          violations.push(v(node, "Section 3.2/3.3", "CTB has no parent"));
        } else if (parent.kind === "slot") {
          if (node.size !== TOP_LEVEL_SIZE) {
            violations.push(
              v(node, "Section 3.2", `CTB in slot has size "${node.size}", must be "${TOP_LEVEL_SIZE}"`),
            );
          }
        } else if (parent.kind === "ctb") {
          if (node.size === TOP_LEVEL_SIZE) {
            violations.push(v(node, "Section 3.10", `${TOP_LEVEL_SIZE} CTB cannot live inside another CTB`));
          }
        } else if (parent.kind === "zone") {
          // zones accept any catalog size -- nothing to check here.
        } else {
          violations.push(
            v(node, "Section 3.2/3.3", `CTB parent "${parent.id}" is a ${parent.kind}; must be slot, zone, or ctb`),
          );
        }
        break;
      }

      case "bob": {
        trackTrackedId(node.id, trackedIds, violations, node);
        if (node.childIds.length > BOB_CAPACITY) {
          violations.push(
            v(node, "Section 3.8", `BOB has ${node.childIds.length} children, max ${BOB_CAPACITY}`),
          );
        }
        const parent = node.parentId ? tree.lookup(node.parentId) : undefined;
        if (!parent || parent.kind !== "ctb") {
          violations.push(
            v(node, "Section 3.4", `BOB parent must be a CTB, got "${parent?.kind ?? "none"}"`),
          );
        }
        for (const childId of node.childIds) {
          const child = tree.lookup(childId);
          if (!child) continue;
          if (child.kind !== "item") {
            violations.push(v(node, "Section 2 BOB", `BOB child "${childId}" is a ${child.kind}, must be an item`));
          } else if (!child.isFood) {
            violations.push(v(child, "Section 3.5", `non-food item "${childId}" cannot live in a BOB`));
          }
        }
        break;
      }

      case "item": {
        trackTrackedId(node.id, trackedIds, violations, node);
        if (node.childIds.length !== 0) {
          violations.push(v(node, "Section 2 Item", "item is a leaf and must have no children"));
        }
        const parent = node.parentId ? tree.lookup(node.parentId) : undefined;
        if (!parent) {
          violations.push(v(node, "Section 3.5/3.6", "item has no parent"));
        } else if (node.isFood) {
          if (parent.kind !== "bob") {
            violations.push(v(node, "Section 3.5", `food item parent must be BOB, got ${parent.kind}`));
          }
        } else {
          if (parent.kind !== "ctb" && parent.kind !== "zone") {
            violations.push(
              v(node, "Section 3.6/Section 7", `non-food item parent must be CTB or zone, got ${parent.kind}`),
            );
          }
        }
        break;
      }
    }
  }

  // Depth invariant 3.9 -- once per leaf chain. Walk from each leaf upward and count CTBs.
  for (const node of tree.allNodes()) {
    if (node.kind !== "item") continue;
    let depth = 0;
    let cursor: IMSNode | undefined = node.parentId ? tree.lookup(node.parentId) : undefined;
    while (cursor) {
      if (cursor.kind === "ctb") depth += 1;
      cursor = cursor.parentId ? tree.lookup(cursor.parentId) : undefined;
    }
    if (depth > MAX_CTB_DEPTH) {
      violations.push(v(node, "Section 3.9", `leaf has CTB ancestor chain of length ${depth}, max ${MAX_CTB_DEPTH}`));
    }
  }

  return violations;
}

function v(node: IMSNode, rule: string, detail: string): ValidationViolation {
  return { nodeId: node.id, kind: node.kind, rule, detail };
}

function trackTrackedId(
  id: string,
  seen: Set<string>,
  violations: ValidationViolation[],
  node: IMSNode,
): void {
  if (seen.has(id)) {
    violations.push(v(node, "Section 3.11", `duplicate tracked-item id "${id}"`));
  } else {
    seen.add(id);
  }
}
