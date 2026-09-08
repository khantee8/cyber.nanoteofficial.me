'use client';

import type { ReactNode } from 'react';
import type { IntelSnapshot } from '@/lib/intel/aggregate';
import { epssBand, fmtDate, fmtInt, sevColor } from '@/lib/intel/format';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';
import Icon from '@/components/site/Icon';

export function PanelHeader({ title, sub, source, right }: { title: string; sub?: string; source?: string; right?: ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
      <div className="min-w-0">
        <h3 className="text-[14px] font-semibold tracking-tight">{title}</h3>
        {sub ? <p className="mt-0.5 text-[12px] leading-snug text-muted">{sub}</p> : null}
      </div>
      {right ?? (source ? <span className="eyebrow shrink-0 pt-0.5">{source}</span> : null)}
    </header>
  );
}

export function BarList({ rows, color = 'var(--accent)' }: { rows: { label: string; value: number; sub?: string }[]; color?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-1.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5">
          <span className="truncate text-[12.5px]">{r.label}</span>
          <span className="mono text-[11.5px] text-muted">{fmtInt(r.value)}{r.sub ? ` ${r.sub}` : ''}</span>
          <span className="col-span-2 block h-[3px] rounded-full bg-surface-3">
            <span className="block h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: color }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function ExtLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`group inline-flex items-center gap-1 hover:text-fg ${className ?? ''}`}>
      {children}
      <Icon name="external" className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-70" />
    </a>
  );
}

const scrollCls = (on?: boolean) => (on ? 'max-h-[520px] overflow-y-auto' : '');

