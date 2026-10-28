import {
  convertPrecip,
  convertPressure,
  convertTemperature,
  convertVisibility,
  convertWind,
  precipUnit,
  pressureUnit,
  temperatureUnit,
  visibilityUnit,
  windUnit,
} from "@/lib/units";
import type { PrecipUnit, PressureUnit, TemperatureUnit, WindUnit } from "@/lib/types";
import { localeIntl } from "@/lib/i18n";
import { translate, type MessageKey } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

const numberFormatters = new Map<string, Intl.NumberFormat>();

function numberFormat(locale: string, decimals: number): Intl.NumberFormat {
  const intl = localeIntl(locale);
  const key = `${intl}:${decimals}`;
  let formatter = numberFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(intl, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    numberFormatters.set(key, formatter);
  }
  return formatter;
}

export function formatNumber(
  value: number | null | undefined,
  locale: string,
  decimals = 0,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const rounded = Number(value.toFixed(Math.min(20, Math.max(0, decimals))));
  return numberFormat(locale, decimals).format(rounded === 0 ? 0 : rounded);
}

export function formatPercent(value: number | null | undefined, locale: string): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${formatNumber(Math.round(value), locale)}%`;
}

export function tempValue(
  celsius: number | null | undefined,
  unit: TemperatureUnit,
  locale: string,
  decimals = 0,
): string {
  if (celsius === null || celsius === undefined || Number.isNaN(celsius)) return "—";
  return formatNumber(convertTemperature(celsius, unit), locale, decimals);
}

export function formatTemp(
  celsius: number | null | undefined,
  unit: TemperatureUnit,
  locale: string,
  options: { withUnit?: boolean; decimals?: number } = {},
): string {
  const { withUnit = true, decimals = 0 } = options;
  const value = tempValue(celsius, unit, locale, decimals);
  if (value === "—") return value;
  return withUnit ? `${value}${temperatureUnit(unit)}` : `${value}°`;
}

export function formatWind(
  kmh: number | null | undefined,
  unit: WindUnit,
  locale: string,
): string {
  if (kmh === null || kmh === undefined || Number.isNaN(kmh)) return "—";
  const decimals = unit === "ms" ? 1 : 0;
  return `${formatNumber(convertWind(kmh, unit), locale, decimals)} ${windUnit(unit)}`;
}

export function formatPressure(
  hpa: number | null | undefined,
  unit: PressureUnit,
  locale: string,
): string {
  if (hpa === null || hpa === undefined || Number.isNaN(hpa)) return "—";
  const decimals = unit === "inhg" ? 2 : 0;
  return `${formatNumber(convertPressure(hpa, unit), locale, decimals)} ${pressureUnit(unit)}`;
}

export function formatPrecip(
  mm: number | null | undefined,
  unit: PrecipUnit,
  locale: string,
): string {
  if (mm === null || mm === undefined || Number.isNaN(mm)) return "—";
  const converted = convertPrecip(mm, unit);
  const decimals = unit === "in" ? 2 : converted > 0 && converted < 10 ? 1 : 0;
  return `${formatNumber(converted, locale, decimals)} ${precipUnit(unit)}`;
}

export function formatVisibility(
  meters: number | null | undefined,
  unit: PrecipUnit,
  locale: string,
): string {
  if (meters === null || meters === undefined || Number.isNaN(meters)) return "—";
  const converted = convertVisibility(meters, unit);
  const decimals = converted < 10 ? 1 : 0;
  return `${formatNumber(converted, locale, decimals)} ${visibilityUnit(unit)}`;
}

export function formatDaylight(
  minutes: number | null,
  locale: string,
): string {
  if (minutes === null || minutes === undefined) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return translate(locale as Locale, "sun.hours" as MessageKey, { h, m });
}

export function formatCoords(lat: number, lon: number, locale: string): string {
  return `${formatNumber(lat, locale, 2)}, ${formatNumber(lon, locale, 2)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
