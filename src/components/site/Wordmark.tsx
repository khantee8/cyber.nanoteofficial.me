import Link from 'next/link';
import Icon from './Icon';

export default function Wordmark({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 text-fg no-underline">
      <span className="grid h-7 w-7 place-items-center rounded-md border border-line-strong bg-surface text-accent">
        <Icon name="shield" className="h-4 w-4" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">NaNote</span>
      <span className="mono text-[13px] text-accent">cyber</span>
    </Link>
  );
}
