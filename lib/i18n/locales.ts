export const LOCALES = ["en", "uk", "ru", "pl", "de", "es"] as const;

export type Locale = (typeof LOCALES)[number];

export interface LocaleMeta {
  nativeName: string;
  englishName: string;
  htmlLang: string;
  intl: string;
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  en: { nativeName: "English", englishName: "English", htmlLang: "en", intl: "en-GB" },
  uk: { nativeName: "Українська", englishName: "Ukrainian", htmlLang: "uk", intl: "uk-UA" },
  ru: { nativeName: "Русский", englishName: "Russian", htmlLang: "ru", intl: "ru-RU" },
  pl: { nativeName: "Polski", englishName: "Polish", htmlLang: "pl", intl: "pl-PL" },
  de: { nativeName: "Deutsch", englishName: "German", htmlLang: "de", intl: "de-DE" },
  es: { nativeName: "Español", englishName: "Spanish", htmlLang: "es", intl: "es-ES" },
};

const LOCALE_SET = new Set<string>(LOCALES);

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALE_SET.has(value);
}

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace("_", "-");
  if (normalized.startsWith("uk")) return "uk";
  if (normalized.startsWith("ru")) return "ru";
  if (normalized.startsWith("pl")) return "pl";
  if (normalized.startsWith("de")) return "de";
  if (normalized.startsWith("es")) return "es";
  if (normalized.startsWith("en")) return "en";
  return null;
}

/** Best supported locale for the browser, falling back to English. */
export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const candidates =
    Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];
  for (const candidate of candidates) {
    const locale = normalizeLocale(candidate);
    if (locale) return locale;
  }
  return "en";
}
