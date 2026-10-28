import type { Place } from "@/lib/types";
import { fetchJson } from "@/lib/weather/errors";

interface OpenMeteoZone {
  timezone?: string;
}

const cache = new Map<string, { value: string; expires: number }>();
const TTL = 24 * 60 * 60 * 1000;

function fixedZone(lon: number): string {
  const hours = Math.max(-12, Math.min(14, Math.round(lon / 15)));
  if (hours === 0) return "UTC";
  return hours > 0 ? `Etc/GMT-${hours}` : `Etc/GMT+${Math.abs(hours)}`;
}

function validZone(value: string | undefined): string | null {
  if (!value) return null;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return value;
  } catch {
    return null;
  }
}

/**
 * MET Norway and OpenWeatherMap do not return an IANA zone, so ask Open-Meteo
 * once per rounded coordinate pair and cache the answer for a day.
 */
export async function resolveTimezone(place: Place): Promise<string> {
  const known = validZone(place.timezone);
  if (known) return known;

  const key = `${place.lat.toFixed(2)},${place.lon.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  try {
    const params = new URLSearchParams({
      latitude: String(place.lat),
      longitude: String(place.lon),
      current: "temperature_2m",
      timezone: "auto",
      forecast_days: "1",
    });
    const data = await fetchJson<OpenMeteoZone>(
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
      { revalidate: 86_400 },
    );
    const zone = validZone(data.timezone);
    if (zone) {
      cache.set(key, { value: zone, expires: Date.now() + TTL });
      return zone;
    }
  } catch {
    // Fall through to a longitude-based fixed zone.
  }

  const fallback = fixedZone(place.lon);
  cache.set(key, { value: fallback, expires: Date.now() + TTL / 4 });
  return fallback;
}
