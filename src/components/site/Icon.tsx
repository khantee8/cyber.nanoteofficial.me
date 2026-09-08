import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'shield' | 'globe' | 'radar' | 'clipboard' | 'flask' | 'graduation'
  | 'arrow' | 'check' | 'alert' | 'external' | 'pulse' | 'menu' | 'close' | 'lock' | 'download';

const paths: Record<IconName, ReactNode> = {
  shield: <path d="M12 3l7 2.8v5.6c0 4.3-3 7.8-7 9.6-4-1.8-7-5.3-7-9.6V5.8L12 3z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" />
    </>
  ),
  radar: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 12l6-6" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </>
  ),
  clipboard: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="1.5" />
      <path d="M9 4.5V3h6v1.5M9 10h6M9 14h6" />
    </>
  ),
  flask: <path d="M9 3h6M10 3v6l-5 9.5A1.5 1.5 0 006.3 21h11.4a1.5 1.5 0 001.3-2.5L14 9V3M7.5 15h9" />,
  graduation: (
    <>
      <path d="M3 9l9-4 9 4-9 4-9-4z" />
      <path d="M7 11v4.5c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5V11M21 9v5" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  alert: (
    <>
      <path d="M12 4l9 16H3l9-16z" />
      <path d="M12 10v4M12 17v.5" />
    </>
  ),
  external: <path d="M14 5h5v5M19 5l-8 8M17 13v5H6V7h5" />,
  pulse: <path d="M3 12h4l2-5 4 10 2-5h6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="1.5" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </>
  ),
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
};

export default function Icon({ name, className, ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? 'h-4 w-4'}
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
