import { ago } from '@/lib/intel/format';
import type { Lang } from '@/lib/lang';
import { t } from '@/lib/i18n';

/** "3d ago" / "3 วัน ที่แล้ว", or "just now" without a trailing "ago". */
export function since(d: Date | string, now: Date, lang: Lang): string {
  const iso = new Date(d).toISOString();
  const s = ago(iso, now, lang);
  return now.getTime() - new Date(iso).getTime() < 60_000 ? s : t(lang, 'common.ago', { t: s });
}
