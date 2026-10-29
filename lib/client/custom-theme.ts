"use client";

import { useEffect } from "react";

import type { SavedTheme } from "@/lib/types";

export interface CustomTheme {
  /** Page background, any CSS colour. */
  bg: string;
  /** Accent colour for buttons, chips, highlights. */
  accent: string;
  /** Card / surface colour. */
  card: string;
}

export type { SavedTheme };

export const DEFAULT_CUSTOM_THEME: CustomTheme = {
  bg: "#000000",
  accent: "#f4f4f5",
  card: "#0d0d0d",
};

const HEX = /^#[0-9a-f]{6}$/i;

export function isCustomTheme(value: unknown): value is CustomTheme {
  if (!value || typeof value !== "object") return false;
  const raw = value as Record<string, unknown>;
  return HEX.test(String(raw.bg)) && HEX.test(String(raw.accent)) && HEX.test(String(raw.card));
}

export function normalizeCustomTheme(value: unknown): CustomTheme | null {
  return isCustomTheme(value) ? { bg: value.bg, accent: value.accent, card: value.card } : null;
}

export function isSavedTheme(value: unknown): value is SavedTheme {
  if (!value || typeof value !== "object") return false;
  const raw = value as Record<string, unknown>;
  return (
    typeof raw.id === "string" &&
    raw.id.length > 0 &&
    raw.id.length <= 64 &&
    typeof raw.name === "string" &&
    raw.name.trim().length > 0 &&
    raw.name.length <= 40 &&
    HEX.test(String(raw.bg)) &&
    HEX.test(String(raw.accent)) &&
    HEX.test(String(raw.card))
  );
}

export function normalizeSavedTheme(value: unknown): SavedTheme | null {
  if (!isSavedTheme(value)) return null;
  const raw = value as SavedTheme;
  return {
    id: raw.id,
    name: raw.name.trim(),
    bg: raw.bg,
    accent: raw.accent,
    card: raw.card,
  };
}

export function normalizeSavedThemes(value: unknown): SavedTheme[] {
  if (!Array.isArray(value)) return [];
  const out: SavedTheme[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const normalized = normalizeSavedTheme(item);
    if (!normalized) continue;
    if (seen.has(normalized.id)) continue;
    seen.add(normalized.id);
    out.push(normalized);
    if (out.length >= 30) break;
  }
  return out;
}

function mix(hex: string, alphaPercent: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alphaPercent / 100})`;
}

function readable(hex: string): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#08080a" : "#f7f7f8";
}

/**
 * Applies a user-built theme by overriding the CSS variables of the built-in
 * black scheme, so every existing selector keeps working.
 */
export function applyCustomTheme(custom: CustomTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const dark = {
    bg: custom.bg,
    surface: mix(custom.card, 72),
    "surface-2": mix(custom.card, 50),
    "surface-solid": custom.card,
    text: readable(custom.bg),
    border: mix("#ffffff", 12).replace("#ffffff", "255, 255, 255"),
    "border-strong": mix("#ffffff", 24).replace("#ffffff", "255, 255, 255"),
  };
  // borders need rgb() because the built-ins use rgba(...) with alpha
  const borderR = 255, borderG = 255, borderB = 255;
  root.style.setProperty("--bg", dark.bg);
  root.style.setProperty("--surface", `rgba(${borderR}, ${borderG}, ${borderB}, 0.06)`);
  root.style.setProperty("--surface-2", `rgba(${borderR}, ${borderG}, ${borderB}, 0.04)`);
  root.style.setProperty("--surface-solid", dark["surface-solid"]);
  root.style.setProperty("--border", `rgba(${borderR}, ${borderG}, ${borderB}, 0.12)`);
  root.style.setProperty("--border-strong", `rgba(${borderR}, ${borderG}, ${borderB}, 0.24)`);
  root.style.setProperty("--text", dark.text);
  root.style.setProperty("--muted", `color-mix(in srgb, ${dark.text} 62%, ${custom.bg})`);
  root.style.setProperty("--muted-2", `color-mix(in srgb, ${dark.text} 42%, ${custom.bg})`);
  root.style.setProperty("--brand", custom.accent);
  root.style.setProperty("--brand-2", `color-mix(in srgb, ${custom.accent} 70%, #ffffff)`);
  root.style.setProperty("--brand-soft", mix(custom.accent, 16));
  root.style.setProperty("--on-brand", readable(custom.accent));
  root.style.setProperty("--ring", mix(custom.accent, 50));
  root.style.setProperty("--shadow", "0 30px 70px -40px rgba(0, 0, 0, 1)");
  root.style.setProperty("--sky-night-1", custom.bg);
  root.style.setProperty("--sky-night-2", custom.card);
  root.style.setProperty("--sky-night-3", `color-mix(in srgb, ${custom.accent} 12%, ${custom.card})`);
  root.style.setProperty("--sky-day-1", custom.bg);
  root.style.setProperty("--sky-day-2", custom.card);
  root.style.setProperty("--sky-day-3", `color-mix(in srgb, ${custom.accent} 14%, ${custom.card})`);
  root.style.setProperty("--cloud", `color-mix(in srgb, ${dark.text} 22%, transparent)`);
  root.style.setProperty("--icon-moon", `color-mix(in srgb, ${dark.text} 88%, ${custom.accent})`);
  root.style.setProperty("--icon-cloud", `color-mix(in srgb, ${dark.text} 80%, ${custom.accent})`);
  root.style.setProperty("--icon-drop", "#7dd3fc");
  root.style.setProperty("--icon-bolt", custom.accent);
  root.style.setProperty("--icon-star", `color-mix(in srgb, ${dark.text} 88%, ${custom.accent})`);
  root.style.setProperty("--icon-sun", custom.accent);
  root.setAttribute("data-theme", "black");
  root.setAttribute("data-scheme", "dark");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", custom.bg);
}

export function clearCustomTheme(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const inline = root.getAttribute("style") ?? "";
  const cleaned = inline
    .split(";")
    .filter((part) => {
      const name = part.split(":")[0]?.trim();
      return !name?.startsWith("--");
    })
    .join(";");
  root.setAttribute("style", cleaned);
}

/** Convenience helper used by the settings dialog. */
export function useCustomThemeEffect(
  theme: string,
  custom: CustomTheme | null,
): void {
  useEffect(() => {
    if (theme === "custom" && custom) {
      applyCustomTheme(custom);
      return () => clearCustomTheme();
    }
    clearCustomTheme();
  }, [theme, custom?.bg, custom?.accent, custom?.card]);
}
