'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { createFolder, deleteFolder, moveFolder, renameFolder, type ActionResult } from '@/server/actions/grc';
import type { FolderNode } from '@/lib/grc/tree';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';

const MAX_DEPTH = 8;

/** `all` = every assessment, `root` = assessments outside any folder, otherwise a folder id. */
export type FolderSelection = 'all' | 'root' | (string & {});

interface Ctx { customerId: string; base: string; lang: Lang; all: FolderNode[]; counts: Record<string, number>; selected: FolderSelection }

function errorText(lang: Lang, res: ActionResult): string {
  switch (res.message) {
    case 'folder not empty': return t(lang, 'grc.folders.notEmpty');
    case 'cycle': return t(lang, 'grc.folders.cycle');
    case 'depth': return t(lang, 'grc.folders.depth');
    default: return res.message ?? t(lang, 'common.error');
  }
}

function flatten(nodes: FolderNode[]): FolderNode[] {
  return nodes.flatMap((n) => [n, ...flatten(n.children)]);
}

const rowLink = (active: boolean) =>
  `min-w-0 flex-1 truncate rounded px-2 py-1.5 text-[13px] transition-colors ${active ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg'}`;

function NameForm({ label, submit, defaultValue = '', onSubmit, pending }: {
  label: string; submit: string; defaultValue?: string; onSubmit: (name: string) => void; pending: boolean;
}) {
  const [name, setName] = useState(defaultValue);
  return (
    <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSubmit(name.trim()); }}>
      <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required aria-label={label}
        placeholder={label} className="field min-w-0 flex-1 py-1 text-[12.5px]" />
      <button type="submit" disabled={pending || !name.trim()} className="btn shrink-0 px-2 py-1 text-[12px]">{submit}</button>
    </form>
  );
}

function useRun(lang: Lang) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<ActionResult>, onOk?: () => void) => start(async () => {
    setError(null);
    const res = await fn();
    if (res.ok) onOk?.();
    else setError(errorText(lang, res));
  });
  return { pending, error, run };
}

/** Per-folder actions in a native <details> — no popover library. */
function FolderMenu({ node, ctx }: { node: FolderNode; ctx: Ctx }) {
  const { lang } = ctx;
  const { pending, error, run } = useRun(lang);
  const excluded = new Set(flatten([node]).map((n) => n.id));
  const targets = ctx.all.filter((f) => !excluded.has(f.id));
  const current = node.parentId ?? '';
  const [target, setTarget] = useState<string>(current);
  const [subKey, setSubKey] = useState(0);
  const empty = node.children.length === 0 && (ctx.counts[node.id] ?? 0) === 0;
  const hint = 'text-[11.5px] text-muted-soft';

  return (
    <details className="relative shrink-0">
      <summary className="mono cursor-pointer list-none rounded px-2 py-1.5 text-[12px] text-muted-soft hover:bg-surface-2 hover:text-fg [&::-webkit-details-marker]:hidden"
        aria-label={`${node.name} — ${t(lang, 'common.edit')}`} title={t(lang, 'common.edit')}>
        ···
      </summary>
      <div className="absolute right-0 z-20 mt-1 flex w-64 max-w-[calc(100vw-3rem)] flex-col gap-3 rounded-md border border-line bg-surface p-3 shadow-lg">
        {node.depth < MAX_DEPTH ? (
          <div className="flex flex-col gap-1">
            <span className={hint}>{t(lang, 'grc.folders.newSub')}</span>
            <NameForm key={subKey} label={t(lang, 'grc.folders.name')} submit={t(lang, 'common.save')} pending={pending}
              onSubmit={(name) => run(() => createFolder(ctx.customerId, node.id, name), () => setSubKey((k) => k + 1))} />
          </div>
        ) : null}
        <div className="flex flex-col gap-1">
          <span className={hint}>{t(lang, 'grc.folders.rename')}</span>
          <NameForm label={t(lang, 'grc.folders.name')} submit={t(lang, 'common.save')} defaultValue={node.name} pending={pending}
            onSubmit={(name) => run(() => renameFolder(node.id, name))} />
        </div>
        <div className="flex flex-col gap-1">
          <span className={hint}>{t(lang, 'grc.folders.move')}</span>
          <form className="flex items-center gap-2"
            onSubmit={(e) => { e.preventDefault(); run(() => moveFolder(node.id, target === '' ? null : target)); }}>
            <select name="target" value={target} onChange={(e) => setTarget(e.target.value)} aria-label={t(lang, 'grc.folders.move')}
              className="field min-w-0 flex-1 py-1 text-[12.5px]">
              <option value="">{t(lang, 'grc.folders.root')}</option>
              {targets.map((f) => <option key={f.id} value={f.id}>{`${'\u00a0\u00a0'.repeat(f.depth - 1)}${f.name}`}</option>)}
            </select>
            <button type="submit" disabled={pending || target === current} className="btn shrink-0 px-2 py-1 text-[12px]">{t(lang, 'common.save')}</button>
          </form>
        </div>
        <div className="flex flex-col gap-1">
          <button type="button" disabled={pending || !empty} onClick={() => run(() => deleteFolder(node.id))}
            className="btn self-start px-2 py-1 text-[12px] text-muted hover:border-sev-critical/50 hover:text-sev-critical disabled:opacity-50">
            {t(lang, 'grc.folders.delete')}
          </button>
          {!empty ? <span className={hint}>{t(lang, 'grc.folders.notEmpty')}</span> : null}
        </div>
        {error ? <p role="alert" className="text-[12px] text-sev-critical">{error}</p> : null}
      </div>
    </details>
  );
}

