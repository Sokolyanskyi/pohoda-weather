import type { DailyPoint, Place, WeatherKind, WeatherSnapshot } from "@/lib/types";
import { kindFromWmo } from "@/lib/weather/kind";
import { mean, round1 } from "@/lib/weather/shared";
import { sunTimes } from "@/lib/weather/sun";
import { addDays } from "@/lib/time";

interface ArchiveResponse {
  daily?: {
    time?: string[];
    temperature_2m_max?: Array<number | null>;
    temperature_2m_min?: Array<number | null>;
    precipitation_sum?: Array<number | null>;
    weather_code?: Array<number | null>;
  };
}

interface ClimateSample {
  max: number | null;
  min: number | null;
  precip: number | null;
  code: number | null;
}

const YEARS = 10;
const LAST_YEAR = new Date().getUTCFullYear() - 1;

function monthDay(date: string): string {
  return date.slice(5);
}

function mostCommon(values: number[]): number | null {
  if (values.length === 0) return null;
  const counts = new Map<number, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

async function archiveWindow(
  place: Place,
  start: string,
  end: string,
): Promise<Map<string, ClimateSample>> {
  const params = new URLSearchParams({
    latitude: String(place.lat),
    longitude: String(place.lon),
    start_date: start,
    end_date: end,
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code",
    timezone: "auto",
  });
  const response = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`,
    { next: { revalidate: 86_400 } },
  );
  if (!response.ok) throw new Error(`Archive responded with ${response.status}`);
  const data = (await response.json()) as ArchiveResponse;
  const map = new Map<string, ClimateSample>();
  const dates = data.daily?.time ?? [];
  for (let index = 0; index < dates.length; index += 1) {
    const key = monthDay(dates[index]);
    const existing = map.get(key);
    const sample: ClimateSample = {
      max: data.daily?.temperature_2m_max?.[index] ?? null,
      min: data.daily?.temperature_2m_min?.[index] ?? null,
      precip: data.daily?.precipitation_sum?.[index] ?? null,
      code: data.daily?.weather_code?.[index] ?? null,
    };
    if (existing) {
      existing.max = mean([existing.max, sample.max]);
      existing.min = mean([existing.min, sample.min]);
      existing.precip = mean([existing.precip, sample.precip]);
      existing.code = sample.code ?? existing.code;
    } else {
      map.set(key, sample);
    }
  }
  return map;
}

/**
 * A 10-year day-of-year average for the dates beyond the provider forecast.
 * This is a climate reference, deliberately labelled as such in the UI.
 */
export async function climateAverages(
  place: Place,
  dates: string[],
  timezone: string,
): Promise<DailyPoint[]> {
  if (dates.length === 0) return [];
  const startMonthDay = monthDay(dates[0]);
  const endMonthDay = monthDay(dates[dates.length - 1]);
  const wraps = endMonthDay < startMonthDay;

  const requests: Array<Promise<Map<string, ClimateSample>>> = [];
  for (let offset = 0; offset < YEARS; offset += 1) {
    const year = LAST_YEAR - offset;
    const start = `${year}-${startMonthDay}`;
    const end = wraps
      ? `${year + 1}-${endMonthDay}`
      : `${year}-${endMonthDay}`;
    requests.push(archiveWindow(place, start, end).catch(() => new Map()));
  }

  const windows = await Promise.all(requests);
  const daily: DailyPoint[] = [];

  for (const date of dates) {
    const key = monthDay(date);
    const samples = windows
      .map((window) => window.get(key))
      .filter((sample): sample is ClimateSample => Boolean(sample));
    if (samples.length === 0) continue;

    const max = mean(samples.map((sample) => sample.max));
    const min = mean(samples.map((sample) => sample.min));
    if (max === null || min === null) continue;

    const precip = mean(samples.map((sample) => sample.precip)) ?? 0;
    const codes = samples
      .map((sample) => sample.code)
      .filter((code): code is number => typeof code === "number");
    const code = mostCommon(codes);
    const wetYears = samples.filter((sample) => (sample.precip ?? 0) >= 1).length;
    const sun = sunTimes(date, place.lat, place.lon);

    daily.push({
      date,
      kind: (code === null ? "cloudy" : kindFromWmo(code)) as WeatherKind,
      max: round1(max),
      min: round1(min),
      feelsMax: null,
      feelsMin: null,
      precipitation: round1(precip),
      precipitationProbability: samples.length
        ? Math.round((wetYears / samples.length) * 100)
        : null,
      windMax: null,
      windGustMax: null,
      windDirection: null,
      uvMax: null,
      humidityMean: null,
      sunrise: sun.sunrise,
      sunset: sun.sunset,
      source: "climate",
    });
  }

  return daily;
}

/** Extend a snapshot to `targetDays` with climate averages when needed. */
export async function fillClimate(
  snapshot: WeatherSnapshot,
  targetDays: number,
): Promise<WeatherSnapshot> {
  const missing = targetDays - snapshot.daily.length;
  if (missing <= 0) return snapshot;
  const last = snapshot.daily[snapshot.daily.length - 1];
  if (!last) return snapshot;

  const dates: string[] = [];
  for (let offset = 1; offset <= missing; offset += 1) {
    dates.push(addDays(last.date, offset));
  }

  try {
    const climate = await climateAverages(snapshot.place, dates, snapshot.timezone);
    if (climate.length === 0) return snapshot;
    return {
      ...snapshot,
      daily: [...snapshot.daily, ...climate],
      climateDays: climate.length,
    };
  } catch {
    return snapshot;
  }
}
