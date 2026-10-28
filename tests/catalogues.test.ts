import { describe, expect, it } from "vitest";
import { THEMES, THEME_META, isDarkTheme, isTheme } from "@/lib/theme";
import { PROVIDERS, PROVIDER_MAP, isProviderId } from "@/lib/weather/providers";
import { ICON_PACKS, isIconPack } from "@/lib/client/prefs";
import { LOCALES } from "@/lib/i18n";

describe("themes", () => {
  it("ships ten schemes, six of them dark", () => {
    expect(THEMES).toHaveLength(10);
    const dark = THEMES.filter((theme) => isDarkTheme(theme));
    const light = THEMES.filter((theme) => !isDarkTheme(theme));
    expect(dark).toHaveLength(6);
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
  it("lists seven providers with unique ids", () => {
    expect(PROVIDERS).toHaveLength(7);
    expect(new Set(PROVIDERS.map((provider) => provider.id)).size).toBe(7);
  });

  it("keeps forecast ranges plausible", () => {
    for (const provider of PROVIDERS) {
      expect(provider.days).toBeGreaterThanOrEqual(5);
      expect(provider.days).toBeLessThanOrEqual(16);
      expect(PROVIDER_MAP[provider.id]).toBe(provider);
    }
  });

  it("marks the commercial providers as keyed", () => {
    const keyed = PROVIDERS.filter((provider) => !provider.keyless).map((provider) => provider.id);
    expect(keyed).toEqual(["openweathermap", "visual-crossing"]);
    expect(PROVIDERS.filter((provider) => provider.keyless)).toHaveLength(5);
  });

  it("validates provider ids", () => {
    expect(isProviderId("met-no")).toBe(true);
    expect(isProviderId("met.no")).toBe(false);
  });
});

describe("icon packs and locales", () => {
  it("ships eight icon packs", () => {
    expect(ICON_PACKS).toHaveLength(8);
    expect(isIconPack("pixel")).toBe(true);
    expect(isIconPack("flat")).toBe(false);
  });

  it("ships six interface languages", () => {
    expect(LOCALES).toHaveLength(6);
  });
});
