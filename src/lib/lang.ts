import { cookies } from 'next/headers';

export const LANGS = ['en', 'th'] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_COOKIE = 'lang';

function isLang(v: string | undefined): v is Lang {
  return v === 'en' || v === 'th';
}

/** The visitor's language, defaulting to English. Server components only. */
export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : 'en';
}
