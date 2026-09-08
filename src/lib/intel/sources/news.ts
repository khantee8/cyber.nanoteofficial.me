import { fetchText, type Headline } from '../types';

export const THN_URL = 'https://feeds.feedburner.com/TheHackersNews';
export const BLEEPING_URL = 'https://www.bleepingcomputer.com/feed/';

function field(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`));
  return m ? m[1].trim() : '';
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘').replace(/&#8220;/g, '“').replace(/&#8221;/g, '”')
    .replace(/&nbsp;/g, ' ');
}

/** Parse an RSS 2.0 feed into headlines. Throws when the text is not an RSS document. */
export function parseRss(xml: string, source: Headline['source'], limit = 12): Headline[] {
  if (!/<rss[\s>]|<channel>/.test(xml)) throw new Error('RSS: not an RSS document');
  const out: Headline[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null && out.length < limit) {
    const title = decode(field(m[1], 'title'));
    const url = field(m[1], 'link');
    if (!title || !/^https?:\/\//.test(url)) continue;
    const pub = field(m[1], 'pubDate');
    const d = pub ? new Date(pub) : null;
    out.push({ title, url, source, publishedAt: d && !Number.isNaN(d.getTime()) ? d.toISOString() : null });
  }
  return out;
}

export async function fetchNews(signal?: AbortSignal): Promise<Headline[] | null> {
  const accept = 'application/rss+xml, application/xml, text/xml';
  const [thn, bleeping] = await Promise.all([
    fetchText(THN_URL, accept, signal),
    fetchText(BLEEPING_URL, accept, signal),
  ]);
  const items: Headline[] = [];
  for (const [xml, source] of [[thn, 'thn'], [bleeping, 'bleeping']] as const) {
    if (xml === null) continue;
    try {
      items.push(...parseRss(xml, source));
    } catch {
      /* one bad feed must not sink the other */
    }
  }
  if (items.length === 0) return null;
  return items.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')).slice(0, 20);
}
