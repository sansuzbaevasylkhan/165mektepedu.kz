import type { ReactNode } from 'react';

const PATHS: Record<string, ReactNode> = {
  instagram: (<><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></>),
  youtube: (<><rect x="2" y="5" width="20" height="14" rx="4" /><path d="M10 9l5 3-5 3z" fill="currentColor" /></>),
  facebook: (<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5c0-.3.2-.5.5-.5z" />),
  tiktok: (<><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 3c.3 2.5 2 4.2 5 4.5" /></>),
  telegram: (<path d="M21 4L3 11l5 2 2 6 3.5-4 5 3zM8 13l12-8" />),
  sun: (<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>),
  moon: (<path d="M21 13.5A9 9 0 1 1 10.5 3a7 7 0 0 0 10.5 10.5z" />),
  menu: (<path d="M4 7h16M4 12h16M4 17h16" />),
  close: (<path d="M6 6l12 12M18 6L6 18" />),
  lock: (<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
  check: (<path d="M5 12.5l4.5 4.5L19 7.5" />),
  play: (<path d="M8 5l11 7-11 7z" fill="currentColor" />),
  phone: (<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />),
  mail: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>),
  pin: (<><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.500C5 14.800 12 21 12 21z" /><circle cx="12" cy="9.500" r="2.500" /></>),
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  book: (<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13" />),
  cap: (<><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.500 3 3 6 3s6-1.500 6-3v-5" /></>),
  trophy: (<><path d="M8 4h8v5a4 4 0 0 1-8 0V4z" /><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M10 17h4" /></>),
  star: (<path d="M12 3l2.700 5.600 6.100.9-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100L3.200 9.500l6.100-.9z" />),
  users: (<><circle cx="9" cy="8" r="3.500" /><path d="M2.500 20a6.500 6.500 0 0 1 13 0M16 4.500a3.500 3.500 0 0 1 0 7M18 14a6 6 0 0 1 3.500 6" /></>),
  shield: (<path d="M12 3l8 3v6c0 4.500-3.200 8-8 9-4.800-1-8-4.500-8-9V6z" />),
  spark: (<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.500 2.500M15.500 15.500L18 18M6 18l2.500-2.500M15.500 8.500L18 6" />),
  chart: (<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />),
  news: (<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9h10M7 13h10M7 17h6" /></>),
  settings: (<><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.200l2-1.500-2-3.400-2.400 1a7 7 0 0 0-2-1.200L14 3h-4l-.5 2.700a7 7 0 0 0-2 1.200l-2.400-1-2 3.400 2 1.500A7 7 0 0 0 5 12c0 .4 0 .8.1 1.200l-2 1.500 2 3.400 2.400-1a7 7 0 0 0 2 1.200L10 21h4l.5-2.700a7 7 0 0 0 2-1.200l2.400 1 2-3.400-2-1.500c.1-.4.100-.8.100-1.200z" /></>),
  video: (<><rect x="3" y="5" width="13" height="14" rx="2" /><path d="M16 10l5-3v10l-5-3z" /></>),
  plus: (<path d="M12 5v14M5 12h14" />),
  edit: (<path d="M4 20h4L19 9l-4-4L4 16v4zM13.500 6.500l4 4" />),
  trash: (<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />),
  out: (<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h10" />),
  arrow: (<path d="M5 12h14M13 6l6 6-6 6" />),
  home: (<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />),
  grid: (<><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /></>),
  image: (<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></>),
  link: (<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />),
  history: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2M4 4v4h4" /></>),
  eye: (<><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" /><circle cx="12" cy="12" r="3" /></>),
  eyeOff: (<><path d="M3 3l18 18M10.5 6.2A11 11 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.3 3.9M6.5 7.7A17 17 0 0 0 2 12s3.5 6 10 6a11 11 0 0 0 4.2-.8" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>),
  search: (<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>),
  chevron: (<path d="M6 9l6 6 6-6" />),
  logout: (<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M15 8l4 4-4 4M19 12H9" />),
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>),
  key: (<><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M17 6l2 2M15 8l2 2" /></>),
  globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9S14.5 18.3 12 21c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" /></>),
  layers: (<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5" />),
  file: (<><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></>),
  smartphone: (<><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></>),
  bell: (<><path d="M18 15H6l1.5-2V9a4.5 4.5 0 0 1 9 0v4z" /><path d="M10 19a2 2 0 0 0 4 0" /></>),
  calendar: (<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
  clipboard: (<><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4a3 3 0 0 1 6 0M9 11h6M9 15h4" /></>),
  filter: (<path d="M3 5h18l-7 8v6l-4-2v-4z" />),
  palette: (<><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2 0-1.4-.8-2-.8-3 0-1 .8-2 2-2H18a3 3 0 0 0 3-3c0-4.4-4-8-9-8z" /><circle cx="7.5" cy="11" r="1" fill="currentColor" stroke="none" /><circle cx="10" cy="7" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="7.5" r="1" fill="currentColor" stroke="none" /></>),
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  );
}
