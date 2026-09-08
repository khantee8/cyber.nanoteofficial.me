import { getLang } from '@/lib/lang';
import { getIntelSnapshot } from '@/lib/intel/snapshot';
import Nav from '@/components/site/Nav';
import Footer from '@/components/site/Footer';
import Hero from '@/components/landing/Hero';
import MapBand from '@/components/landing/MapBand';
import Modules from '@/components/landing/Modules';
import Flow from '@/components/landing/Flow';
import AccessSection from '@/components/landing/AccessSection';

export default async function Home() {
  const [lang, snapshot] = await Promise.all([getLang(), getIntelSnapshot()]);
  return (
    <>
      <Nav lang={lang} />
      <main className="flex-1">
        <Hero snapshot={snapshot} lang={lang} />
        <MapBand snapshot={snapshot} lang={lang} />
        <Modules lang={lang} />
        <Flow lang={lang} />
        <AccessSection lang={lang} />
      </main>
      <Footer lang={lang} refreshedAt={snapshot.generatedAt} />
    </>
  );
}
