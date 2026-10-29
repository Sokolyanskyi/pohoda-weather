import { PREFS_STORAGE_KEY } from "@/lib/client/storage";

export const THEMES = [
  "daylight",
  "sand",
  "mint",
  "blossom",
  "midnight",
  "graphite",
  "black",
  "ink-red",
  "ink-green",
  "ink-blue",
  "ink-cyan",
  "ink-lime",
  "ink-violet",
  "ink-pink",
  "ink-orange",
  "ink-gold",
  "ink-teal",
  "aurora",
  "nebula",
  "ocean",
  "ember",
] as const;

export type ThemeId = (typeof THEMES)[number];

export interface ThemeMeta {
  scheme: "light" | "dark";
  /** Browser/PWA status bar colour. */
  barColor: string;
  /** Miniature of the palette shown in Settings. */
  preview: {
    bg: string;
    card: string;
    accent: string;
    line: string;
  };
}

export const THEME_META: Record<ThemeId, ThemeMeta> = {
  daylight: {
    scheme: "light",
    barColor: "#eef3fa",
    preview: { bg: "#eef3fa", card: "#ffffff", accent: "#2563eb", line: "#d7e2f2" },
  },
  sand: {
    scheme: "light",
    barColor: "#f7f1e7",
    preview: { bg: "#f7f1e7", card: "#fffdf9", accent: "#b45309", line: "#e8dcc9" },
  },
  mint: {
    scheme: "light",
    barColor: "#ecf6f1",
    preview: { bg: "#ecf6f1", card: "#ffffff", accent: "#0f766e", line: "#d3e8df" },
  },
  blossom: {
    scheme: "light",
    barColor: "#fbf0f5",
    preview: { bg: "#fbf0f5", card: "#ffffff", accent: "#be185d", line: "#f0d7e3" },
  },
  midnight: {
    scheme: "dark",
    barColor: "#070c18",
    preview: { bg: "#070c18", card: "#101a2c", accent: "#818cf8", line: "#22304d" },
  },
  graphite: {
    scheme: "dark",
    barColor: "#0b0b0d",
    preview: { bg: "#0b0b0d", card: "#17171b", accent: "#a3e635", line: "#2c2c34" },
  },
  black: {
    scheme: "dark",
    barColor: "#000000",
    preview: { bg: "#000000", card: "#0d0d0d", accent: "#f4f4f5", line: "#262626" },
  },
  "ink-red": {
    scheme: "dark",
    barColor: "#000000",
    preview: { bg: "#000000", card: "#0d0d0d", accent: "#ef4444", line: "#262626" },
  },
  "ink-green": {
    scheme: "dark",
    barColor: "#000000",
    preview: { bg: "#000000", card: "#0d0d0d", accent: "#22c55e", line: "#262626" },
  },
  "ink-blue": {
    scheme: "dark",
    barColor: "#000000",
    preview: { bg: "#000000", card: "#0d0d0d", accent: "#3b82f6", line: "#262626" },
  },
  "ink-cyan": {
    scheme: "dark",
    barColor: "#000000",
    preview: { bg: "#000000", card: "#0d0d0d", accent: "#22d3ee", line: "#262626" },
  },
  "ink-lime": {
    scheme: "dark",
    barColor: "#000000",
    preview: { bg: "#000000", card: "#0d0d0d", accent: "#a3e635", line: "#262626" },
  },
  "ink-violet": {
    scheme: "dark",
    barColor: "#000000",
    preview: { bg: "#000000", card: "#0d0d0d", accent: "#a855f7", line: "#262626" },
  },
  "ink-pink": {
    scheme: "dark",
    barColor: "#000000",
    preview: { bg: "#000000", card: "#0d0d0d", accent: "#ec4899", line: "#262626" },
  },
  "ink-orange": {
    scheme: "dark",
    barColor: "#000000",
    preview: { bg: "#000000", card: "#0d0d0d", accent: "#f97316", line: "#262626" },
  },
  "ink-gold": {
    scheme: "dark",
    barColor: "#000000",
    preview: { bg: "#000000", card: "#0d0d0d", accent: "#eab308", line: "#262626" },
  },
  "ink-teal": {
    scheme: "dark",
    barColor: "#000000",
    preview: { bg: "#000000", card: "#0d0d0d", accent: "#14b8a6", line: "#262626" },
  },
  aurora: {
    scheme: "dark",
    barColor: "#04120f",
    preview: { bg: "#04120f", card: "#0c211d", accent: "#34d399", line: "#163b33" },
  },
  nebula: {
    scheme: "dark",
    barColor: "#0c0818",
    preview: { bg: "#0c0818", card: "#191229", accent: "#c084fc", line: "#32224b" },
  },
  ocean: {
    scheme: "dark",
    barColor: "#04121c",
    preview: { bg: "#04121c", card: "#0a2030", accent: "#22d3ee", line: "#14384c" },
  },
  ember: {
    scheme: "dark",
    barColor: "#140d09",
    preview: { bg: "#140d09", card: "#241811", accent: "#fb923c", line: "#453023" },
  },
};

const THEME_SET = new Set<string>(THEMES);

export function isTheme(value: unknown): value is ThemeId {
  return typeof value === "string" && THEME_SET.has(value);
}

export function isDarkTheme(theme: ThemeId): boolean {
  return THEME_META[theme].scheme === "dark";
}

export function detectTheme(): ThemeId {
  if (typeof window === "undefined") return "daylight";
  try {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "midnight"
      : "daylight";
  } catch {
    return "daylight";
  }
}

export function applyTheme(theme: ThemeId): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-scheme", THEME_META[theme].scheme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_META[theme].barColor);
}

/**
 * Runs before the first paint so a stored theme never flashes the default.
 * Kept ES5-ish on purpose: it runs before the bundle.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var valid=${JSON.stringify(
  THEMES,
)};var dark=${JSON.stringify(
  Object.fromEntries(THEMES.map((id) => [id, THEME_META[id].scheme === "dark"])),
)};var raw=localStorage.getItem(${JSON.stringify(PREFS_STORAGE_KEY)});var t=null;try{t=raw?JSON.parse(raw).theme:null;}catch(e){}if(!t||valid.indexOf(t)<0){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"midnight":"daylight";}document.documentElement.setAttribute("data-theme",t);document.documentElement.setAttribute("data-scheme",dark[t]?"dark":"light");}catch(e){document.documentElement.setAttribute("data-theme","daylight");document.documentElement.setAttribute("data-scheme","light");}})();`;
