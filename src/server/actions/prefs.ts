'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { LANG_COOKIE, type Lang } from '@/lib/lang';

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setLang(lang: Lang) {
  if (lang !== 'en' && lang !== 'th') throw new Error('Invalid language');
  (await cookies()).set(LANG_COOKIE, lang, {
    maxAge: ONE_YEAR,
    path: '/',
    sameSite: 'lax',
  });
  revalidatePath('/', 'layout');
}
