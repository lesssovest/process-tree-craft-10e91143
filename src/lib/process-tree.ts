export interface ProcessNode {
  id: string;
  name: string;
  active: boolean;
  children: ProcessNode[];
}

export type DropPosition = "before" | "after" | "inside";

export const MAX_DEPTH = 5; // maximum number of levels (1-based)

let idCounter = 0;
export function newId(): string {
  idCounter += 1;
  return `p_${Date.now().toString(36)}_${idCounter}`;
}

export function makeNode(name: string): ProcessNode {
  return { id: newId(), name, active: true, children: [] };
}

/** Immutably update a single node by id. */
export function updateTree(
  nodes: ProcessNode[],
  id: string,
  updater: (n: ProcessNode) => ProcessNode,
): ProcessNode[] {
  return nodes.map((n) => {
    if (n.id === id) return updater(n);
    if (n.children.length) return { ...n, children: updateTree(n.children, id, updater) };
    return n;
  });
}

/** Remove a node (and its subtree) from the tree, returning the new tree and removed node. */
export function removeFromTree(
  nodes: ProcessNode[],
  id: string,
): { tree: ProcessNode[]; removed: ProcessNode | null } {
  let removed: ProcessNode | null = null;
  const walk = (list: ProcessNode[]): ProcessNode[] => {
    const res: ProcessNode[] = [];
    for (const n of list) {
      if (n.id === id) {
        removed = n;
        continue;
      }
      res.push({ ...n, children: walk(n.children) });
    }
    return res;
  };
  const tree = walk(nodes);
  return { tree, removed };
}

/** Insert a node relative to a target. */
export function insertRelative(
  nodes: ProcessNode[],
  targetId: string,
  node: ProcessNode,
  position: DropPosition,
): ProcessNode[] {
  if (position === "inside") {
    return updateTree(nodes, targetId, (n) => ({ ...n, children: [...n.children, node] }));
  }
  const walk = (list: ProcessNode[]): ProcessNode[] => {
    const idx = list.findIndex((n) => n.id === targetId);
    if (idx !== -1) {
      const res = [...list];
      res.splice(position === "before" ? idx : idx + 1, 0, node);
      return res;
    }
    return list.map((n) => ({ ...n, children: walk(n.children) }));
  };
  return walk(nodes);
}

export function findNode(nodes: ProcessNode[], id: string): ProcessNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children, id);
    if (found) return found;
  }
  return null;
}

export function isDescendant(node: ProcessNode, targetId: string): boolean {
  for (const c of node.children) {
    if (c.id === targetId || isDescendant(c, targetId)) return true;
  }
  return false;
}

/** 0-based depth of a node (root = 0). Returns -1 if not found. */
export function depthOf(nodes: ProcessNode[], id: string): number {
  const walk = (list: ProcessNode[], d: number): number => {
    for (const n of list) {
      if (n.id === id) return d;
      const f = walk(n.children, d + 1);
      if (f !== -1) return f;
    }
    return -1;
  };
  return walk(nodes, 0);
}

/** Number of levels contained in a subtree (a leaf = 1). */
export function heightOf(node: ProcessNode): number {
  if (!node.children.length) return 1;
  return 1 + Math.max(...node.children.map(heightOf));
}

export interface NodeMeta {
  parentId: string | null;
  index: number;
  prevSiblingId: string | null;
  siblingCount: number;
}

export function getMeta(nodes: ProcessNode[], id: string): NodeMeta | null {
  const walk = (list: ProcessNode[], parentId: string | null): NodeMeta | null => {
    for (let i = 0; i < list.length; i++) {
      const n = list[i];
      if (n.id === id) {
        return {
          parentId,
          index: i,
          prevSiblingId: i > 0 ? list[i - 1].id : null,
          siblingCount: list.length,
        };
      }
      const found = walk(n.children, n.id);
      if (found) return found;
    }
    return null;
  };
  return walk(nodes, null);
}

/** Swap a node with its previous (-1) or next (+1) sibling. */
export function moveNode(nodes: ProcessNode[], id: string, dir: -1 | 1): ProcessNode[] {
  const walk = (list: ProcessNode[]): ProcessNode[] => {
    const idx = list.findIndex((n) => n.id === id);
    if (idx !== -1) {
      const ni = idx + dir;
      if (ni < 0 || ni >= list.length) return list;
      const res = [...list];
      [res[idx], res[ni]] = [res[ni], res[idx]];
      return res;
    }
    return list.map((n) => ({ ...n, children: walk(n.children) }));
  };
  return walk(nodes);
}

