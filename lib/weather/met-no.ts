import type {
  CurrentWeather,
  DailyPoint,
  HourlyPoint,
  Place,
  WeatherSnapshot,
} from "@/lib/types";
import { kindFromMetSymbol, isNightSymbol } from "@/lib/weather/kind";
import {
  clampDaily,
  dominantKind,
  feelsLike,
  maxOf,
  mean,
  minOf,
  num,
  round1,
} from "@/lib/weather/shared";
import { sunTimes } from "@/lib/weather/sun";
import { dateKeyInTz, hourInTz, tzOffsetMs } from "@/lib/time";

interface MetDetails {
  air_temperature?: number;
  relative_humidity?: number;
  air_pressure_at_sea_level?: number;
  wind_speed?: number;
  wind_from_direction?: number;
  wind_speed_of_gust?: number;
  cloud_area_fraction?: number;
  dew_point_temperature?: number;
}

interface MetPeriod {
  summary?: { symbol_code?: string };
  details?: { precipitation_amount?: number };
}

interface MetEntry {
  time?: string;
  data?: {
    instant?: { details?: MetDetails };
    next_1_hours?: MetPeriod;
    next_6_hours?: MetPeriod;
    next_12_hours?: MetPeriod;
  };
}

export interface MetNoResponse {
  properties?: { timeseries?: MetEntry[] };
}

export interface MetNoRequest {
  place: Place;
  timezone: string;
  days: number;
  payload: MetNoResponse;
}

export function buildMetNoUrl(place: Place): string {
  const params = new URLSearchParams({
    lat: String(place.lat),
    lon: String(place.lon),
  });
  return `https://api.met.no/weatherapi/locationforecast/2.0/compact?${params.toString()}`;
}

function symbolOf(entry: MetEntry): string | undefined {
  return (
    entry.data?.next_1_hours?.summary?.symbol_code ??
    entry.data?.next_6_hours?.summary?.symbol_code ??
    entry.data?.next_12_hours?.summary?.symbol_code
  );
}

function precipitationOf(entry: MetEntry): number {
  const oneHour = entry.data?.next_1_hours?.details?.precipitation_amount;
  if (typeof oneHour === "number") return oneHour;
  const sixHours = entry.data?.next_6_hours?.details?.precipitation_amount;
  if (typeof sixHours === "number") return sixHours / 6;
  return 0;
}

function precipitationForDay(entry: MetEntry): number {
  const oneHour = entry.data?.next_1_hours?.details?.precipitation_amount;
  if (typeof oneHour === "number") return oneHour;
  const sixHours = entry.data?.next_6_hours?.details?.precipitation_amount;
  if (typeof sixHours === "number") return sixHours;
  return 0;
}

