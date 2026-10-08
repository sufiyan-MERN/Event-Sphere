const paths = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.2" /></>,
  chevron: <path d="m8 10 4 4 4-4" />,
  arrow: <><path d="M4 12h15" /><path d="m13 5 7 7-7 7" /></>,
  heart: <path d="M20.8 8.7c0 5.1-8.8 10.1-8.8 10.1S3.2 13.8 3.2 8.7A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.8 2.3Z" />,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.6-3.6 3-5.4 7-5.4s6.4 1.8 7 5.4" /></>,
  ticket: <><path d="M4 7a2 2 0 0 0 0 4 1 1 0 0 1 0 2 2 2 0 0 0 0 4h16V7Z" /><path d="M14 7v2m0 3v2m0 3v2" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  chevronLeft: <path d="m14 18-6-6 6-6" />,
  chevronRight: <path d="m10 18 6-6-6-6" />,
  check: <path d="m5 12 4 4L19 6" />,
  star: <path d="m12 3 2.6 5.3 5.9.9-4.3 4.2 1 6-5.2-2.8-5.2 2.8 1-6-4.3-4.2 5.9-.9Z" />,
  filter: <><path d="M4 7h16M7 12h10m-7 5h4" /><circle cx="8" cy="7" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="11" cy="17" r="1.5" /></>,
  spark: <><path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z" /></>,
  location: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
  calendar: <><rect x="4" y="6" width="16" height="14" rx="2" /><path d="M8 3v6m8-6v6M4 11h16" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  minus: <path d="M5 12h14" />,
  download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M4 17v3h16v-3" /></>,
  bag: <><path d="M5 8h14l-1 12H6Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
};

export default function Icon({ name, size = 20, className = '', strokeWidth = 1.7 }) {
  const shape = paths[name] || paths.spark;
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shape}</svg>;
}
