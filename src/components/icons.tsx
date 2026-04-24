const ICONS: Record<string, string> = {
  search: 'M11 11l3.5 3.5M7.5 13a5.5 5.5 0 100-11 5.5 5.5 0 000 11z',
  home: 'M3 9.5L8 4l5 5.5V15H10v-4H6v4H3V9.5z',
  book: 'M4 3h10a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm3 0v13M4 7h3M4 10h3',
  file: 'M4 2h7l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1zm7 0v4h4',
  bolt: 'M13 2L4 10h6l-3 8 9-10H10l3-8z',
  settings: 'M10.325 3.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  chat: 'M8 12H5a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v5a2 2 0 01-2 2h-3l-4 4v-4z',
  chevronRight: 'M8 4l4 4-4 4',
  chevronDown: 'M4 8l4 4 4-4',
  chevronLeft: 'M12 4l-4 4 4 4',
  close: 'M5 5l6 6M11 5l-6 6',
  copy: 'M8 4H5a1 1 0 00-1 1v10a1 1 0 001 1h6a1 1 0 001-1v-2M9 4h5a1 1 0 011 1v7a1 1 0 01-1 1H9a1 1 0 01-1-1V5a1 1 0 011-1z',
  check: 'M4 8l3 3 5-5',
  sun: 'M12 3v1M12 20v1M4.22 4.22l.7.7M18.36 18.36l.7.7M3 12h1M20 12h1M4.22 19.78l.7-.7M18.36 5.64l.7-.7M12 7a5 5 0 100 10A5 5 0 0012 7z',
  moon: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  plus: 'M12 4v16M4 12h16',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  link: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  hash: 'M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18',
  alertCircle: 'M12 8v4M12 16h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  info: 'M12 16v-4M12 8h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  externalLink: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3',
  collapse: 'M4 4h5M4 4v5M20 4h-5M20 4v5M4 20h5M4 20v-5M20 20h-5M20 20v-5',
  menu: 'M4 6h16M4 12h16M4 18h16',
  tag: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
  layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  terminal: 'M4 17l6-6-6-6M12 19h8',
  cpu: 'M9 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2h-2M9 3a1 1 0 000 2h6a1 1 0 000-2M9 3V1M15 3V1M9 12h6M9 16h4',
  globe: 'M12 2a10 10 0 100 20A10 10 0 0012 2zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  sparkles: 'M5 3v4M3 5h4M6.5 17.5l-2 2M7.5 16.5l-2-2M19 3v4M17 5h4M17.5 17.5l2 2M16.5 16.5l2-2M12 6l1.5 3H17l-2.5 2 1 3.5L12 13l-3.5 1.5L9.5 11 7 9h3.5L12 6z',
  arrowRight: 'M5 12h14M12 5l7 7-7 7',
  upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
  image: 'M21 19H3a2 2 0 01-2-2V7a2 2 0 012-2h3l2-2h8l2 2h3a2 2 0 012 2v10a2 2 0 01-2 2zM12 17a5 5 0 100-10 5 5 0 000 10z',
  wand: 'M15 4l5 5-11 11H4v-5L15 4zM13 6l5 5',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  play: 'M5 3l14 9-14 9V3z',
};

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 16, className = '', style = {} }: IconProps) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {d.split('M').filter(Boolean).map((seg, i) => (
        <path key={i} d={'M' + seg} />
      ))}
    </svg>
  );
}

export { ICONS };
