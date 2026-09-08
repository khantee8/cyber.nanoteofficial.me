import type { Metadata } from 'next';
import { getLang } from '@/lib/lang';
import { pick, t } from '@/lib/i18n';
import { modules } from '@/lib/modules';
import ModulePage from '@/components/site/ModulePage';

const mod = modules.find((m) => m.slug === 'redteam')!;

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: pick(mod.name, lang), description: pick(mod.blurb, lang) };
}

export default async function Page() {
  const lang = await getLang();
  return (
    <ModulePage
      mod={mod}
      lang={lang}
      paragraphs={[t(lang, 'module.redteam.p1'), t(lang, 'module.redteam.p2')]}
      bullets={[t(lang, 'module.redteam.b1'), t(lang, 'module.redteam.b2'), t(lang, 'module.redteam.b3'), t(lang, 'module.redteam.b4')]}
    />
  );
}
