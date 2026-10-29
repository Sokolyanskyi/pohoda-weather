import { describe, expect, it } from "vitest";
import { THEMES, THEME_META, isDarkTheme, isTheme } from "@/lib/theme";
import { PROVIDERS, PROVIDER_MAP, isProviderId } from "@/lib/weather/providers";
import { ICON_PACKS, isIconPack } from "@/lib/client/prefs";
import { LOCALES } from "@/lib/i18n";

describe("themes", () => {
  it("ships twenty-seven schemes, twenty-three of them dark", () => {
    expect(THEMES).toHaveLength(27);
    const dark = THEMES.filter((theme) => isDarkTheme(theme));
    const light = THEMES.filter((theme) => !isDarkTheme(theme));
    expect(dark).toHaveLength(23);
    expect(light).toHaveLength(4);
  });

  it("has complete previews and bar colours", () => {
    for (const theme of THEMES) {
      const meta = THEME_META[theme];
      expect(meta.barColor).toMatch(/^#[0-9a-f]{6}$/i);
      for (const value of Object.values(meta.preview)) {
        expect(value).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it("validates theme ids", () => {
    expect(isTheme("midnight")).toBe(true);
    expect(isTheme("neon")).toBe(false);
  });
});

describe("providers", () => {
  it("lists ten free providers with unique ids", () => {
    expect(PROVIDERS).toHaveLength(10);
    expect(new Set(PROVIDERS.map((provider) => provider.id)).size).toBe(10);
  });

  it("keeps forecast ranges plausible", () => {
    for (const provider of PROVIDERS) {
      expect(provider.days).toBeGreaterThanOrEqual(5);
      expect(provider.days).toBeLessThanOrEqual(16);
      expect(PROVIDER_MAP[provider.id]).toBe(provider);
    }
  });

  it("needs no API keys anywhere", () => {
    expect(PROVIDERS.every((provider) => provider.keyless)).toBe(true);
  });

  it("validates provider ids", () => {
    expect(isProviderId("met-no")).toBe(true);
    expect(isProviderId("open-meteo-knmi")).toBe(true);
    expect(isProviderId("openweathermap")).toBe(false);
    expect(isProviderId("met.no")).toBe(false);
  });
});

describe("icon packs and locales", () => {
  it("ships eighteen icon packs", () => {
    expect(ICON_PACKS).toHaveLength(18);
    expect(isIconPack("pixel")).toBe(true);
    expect(isIconPack("glass")).toBe(true);
    expect(isIconPack("meteo-line")).toBe(true);
    expect(isIconPack("flat")).toBe(false);
  });

  it("ships six interface languages", () => {
    expect(LOCALES).toHaveLength(6);
  });
});