function Branch({ nodes, ctx }: { nodes: FolderNode[]; ctx: Ctx }) {
  if (nodes.length === 0) return null;
  return (
    <ul className="flex flex-col">
      {nodes.map((n) => {
        const active = ctx.selected === n.id;
        return (
          <li key={n.id} className="flex flex-col">
            <div className="flex items-center gap-1" style={{ paddingLeft: `${(n.depth - 1) * 12}px` }}>
              <Link href={`${ctx.base}?folder=${n.id}`} className={rowLink(active)} aria-current={active ? 'page' : undefined}>
                {n.name}
                {ctx.counts[n.id] ? <span className="mono ml-2 text-[11px] text-muted-soft">{ctx.counts[n.id]}</span> : null}
              </Link>
              <FolderMenu node={n} ctx={ctx} />
            </div>
            <Branch nodes={n.children} ctx={ctx} />
          </li>
        );
      })}
    </ul>
  );
}

function NewTopFolder({ customerId, lang }: { customerId: string; lang: Lang }) {
  const { pending, error, run } = useRun(lang);
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="btn self-start px-2 py-1 text-[12px]">{t(lang, 'grc.folders.new')}</button>;
  }
  return (
    <div className="flex flex-col gap-1">
      <NameForm key={formKey} label={t(lang, 'grc.folders.name')} submit={t(lang, 'common.save')} pending={pending}
        onSubmit={(name) => run(() => createFolder(customerId, null, name), () => { setFormKey((k) => k + 1); setOpen(false); })} />
      {error ? <p role="alert" className="text-[12px] text-sev-critical">{error}</p> : null}
    </div>
  );
}

/**
 * Folder navigation for the customer workspace. Collapsed into a <details> below 768 px;
 * from md up the content is forced visible with CSS (`::details-content`), so no JS decides it.
 */
export default function FolderTree({ customerId, base, tree, counts, total, rootCount, selected, lang }: {
  customerId: string; base: string; tree: FolderNode[]; counts: Record<string, number>;
  total: number; rootCount: number; selected: FolderSelection; lang: Lang;
}) {
  const ctx: Ctx = { customerId, base, lang, all: flatten(tree), counts, selected };
  return (
    <details className="panel p-3 md:details-content:[content-visibility:visible]">
      <summary className="mono cursor-pointer px-2 py-1 text-[11px] uppercase tracking-wider text-muted-soft">{t(lang, 'grc.folders.title')}</summary>
      <div className="mt-2 flex flex-col gap-1">
        <Link href={base} className={rowLink(selected === 'all')} aria-current={selected === 'all' ? 'page' : undefined}>
          {t(lang, 'grc.folders.all')}<span className="mono ml-2 text-[11px] text-muted-soft">{total}</span>
        </Link>
        <Link href={`${base}?folder=root`} className={rowLink(selected === 'root')} aria-current={selected === 'root' ? 'page' : undefined}>
          {t(lang, 'grc.folders.root')}{rootCount ? <span className="mono ml-2 text-[11px] text-muted-soft">{rootCount}</span> : null}
        </Link>
        <div className="my-1 border-t border-line" />
        <Branch nodes={tree} ctx={ctx} />
        <div className="mt-2 px-2">
          <NewTopFolder customerId={customerId} lang={lang} />
        </div>
      </div>
    </details>
  );
}
