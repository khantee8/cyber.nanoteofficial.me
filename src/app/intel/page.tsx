import type { Metadata } from 'next';
import Link from 'next/link';
import { getLang } from '@/lib/lang';
import { t } from '@/lib/i18n';
import { getIntelSnapshot } from '@/lib/intel/snapshot';
import { ago } from '@/lib/intel/format';
import Nav from '@/components/site/Nav';
import Footer from '@/components/site/Footer';
import IntelWorkspace from '@/components/intel/IntelWorkspace';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: t(lang, 'intel.title'), description: t(lang, 'intel.lede') };
}

export default async function IntelPage() {
  const [lang, snapshot] = await Promise.all([getLang(), getIntelSnapshot()]);
  return (
    <>
      <Nav lang={lang} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="eyebrow">{t(lang, 'intel.eyebrow')}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t(lang, 'intel.title')}</h1>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">{t(lang, 'intel.lede')}</p>
          </div>
          <Link href="/api/intel" className="mono text-[11.5px] text-muted-soft hover:text-fg">{t(lang, 'intel.api')} →</Link>
        </div>
        <IntelWorkspace snapshot={snapshot} lang={lang} refreshedAgo={ago(snapshot.generatedAt, new Date(), lang)} />
      </main>
      <Footer lang={lang} refreshedAt={snapshot.generatedAt} />
    </>
  );
}