export function ExploitedPanel({ snapshot, lang, limit = 30, scroll }: { snapshot: IntelSnapshot; lang: Lang; limit?: number; scroll?: boolean }) {
  const kev = snapshot.kev.slice(0, limit);
  return (
    <section className="panel min-w-0 overflow-hidden">
      <PanelHeader title={t(lang, 'intel.exploited.title')} sub={t(lang, 'intel.exploited.sub')} source="CISA · FIRST" />
      {snapshot.stats.topVendors30d.length ? (
        <div className="border-b border-line px-4 py-3">
          <p className="eyebrow mb-2">{t(lang, 'intel.exploited.vendors')}</p>
          <BarList rows={snapshot.stats.topVendors30d.map((v) => ({ label: v.vendor, value: v.count }))} color="var(--sev-critical)" />
        </div>
      ) : null}
      <ul className={`divide-y divide-line ${scrollCls(scroll)}`}>
        {kev.map((k) => {
          const band = epssBand(k.epss);
          return (
            <li key={k.cveId} className="px-4 py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <ExtLink href={k.url} className="mono text-[12.5px] font-medium text-fg">{k.cveId}</ExtLink>
                <span className="mono shrink-0 text-[11px] text-muted-soft">{t(lang, 'intel.exploited.added')} {fmtDate(k.dateAdded)}</span>
              </div>
              <p className="mt-0.5 truncate text-[12.5px] text-muted" title={k.name}>
                <span className="text-fg">{k.vendor}</span> {k.product} · {k.name}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="block h-[3px] flex-1 rounded-full bg-surface-3">
                  {k.epss !== undefined && band ? (
                    <span className="block h-full rounded-full" style={{ width: `${Math.max(2, k.epss * 100)}%`, background: sevColor[band] }} />
                  ) : null}
                </span>
                <span className="mono w-14 text-right text-[11px]" style={band ? { color: sevColor[band] } : { color: 'var(--muted-soft)' }}>
                  {k.epss !== undefined ? `EPSS ${(k.epss * 100).toFixed(0)}%` : 'EPSS —'}
                </span>
                {k.ransomwareUse ? (
                  <span className="mono rounded border border-sev-critical/40 px-1 text-[10px] uppercase text-sev-critical">{t(lang, 'intel.exploited.ransom')}</span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function RansomwarePanel({ snapshot, lang, country, limit = 40, scroll }: { snapshot: IntelSnapshot; lang: Lang; country: string | null; limit?: number; scroll?: boolean }) {
  const list = (country ? snapshot.ransomware.filter((v) => v.country === country) : snapshot.ransomware).slice(0, limit);
  return (
    <section className="panel min-w-0 overflow-hidden">
      <PanelHeader title={t(lang, 'intel.ransom.title')} sub={t(lang, 'intel.ransom.sub')} source="ransomware.live" />
      <div className="grid gap-4 border-b border-line px-4 py-3 sm:grid-cols-2">
        <div>
          <p className="eyebrow mb-2">{t(lang, 'intel.ransom.groups')}</p>
          <BarList rows={snapshot.stats.topGroups7d.slice(0, 6).map((g) => ({ label: g.group, value: g.count }))} color="var(--sev-high)" />
        </div>
        <div>
          <p className="eyebrow mb-2">{t(lang, 'intel.ransom.sectors')}</p>
          <BarList rows={snapshot.stats.topSectors7d.slice(0, 6).map((s) => ({ label: s.sector, value: s.count }))} color="var(--sev-medium)" />
        </div>
      </div>
      <p className="eyebrow px-4 pt-3">{t(lang, 'intel.ransom.latest')}{country ? ` · ${country}` : ''}</p>
      {list.length === 0 ? (
        <p className="px-4 py-6 text-center text-[12.5px] text-muted">{t(lang, 'intel.ransom.empty')}</p>
      ) : (
        <ul className={`divide-y divide-line ${scrollCls(scroll)}`}>
          {list.map((v, i) => (
            <li key={`${v.group}:${v.victim}:${i}`} className="flex items-baseline gap-3 px-4 py-2">
              <span className="mono w-16 shrink-0 text-[11px] text-muted-soft">{v.attackDate.slice(5)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px]">
                  <ExtLink href={v.url} className="text-fg">{v.victim}</ExtLink>
                </p>
                <p className="mono truncate text-[11px] text-muted-soft">
                  <span className="text-sev-high">{v.group}</span>
                  {v.sector ? ` · ${v.sector}` : ''}
                </p>
              </div>
              <span className="mono shrink-0 text-[11px] text-muted">{v.country ?? '—'}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function InfraPanel({ snapshot, lang, country }: { snapshot: IntelSnapshot; lang: Lang; country: string | null }) {
  const c2 = country ? snapshot.c2.filter((c) => c.country === country) : snapshot.c2;
  return (
    <section className="panel min-w-0 overflow-hidden">
      <PanelHeader title={t(lang, 'intel.infra.title')} sub={t(lang, 'intel.infra.sub')} source="abuse.ch · SANS" />
      {c2.length === 0 ? (
        <p className="px-4 py-6 text-center text-[12.5px] text-muted">{t(lang, 'intel.infra.empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="mono w-full text-[11.5px]">
            <thead>
              <tr className="text-left text-muted-soft">
                <th className="px-4 py-2 font-normal">IP</th>
                <th className="px-2 py-2 font-normal">Port</th>
                <th className="px-2 py-2 font-normal">Malware</th>
                <th className="px-2 py-2 font-normal">CC</th>
                <th className="px-2 py-2 font-normal">AS</th>
                <th className="px-4 py-2 text-right font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {c2.slice(0, 25).map((c) => (
                <tr key={`${c.ip}:${c.port}`}>
                  <td className="px-4 py-1.5 text-fg">{c.ip}</td>
                  <td className="px-2 py-1.5">{c.port}</td>
                  <td className="px-2 py-1.5 text-sev-high">{c.malware}</td>
                  <td className="px-2 py-1.5">{c.country ?? '—'}</td>
                  <td className="max-w-[160px] truncate px-2 py-1.5 text-muted">{c.asName ?? '—'}</td>
                  <td className="px-4 py-1.5 text-right">
                    <span style={{ color: c.status === 'online' ? 'var(--sev-critical)' : 'var(--muted-soft)' }}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="border-t border-line px-4 py-3">
        <p className="eyebrow mb-2">{t(lang, 'intel.infra.ports')}</p>
        <BarList rows={snapshot.isc.topPorts.slice(0, 8).map((p) => ({ label: `tcp/${p.port}`, value: p.records, sub: t(lang, 'intel.infra.records') }))} color="var(--sev-low)" />
      </div>
    </section>
  );
}

export function HeadlinesPanel({ snapshot, lang, limit = 20, scroll }: { snapshot: IntelSnapshot; lang: Lang; limit?: number; scroll?: boolean }) {
  return (
    <section className="panel min-w-0 overflow-hidden">
      <PanelHeader title={t(lang, 'intel.news.title')} sub={t(lang, 'intel.news.sub')} source="RSS" />
      <ul className={`divide-y divide-line ${scrollCls(scroll)}`}>
        {snapshot.headlines.slice(0, limit).map((h) => (
          <li key={h.url} className="px-4 py-2.5">
            <ExtLink href={h.url} className="text-[13px] leading-snug text-fg">{h.title}</ExtLink>
            <p className="mono mt-0.5 text-[11px] text-muted-soft">
              {h.source === 'thn' ? 'The Hacker News' : 'BleepingComputer'}
              {h.publishedAt ? ` · ${fmtDate(h.publishedAt)}` : ''}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