export function normalizeMetNo({
  place,
  timezone,
  days,
  payload,
}: MetNoRequest): WeatherSnapshot {
  const now = Date.now();
  const entries = (payload.properties?.timeseries ?? [])
    .filter((entry) => entry.time && entry.data?.instant?.details)
    .map((entry) => ({
      time: new Date(entry.time as string).getTime(),
      iso: new Date(entry.time as string).toISOString(),
      details: entry.data?.instant?.details ?? {},
      symbol: symbolOf(entry),
      precipitation: precipitationOf(entry),
      precipitationDay: precipitationForDay(entry),
      entry,
    }))
    .filter((entry) => Number.isFinite(entry.time))
    .sort((a, b) => a.time - b.time);

  if (entries.length === 0) {
    throw new Error("MET Norway returned no data");
  }

  const sample = (timestamp: number) => {
    let found = entries[0];
    for (const entry of entries) {
      if (entry.time <= timestamp) found = entry;
      else break;
    }
    return found;
  };

  const currentEntry = sample(now);
  const currentDate = dateKeyInTz(new Date(currentEntry.iso), timezone);
  const currentSun = sunTimes(currentDate, place.lat, place.lon);
  const currentIsDay = currentEntry.symbol
    ? !isNightSymbol(currentEntry.symbol)
    : now >= new Date(currentSun.sunrise ?? 0).getTime() &&
      now <= new Date(currentSun.sunset ?? 0).getTime();

  const currentDetails = currentEntry.details;
  const currentTemp = num(currentDetails.air_temperature);
  const currentWind = num(currentDetails.wind_speed);
  const currentHumidity = num(currentDetails.relative_humidity);
  const current: CurrentWeather = {
    time: currentEntry.iso,
    temperature: currentTemp ?? 0,
    feelsLike:
      typeof currentDetails.air_temperature === "number"
        ? feelsLike(currentTemp, currentHumidity, currentWind === null ? null : currentWind * 3.6)
        : null,
    kind: kindFromMetSymbol(currentEntry.symbol),
    isDay: currentIsDay,
    humidity: currentHumidity,
    pressure: num(currentDetails.air_pressure_at_sea_level),
    windSpeed: currentWind === null ? null : round1(currentWind * 3.6),
    windGust:
      typeof currentDetails.wind_speed_of_gust === "number"
        ? round1(currentDetails.wind_speed_of_gust * 3.6)
        : null,
    windDirection: num(currentDetails.wind_from_direction),
    cloudCover: num(currentDetails.cloud_area_fraction),
    precipitation: currentEntry.precipitation,
    visibility: null,
    uvIndex: null,
    dewPoint: num(currentDetails.dew_point_temperature),
  };

  const hourly: HourlyPoint[] = [];
  const start = Math.ceil(now / 3_600_000) * 3_600_000;
  for (let hour = 0; hour < 48; hour += 1) {
    const timestamp = start + hour * 3_600_000;
    const entry = sample(timestamp);
    const details = entry.details;
    const temperature = num(details.air_temperature);
    if (temperature === null) continue;
    const wind = num(details.wind_speed);
    const humidity = num(details.relative_humidity);
    const date = dateKeyInTz(new Date(timestamp), timezone);
    const sun = sunTimes(date, place.lat, place.lon);
    const isDay = entry.symbol
      ? !isNightSymbol(entry.symbol)
      : timestamp >= new Date(sun.sunrise ?? 0).getTime() &&
        timestamp <= new Date(sun.sunset ?? 0).getTime();
    hourly.push({
      time: new Date(timestamp).toISOString(),
      temperature: round1(temperature),
      feelsLike: feelsLike(temperature, humidity, wind === null ? null : wind * 3.6),
      kind: kindFromMetSymbol(entry.symbol),
      isDay,
      precipitation: Math.max(0, entry.precipitation),
      precipitationProbability: null,
      windSpeed: wind === null ? null : round1(wind * 3.6),
      humidity,
      uvIndex: null,
      visibility: null,
    });
  }

  const byDate = new Map<string, typeof entries>();
  for (const entry of entries) {
    const date = dateKeyInTz(new Date(entry.iso), timezone);
    const list = byDate.get(date) ?? [];
    list.push(entry);
    byDate.set(date, list);
  }

  const daily: DailyPoint[] = [];
  for (const [date, list] of byDate) {
    const temps = list.map((entry) => num(entry.details.air_temperature));
    const max = maxOf(temps);
    const min = minOf(temps);
    if (max === null || min === null) continue;
    const midday = list.filter((entry) => {
      const hour = hourInTz(new Date(entry.iso), timezone);
      return hour >= 11 && hour <= 15;
    });
    const kind = midday.length
      ? kindFromMetSymbol(midday[Math.floor(midday.length / 2)].symbol)
      : dominantKind(list.map((entry) => kindFromMetSymbol(entry.symbol)));
    const sun = sunTimes(date, place.lat, place.lon);
    daily.push({
      date,
      kind,
      max: round1(max),
      min: round1(min),
      feelsMax: null,
      feelsMin: null,
      precipitation: round1(
        list.reduce((sum, entry) => sum + Math.max(0, entry.precipitationDay), 0),
      ),
      precipitationProbability: null,
      windMax: maxOf(list.map((entry) => {
        const speed = num(entry.details.wind_speed);
        return speed === null ? null : speed * 3.6;
      })),
      windGustMax: maxOf(list.map((entry) => {
        const speed = num(entry.details.wind_speed_of_gust);
        return speed === null ? null : speed * 3.6;
      })),
      windDirection: mean(list.map((entry) => num(entry.details.wind_from_direction))),
      uvMax: null,
      humidityMean: mean(list.map((entry) => num(entry.details.relative_humidity))),
      sunrise: sun.sunrise,
      sunset: sun.sunset,
      source: "forecast",
    });
  }

  const sorted = daily.sort((a, b) => a.date.localeCompare(b.date));
  const today = dateKeyInTz(new Date(now), timezone);
  const upcoming = sorted.filter((day) => day.date >= today);

  return {
    place: { ...place, timezone },
    provider: "met-no",
    fetchedAt: new Date().toISOString(),
    timezone,
    utcOffsetSeconds: Math.round(tzOffsetMs(timezone, new Date()) / 1000),
    current,
    hourly,
    daily: clampDaily(upcoming, days),
    climateDays: 0,
    forecastDays: upcoming.length,
    notes: [],
  };
}