/** Move a node up one level (becomes a sibling of its parent, right after it). */
export function promoteNode(nodes: ProcessNode[], id: string): ProcessNode[] {
  const meta = getMeta(nodes, id);
  if (!meta || meta.parentId === null) return nodes;
  const { tree, removed } = removeFromTree(nodes, id);
  if (!removed) return nodes;
  return insertRelative(tree, meta.parentId, removed, "after");
}

/** Move a node down one level (becomes the last child of its previous sibling). */
export function demoteNode(nodes: ProcessNode[], id: string): ProcessNode[] {
  const meta = getMeta(nodes, id);
  if (!meta || meta.prevSiblingId === null) return nodes;
  const { tree, removed } = removeFromTree(nodes, id);
  if (!removed) return nodes;
  return insertRelative(tree, meta.prevSiblingId, removed, "inside");
}

/** Check for a duplicate name among the given siblings (excluding a node id). */
export function hasDuplicateSibling(
  siblings: ProcessNode[],
  name: string,
  excludeId?: string,
): boolean {
  const norm = name.trim().toLowerCase();
  return siblings.some((s) => s.id !== excludeId && s.name.trim().toLowerCase() === norm);
}

export function collectAllIds(nodes: ProcessNode[], acc: string[] = []): string[] {
  for (const n of nodes) {
    acc.push(n.id);
    collectAllIds(n.children, acc);
  }
  return acc;
}

/** Recursively set the `active` flag on a subtree (a node and all descendants). */
function setSubtreeActive(node: ProcessNode, active: boolean): ProcessNode {
  return { ...node, active, children: node.children.map((c) => setSubtreeActive(c, active)) };
}

/**
 * Toggle a node's active state. Deactivating a node also deactivates all of its
 * descendants; activating a node only affects the node itself.
 */
export function toggleActiveCascade(nodes: ProcessNode[], id: string): ProcessNode[] {
  const node = findNode(nodes, id);
  if (!node) return nodes;
  const nextActive = !node.active;
  return updateTree(nodes, id, (n) =>
    nextActive ? { ...n, active: true } : setSubtreeActive(n, false),
  );
}

export function countNodes(nodes: ProcessNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countNodes(n.children), 0);
}

/** Ids of all nodes matching a query plus the ids of their ancestors. */
export function searchMatches(
  nodes: ProcessNode[],
  query: string,
): { matched: Set<string>; expand: Set<string> } {
  const q = query.trim().toLowerCase();
  const matched = new Set<string>();
  const expand = new Set<string>();
  const walk = (list: ProcessNode[], ancestors: string[]): boolean => {
    let anyMatch = false;
    for (const n of list) {
      const self = n.name.toLowerCase().includes(q);
      const childMatch = walk(n.children, [...ancestors, n.id]);
      if (self || childMatch) {
        anyMatch = true;
        if (self) matched.add(n.id);
        ancestors.forEach((a) => expand.add(a));
        if (childMatch) expand.add(n.id);
      }
    }
    return anyMatch;
  };
  walk(nodes, []);
  return { matched, expand };
}

export const seedProcesses: ProcessNode[] = [
  { id: "seed_1", name: "Кибербезопасность", active: true, children: [] },
  {
    id: "seed_2",
    name: "Управление ИТ-услугами (ITSM)",
    active: true,
    children: [
      { id: "seed_2_1", name: "Управление инцидентами", active: true, children: [] },
      { id: "seed_2_2", name: "Управление изменениями", active: true, children: [] },
      { id: "seed_2_3", name: "Управление проблемами", active: false, children: [] },
    ],
  },
  { id: "seed_3", name: "Поддержка пользователей", active: true, children: [] },
  {
    id: "seed_4",
    name: "Управление проектами и продуктами",
    active: true,
    children: [
      { id: "seed_4_1", name: "Планирование релизов", active: true, children: [] },
    ],
  },
  {
    id: "seed_5",
    name: "Управление данными",
    active: true,
    children: [
      {
        id: "seed_5_1",
        name: "Аналитика данных",
        active: true,
        children: [
          {
            id: "seed_5_1_1",
            name: "Визуализация данных: Создание дашбордов (Tableau, Power BI)",
            active: true,
            children: [],
          },
        ],
      },
      { id: "seed_5_2", name: "Качество данных", active: true, children: [] },
    ],
  },
];