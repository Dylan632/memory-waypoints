import type { SiteLink } from "../content/site";

// 20px line icons; paths drawn on a 24-unit grid.
const paths: Record<SiteLink["icon"], string> = {
  github: "M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21",
  x: "M4 4l16 16M20 4L4 20",
  telegram: "M21 4L3 11l6 2m12-9l-3 16-9-7m12-9L9 13v5l3-3",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  instagram: "M4 4h16v16H4zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM17 7h.01",
  weibo: "M10 20c-4 0-7-2-7-5 0-3 4-7 8-8 2-.5 3 .5 2.5 2 2-1 4-.5 4 1 0 .6-.2 1-.5 1.3 1.8.6 2.5 1.8 2.5 3 0 3-4 5.7-9.5 5.7zM17 3a4 4 0 0 1 4 4",
};

export function LinkIcon({ name }: { name: SiteLink["icon"] }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d={paths[name]} /></svg>;
}
