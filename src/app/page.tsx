import { getLang } from '@/lib/lang';
import Nav from '@/components/site/Nav';
import Footer from '@/components/site/Footer';

export default async function Home() {
  const lang = await getLang();
  return (
    <>
      <Nav lang={lang} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-16 sm:px-8">
        <p className="eyebrow">NaNote Cyber</p>
      </main>
      <Footer lang={lang} />
    </>
  );
}
