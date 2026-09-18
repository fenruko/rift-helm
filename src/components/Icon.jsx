import React from "react";
const paths = {
  overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  economy: 'M12 3v18 M17 7H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H6',
  shield: 'M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7z M8 12l3 3 5-6',
  tickets: 'M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4z M15 8v2m0 4v2',
  message: 'M21 4H3v14h5l4 3v-3h9z M7 9h10 M7 13h6',
  bug: 'M8 8h8v8a4 4 0 0 1-8 0z M9 8V5h6v3 M3 10h5m8 0h5 M3 16h5m8 0h5 M6 3l3 3m6 0 3-3',
  ban: 'M5 5l14 14 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  voice: 'M9 4a3 3 0 0 1 6 0v8a3 3 0 0 1-6 0z M5 10v2a7 7 0 0 0 14 0v-2 M12 19v3 M8 22h8',
  trophy: 'M7 3h10v7a5 5 0 0 1-10 0z M7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4 M12 15v5 M8 21h8',
  guilds: 'M3 21V7l9-4 9 4v14 M8 21v-5h8v5 M7 8h2m6 0h2 M7 12h2m6 0h2',
  logs: 'M5 3h14v18H5z M9 7h6 M9 12h6 M9 17h4',
  control: 'M4 7h16 M4 17h16 M8 4v6 M16 14v6',
  users: 'M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3 M13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M18 3a4 4 0 0 1 0 8 M22 21v-3a4 4 0 0 0-3-4',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  activity: 'M2 12h5l3-8 4 16 3-8h5',
  clock: 'M12 7v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  refresh: 'M20 7a9 9 0 1 0 1 8 M20 2v6h-6',
  download: 'M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5',
  search: 'M16 16l5 5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  close: 'M6 6l12 12 M6 18 18 6',
  book: 'M12 5v16 M12 5C8 2 4 3 2 4v15c4-2 7-1 10 2 3-3 6-4 10-2V4c-2-1-6-2-10 1',
  logout: 'M9 3H3v18h6 M8 12h13 M16 7l5 5-5 5',
};
export default function Icon({ name = "overview", size = 18, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.overview} /></svg>;
}
