import type { Metadata } from 'next';
import { getLang } from '@/lib/lang';
import { pick, t } from '@/lib/i18n';
import { modules } from '@/lib/modules';
import ModulePage from '@/components/site/ModulePage';

const mod = modules.find((m) => m.slug === 'training')!;

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
      paragraphs={[t(lang, 'module.training.p1'), t(lang, 'module.training.p2')]}
      bullets={[t(lang, 'module.training.b1'), t(lang, 'module.training.b2'), t(lang, 'module.training.b3'), t(lang, 'module.training.b4')]}
    />
  );
}
