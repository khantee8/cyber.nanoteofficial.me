export const MAX_FOLDER_DEPTH = 8;
export interface FolderRow { id: string; parentId: string | null; name: string; sortOrder: number }
export interface FolderNode extends FolderRow { children: FolderNode[]; depth: number }

const byOrder = (a: FolderRow, b: FolderRow) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

export function buildTree(rows: FolderRow[]): FolderNode[] {
  const ids = new Set(rows.map((r) => r.id));
  const kids = new Map<string | null, FolderRow[]>();
  for (const r of rows) {
    const p = r.parentId && ids.has(r.parentId) ? r.parentId : null;
    kids.set(p, [...(kids.get(p) ?? []), r]);
  }
  const make = (parent: string | null, depth: number): FolderNode[] =>
    (kids.get(parent) ?? []).sort(byOrder).map((r) => ({ ...r, depth, children: make(r.id, depth + 1) }));
  return make(null, 1);
}

export function ancestorsOf(rows: FolderRow[], id: string): FolderRow[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const out: FolderRow[] = [];
  let cur = byId.get(id)?.parentId ?? null;
  const seen = new Set<string>();
  while (cur && byId.has(cur) && !seen.has(cur) && cur !== id) {
    seen.add(cur);
    out.unshift(byId.get(cur)!);
    cur = byId.get(cur)!.parentId;
  }
  return out;
}

function subtreeHeight(rows: FolderRow[], id: string, seen = new Set<string>()): number {
  if (seen.has(id)) return -1; // Cycle detected in subtree
  const newSeen = new Set(seen);
  newSeen.add(id);
  const children = rows.filter((r) => r.parentId === id);
  const heights = children.map((c) => subtreeHeight(rows, c.id, newSeen));
  if (heights.some((h) => h === -1)) return -1; // Propagate cycle detection
  return 1 + Math.max(0, ...heights);
}

export function canMove(rows: FolderRow[], id: string, newParentId: string | null): { ok: true } | { ok: false; reason: 'cycle' | 'depth' | 'missing' } {
  const ids = new Set(rows.map((r) => r.id));
  if (!ids.has(id) || (newParentId !== null && !ids.has(newParentId))) return { ok: false, reason: 'missing' };
  if (newParentId === id || (newParentId !== null && ancestorsOf(rows, newParentId).some((a) => a.id === id))) return { ok: false, reason: 'cycle' };
  const heightResult = subtreeHeight(rows, id);
  if (heightResult === -1) return { ok: false, reason: 'cycle' };
  const parentDepth = newParentId === null ? 0 : ancestorsOf(rows, newParentId).length + 1;
  if (parentDepth + heightResult > MAX_FOLDER_DEPTH) return { ok: false, reason: 'depth' };
  return { ok: true };
}
