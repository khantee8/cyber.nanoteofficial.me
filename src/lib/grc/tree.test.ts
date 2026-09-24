import { describe, expect, it } from 'vitest';
import { ancestorsOf, buildTree, canMove, MAX_FOLDER_DEPTH, type FolderRow } from './tree';

const f = (id: string, parentId: string | null, name = id, sortOrder = 0): FolderRow => ({ id, parentId, name, sortOrder });

describe('buildTree', () => {
  it('nests children, sorts by sortOrder then name, and sets depth', () => {
    const t = buildTree([f('b', null, 'FY2027', 0), f('a', null, 'FY2026', 0), f('c', 'a', 'Head office'), f('d', 'c', 'IT')]);
    expect(t.map((n) => n.name)).toEqual(['FY2026', 'FY2027']);
    expect(t[0].children[0].name).toBe('Head office');
    expect(t[0].children[0].children[0].depth).toBe(3);
  });
  it('treats folders with an unknown parent as top level', () => {
    expect(buildTree([f('x', 'gone')]).map((n) => n.id)).toEqual(['x']);
  });
});

describe('ancestorsOf', () => {
  it('returns the root-first path excluding the folder', () => {
    const rows = [f('a', null), f('b', 'a'), f('c', 'b')];
    expect(ancestorsOf(rows, 'c').map((r) => r.id)).toEqual(['a', 'b']);
    expect(ancestorsOf(rows, 'a')).toEqual([]);
  });
});

describe('canMove', () => {
  const rows = [f('a', null), f('b', 'a'), f('c', 'b')];
  it('allows moving to root or to an unrelated folder', () => {
    expect(canMove(rows, 'c', null)).toEqual({ ok: true });
    expect(canMove([...rows, f('z', null)], 'b', 'z')).toEqual({ ok: true });
  });
  it('rejects moving a folder into itself or its descendant', () => {
    expect(canMove(rows, 'a', 'a')).toEqual({ ok: false, reason: 'cycle' });
    expect(canMove(rows, 'a', 'c')).toEqual({ ok: false, reason: 'cycle' });
  });
  it('rejects unknown ids', () => {
    expect(canMove(rows, 'nope', null)).toEqual({ ok: false, reason: 'missing' });
    expect(canMove(rows, 'a', 'nope')).toEqual({ ok: false, reason: 'missing' });
  });
  it('rejects a move that makes the subtree deeper than the limit', () => {
    const chain: FolderRow[] = Array.from({ length: MAX_FOLDER_DEPTH }, (_, i) => f(`n${i}`, i ? `n${i - 1}` : null));
    const sub = [f('s0', null), f('s1', 's0')];              // a 2-level subtree
    expect(canMove([...chain, ...sub], 's0', `n${MAX_FOLDER_DEPTH - 2}`)).toEqual({ ok: false, reason: 'depth' });
    expect(canMove([...chain, ...sub], 's0', `n${MAX_FOLDER_DEPTH - 3}`)).toEqual({ ok: true });
  });
});
