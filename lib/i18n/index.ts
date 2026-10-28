import { LOCALE_META, type Locale, isLocale } from "./locales";
import { en, type MessageKey } from "./messages/en";
import { uk } from "./messages/uk";
import { ru } from "./messages/ru";
import { pl } from "./messages/pl";
import { de } from "./messages/de";
import { es } from "./messages/es";
import type { WeatherErrorCode } from "@/lib/types";

export { LOCALES, LOCALE_META, detectLocale, isLocale, normalizeLocale } from "./locales";
export type { Locale, LocaleMeta } from "./locales";
export type { MessageKey } from "./messages/en";

export const messages: Record<Locale, Record<MessageKey, string>> = {
  en,
  uk,
  ru,
  pl,
  de,
  es,
};

export type MessageVars = Record<string, string | number>;

export function translate(
  locale: string | null | undefined,
  key: MessageKey,
  vars?: MessageVars,
): string {
  const dict = isLocale(locale) ? messages[locale] : messages.en;
  const template = dict[key] ?? messages.en[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    vars[name] === undefined ? match : String(vars[name]),
  );
}

export function localeIntl(locale: string | null | undefined): string {
  return isLocale(locale) ? LOCALE_META[locale].intl : LOCALE_META.en.intl;
}

const ERROR_KEYS: Record<WeatherErrorCode, MessageKey> = {
  key_required: "error.keyRequired",
  key_invalid: "error.keyInvalid",
  provider_error: "error.provider",
  invalid_request: "error.invalid",
  timeout: "error.timeout",
  rate_limit: "error.rateLimit",
  network: "error.network",
  unknown: "error.unknown",
};

export function errorMessage(
  locale: string | null | undefined,
  code: string | null | undefined,
): string {
  const key = ERROR_KEYS[code as WeatherErrorCode] ?? "error.unknown";
  return translate(locale, key);
}
