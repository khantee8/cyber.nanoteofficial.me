import Link from 'next/link';
import type { IntelSnapshot } from '@/lib/intel/aggregate';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';
import WorldMap from '@/components/intel/WorldMap';
import { mapDataFrom } from '@/lib/intel/mapData';

export default function MapBand({ snapshot, lang }: { snapshot: IntelSnapshot; lang: Lang }) {
  const { points, heat } = mapDataFrom(snapshot);
  const countries = Object.keys(snapshot.stats.byCountry).length;
  return (
    <section className="border-b border-line bg-surface/40">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <div className="relative overflow-hidden rounded-md border border-line bg-bg">
          <WorldMap points={points} heat={heat} interactive={false} lang={lang} className="mx-auto max-h-[460px] max-w-5xl" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 bg-gradient-to-t from-bg to-transparent px-4 pb-3 pt-10">
            <p className="max-w-lg text-[12.5px] text-muted">
              <span className="mono mr-2 text-fg">{t(lang, 'home.mapCountries', { n: countries })}</span>
              {t(lang, 'home.mapCaption')}
            </p>
            <Link href="/intel" className="pointer-events-auto mono text-[11.5px] text-accent hover:underline">
              {t(lang, 'intel.openFull')} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
