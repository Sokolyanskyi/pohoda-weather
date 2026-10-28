const RAD = Math.PI / 180;

function dayOfYear(year: number, month: number, day: number): number {
  const start = Date.UTC(year, 0, 1);
  const current = Date.UTC(year, month - 1, day);
  return Math.floor((current - start) / 86_400_000) + 1;
}

export interface SunTimes {
  sunrise: string | null;
  sunset: string | null;
}

/**
 * NOAA approximation of sunrise and sunset (UTC ISO). Accurate to a minute or
 * two for temperate latitudes; returns null inside polar day or polar night.
 */
export function sunTimes(dateKey: string, lat: number, lon: number): SunTimes {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return { sunrise: null, sunset: null };

  const n = dayOfYear(year, month, day);
  const gamma = ((2 * Math.PI) / 365) * (n - 1);

  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const latRad = Math.max(-89.9, Math.min(89.9, lat)) * RAD;
  const cosHa =
    Math.cos(90.833 * RAD) / (Math.cos(latRad) * Math.cos(decl)) -
    Math.tan(latRad) * Math.tan(decl);

  if (cosHa > 1 || cosHa < -1) return { sunrise: null, sunset: null };

  const ha = Math.acos(cosHa) / RAD;
  const midnight = Date.UTC(year, month - 1, day, 0, 0, 0);
  const sunriseMinutes = 720 - 4 * (lon + ha) - eqTime;
  const sunsetMinutes = 720 - 4 * (lon - ha) - eqTime;

  const toIso = (minutes: number) =>
    new Date(midnight + Math.round(minutes) * 60_000).toISOString();

  return { sunrise: toIso(sunriseMinutes), sunset: toIso(sunsetMinutes) };
}

export function isDaytime(iso: string, lat: number, lon: number, dateKey: string): boolean {
  const { sunrise, sunset } = sunTimes(dateKey, lat, lon);
  if (!sunrise || !sunset) {
    const hour = new Date(iso).getUTCHours();
    return hour >= 6 && hour < 18;
  }
  const time = new Date(iso).getTime();
  return time >= new Date(sunrise).getTime() && time <= new Date(sunset).getTime();
}
