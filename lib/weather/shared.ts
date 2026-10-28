import type { CurrentWeather, DailyPoint, HourlyPoint, WeatherKind } from "@/lib/types";

export function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function dewPoint(temperature: number | null, humidity: number | null): number | null {
  if (temperature === null || humidity === null || humidity <= 0) return null;
  const gamma =
    Math.log(humidity / 100) + (17.62 * temperature) / (243.12 + temperature);
  return round1((243.12 * gamma) / (17.62 - gamma));
}

/** Apparent temperature when the provider does not supply one. */
export function feelsLike(
  temperature: number | null,
  humidity: number | null,
  windKmh: number | null,
): number | null {
  if (temperature === null) return null;
  const wind = windKmh ?? 0;
  if (temperature <= 10 && wind > 4.8) {
    const v = wind ** 0.16;
    return round1(13.12 + 0.6215 * temperature - 11.37 * v + 0.3965 * temperature * v);
  }
  if (temperature >= 27 && humidity !== null && humidity >= 40) {
    const t = (temperature * 9) / 5 + 32;
    const h = humidity;
    let index =
      -42.379 +
      2.04901523 * t +
      10.14333127 * h -
      0.22475541 * t * h -
      0.00683783 * t * t -
      0.05481717 * h * h +
      0.00122874 * t * t * h +
      0.00085282 * t * h * h -
      0.00000199 * t * t * h * h;
    if (h < 13 && t >= 80 && t <= 112) {
      index -= ((13 - h) / 4) * Math.sqrt((17 - Math.abs(t - 95)) / 17);
    }
    return round1(((index - 32) * 5) / 9);
  }
  return round1(temperature);
}

export function severity(kind: WeatherKind): number {
  switch (kind) {
    case "hail":
      return 12;
    case "thunder":
      return 11;
    case "heavy-rain":
      return 10;
    case "snow":
      return 9;
    case "sleet":
      return 8;
    case "rain":
      return 7;
    case "drizzle":
      return 6;
    case "fog":
      return 5;
    case "overcast":
      return 4;
    case "cloudy":
      return 3;
    case "partly":
      return 2;
    case "clear":
      return 1;
  }
}

/** Most "notable" condition of the day, used when aggregating 3-hour steps. */
export function dominantKind(kinds: WeatherKind[]): WeatherKind {
  if (kinds.length === 0) return "cloudy";
  return kinds.reduce((best, kind) => (severity(kind) > severity(best) ? kind : best), kinds[0]);
}

export function mean(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function maxOf(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((value): value is number => typeof value === "number");
  return valid.length ? Math.max(...valid) : null;
}

export function minOf(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((value): value is number => typeof value === "number");
  return valid.length ? Math.min(...valid) : null;
}

export interface SnapshotParts {
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
}

export function emptySnapshotParts(): SnapshotParts {
  const now = new Date().toISOString();
  return {
    current: {
      time: now,
      temperature: 0,
      feelsLike: null,
      kind: "cloudy",
      isDay: true,
      humidity: null,
      pressure: null,
      windSpeed: null,
      windGust: null,
      windDirection: null,
      cloudCover: null,
      precipitation: null,
      visibility: null,
      uvIndex: null,
      dewPoint: null,
    },
    hourly: [],
    daily: [],
  };
}

export function clampDaily(daily: DailyPoint[], days: number): DailyPoint[] {
  return daily
    .filter((day) => Number.isFinite(day.max) && Number.isFinite(day.min))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, Math.max(1, days));
}
