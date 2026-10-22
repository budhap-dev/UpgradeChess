import type { ReactNode } from 'react'

const PATHS = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9v12h14V9" /><path d="M10 21v-6h4v6" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  path: <><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16" /></>,
  book: <><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" /><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" /></>,
  zap: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  monitor: <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  chart: <><path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 5-6" /></>,
  award: <><circle cx="12" cy="8" r="6" /><path d="M8.2 13.2 7 22l5-3 5 3-1.2-8.8" /></>,
  library: <><path d="M4 4h4v16H4zM10 4h4v16h-4z" /><path d="m15.5 5.2 3.8-1 3.4 14.6-3.8 1z" /></>,
  sliders: <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />,
  flame: <path d="M12 22c4 0 7-2.7 7-6.8 0-3-1.7-5.2-3.3-6.9.1 2-1 3.4-2.2 3.7.4-3.3-1.2-6.6-4.5-9 .2 3.6-1.6 5.8-3.1 7.6C4.7 12.2 5 13.8 5 15.2 5 19.3 8 22 12 22z" />,
  check: <path d="M20 6 9 17l-5-5" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  bulb: <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />,
  'chevron-left': <path d="m15 18-6-6 6-6" />,
  'chevron-right': <path d="m9 18 6-6-6-6" />,
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  'arrow-left': <path d="M19 12H5M11 6l-6 6 6 6" />,
  first: <path d="M6 5v14M18 6l-8 6 8 6z" />,
  last: <path d="M18 5v14M6 6l8 6-8 6z" />,
  flip: <path d="M7 20V4M3 8l4-4 4 4M17 4v16M13 16l4 4 4-4" />,
  skip: <path d="m5 4 10 8-10 8zM19 5v14" />,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  rook: <path d="M6 21h12M7 18h10M8.5 18l1-9h5l1 9M7 9h10M7 9V4h2.5v2h1.5V4h2v2h1.5V4H17v5" />,
  crown: <path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 12H5zM5 19h14" />,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  retry: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  download: <path d="M12 4v11M7 10l5 5 5-5M4 20h16" />,
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof PATHS

/** Inline stroke icon on a 24×24 grid. Decorative: label the surrounding control instead. */
export function Icon({ name, size = 20, strokeWidth = 1.8, className }: { name: IconName; size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg className={className ? `icon ${className}` : 'icon'} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  )
}
