import { addYears } from "@/lib/time";
import type { WeatherKind } from "@/lib/types";
import { fetchJson } from "@/lib/weather/errors";
import { kindFromWmo } from "@/lib/weather/kind";
import { num, round1 } from "@/lib/weather/shared";

/** How many past years the "This day" block shows. */
export const YEARS_BACK = 10;

export interface HistoryYear {
  /** 1 = last year, 10 = ten years ago. */
  yearsAgo: number;
  date: string;
  kind: WeatherKind;
  max: number;
  min: number;
  precipitation: number;
  windMax: number | null;
  windDirection: number | null;
}

interface ArchiveDaily {
  time?: string[];
  weather_code?: Array<number | null>;
  temperature_2m_max?: Array<number | null>;
  temperature_2m_min?: Array<number | null>;
  precipitation_sum?: Array<number | null>;
  wind_speed_10m_max?: Array<number | null>;
  wind_direction_10m_dominant?: Array<number | null>;
}

interface ArchiveResponse {
  daily?: ArchiveDaily;
}

/**
 * One request for the whole ten-year window. Ten separate requests used to hit
 * the archive API in parallel and occasionally came back short, which left gaps
 * in the year tabs.
 */
export function archiveUrl(lat: number, lon: number, start: string, end: string): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    start_date: start,
    end_date: end,
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "wind_speed_10m_max",
      "wind_direction_10m_dominant",
    ].join(","),
    timezone: "auto",
  });
  return `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`;
}

/** Same calendar day for each of the last ten years, newest first. */
export async function loadHistory(
  lat: number,
  lon: number,
  date: string,
): Promise<HistoryYear[]> {
  const dates = Array.from({ length: YEARS_BACK }, (_, index) =>
    addYears(date, -(index + 1)),
  );
  const start = dates[dates.length - 1];
  const end = dates[0];

  const payload = await fetchJson<ArchiveResponse>(archiveUrl(lat, lon, start, end), {
    // Archived days never change, so they can sit in the edge cache for a day.
    revalidate: 86_400,
    timeoutMs: 20_000,
  });

  const daily = payload.daily;
  if (!daily?.time?.length) return [];

  const index = new Map<string, number>();
  daily.time.forEach((day, position) => index.set(day, position));

  const years: HistoryYear[] = [];
  dates.forEach((day, position) => {
    const at = index.get(day);
    if (at === undefined) return;
    const max = num(daily.temperature_2m_max?.[at]);
    const min = num(daily.temperature_2m_min?.[at]);
    if (max === null || min === null) return;
    years.push({
      yearsAgo: position + 1,
      date: day,
      kind: kindFromWmo(daily.weather_code?.[at] ?? null),
      max: round1(max),
      min: round1(min),
      precipitation: round1(num(daily.precipitation_sum?.[at]) ?? 0),
      windMax: num(daily.wind_speed_10m_max?.[at]),
      windDirection: num(daily.wind_direction_10m_dominant?.[at]),
    });
  });

  return years;
}
