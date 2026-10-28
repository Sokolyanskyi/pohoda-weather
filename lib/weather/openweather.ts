import type {
  CurrentWeather,
  DailyPoint,
  HourlyPoint,
  Place,
  WeatherSnapshot,
} from "@/lib/types";
import { kindFromOwm, kindFromText } from "@/lib/weather/kind";
import {
  clampDaily,
  dewPoint,
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

interface OwmWeather {
  id?: number;
  main?: string;
  description?: string;
}

interface OwmCurrent {
  dt?: number;
  main?: {
    temp?: number;
    feels_like?: number;
    humidity?: number;
    pressure?: number;
    dew_point?: number;
  };
  weather?: OwmWeather[];
  wind?: { speed?: number; deg?: number; gust?: number };
  clouds?: { all?: number };
  visibility?: number;
  rain?: Partial<Record<"1h" | "3h", number>>;
  snow?: Partial<Record<"1h" | "3h", number>>;
}

interface OwmForecastItem {
  dt?: number;
  main?: {
    temp?: number;
    feels_like?: number;
    temp_min?: number;
    temp_max?: number;
    humidity?: number;
  };
  weather?: OwmWeather[];
  wind?: { speed?: number; deg?: number; gust?: number };
  clouds?: { all?: number };
  pop?: number;
  rain?: Partial<Record<"1h" | "3h", number>>;
  snow?: Partial<Record<"1h" | "3h", number>>;
  sys?: { pod?: string };
}

export interface OwmForecastResponse {
  list?: OwmForecastItem[];
}

export interface OwmRequest {
  place: Place;
  timezone: string;
  days: number;
  current: OwmCurrent;
  forecast: OwmForecastResponse;
}

export function buildOwmUrls(place: Place, key: string): { current: string; forecast: string } {
  const base = {
    lat: String(place.lat),
    lon: String(place.lon),
    units: "metric",
    appid: key,
  };
  const current = new URLSearchParams(base);
  const forecast = new URLSearchParams(base);
  return {
    current: `https://api.openweathermap.org/data/2.5/weather?${current.toString()}`,
    forecast: `https://api.openweathermap.org/data/2.5/forecast?${forecast.toString()}`,
  };
}

function precipitationOf(item: OwmForecastItem | OwmCurrent): number {
  return (item.rain?.["3h"] ?? item.rain?.["1h"] ?? 0) + (item.snow?.["3h"] ?? item.snow?.["1h"] ?? 0);
}

export function normalizeOwm({
  place,
  timezone,
  days,
  current: currentRaw,
  forecast,
}: OwmRequest): WeatherSnapshot {
  const now = Date.now();
  const currentTime = currentRaw.dt ? new Date(currentRaw.dt * 1000) : new Date(now);
  const currentDate = dateKeyInTz(currentTime, timezone);
  const currentSun = sunTimes(currentDate, place.lat, place.lon);
  const currentTemp = num(currentRaw.main?.temp);
  const currentHumidity = num(currentRaw.main?.humidity);
  const currentWindMs = num(currentRaw.wind?.speed);

  const current: CurrentWeather = {
    time: currentTime.toISOString(),
    temperature: currentTemp ?? 0,
    feelsLike:
      num(currentRaw.main?.feels_like) ??
      feelsLike(currentTemp, currentHumidity, currentWindMs === null ? null : currentWindMs * 3.6),
    kind: currentRaw.weather?.[0]?.id
      ? kindFromOwm(currentRaw.weather[0].id)
      : kindFromText(currentRaw.weather?.[0]?.main),
    isDay:
      now >= new Date(currentSun.sunrise ?? 0).getTime() &&
      now <= new Date(currentSun.sunset ?? 0).getTime(),
    humidity: currentHumidity,
    pressure: num(currentRaw.main?.pressure),
    windSpeed: currentWindMs === null ? null : round1(currentWindMs * 3.6),
    windGust:
      typeof currentRaw.wind?.gust === "number"
        ? round1(currentRaw.wind.gust * 3.6)
        : null,
    windDirection: num(currentRaw.wind?.deg),
    cloudCover: num(currentRaw.clouds?.all),
    precipitation: round1(precipitationOf(currentRaw)),
    visibility: num(currentRaw.visibility),
    uvIndex: null,
    dewPoint:
      num(currentRaw.main?.dew_point) ?? dewPoint(currentTemp, currentHumidity),
  };

  const items = (forecast.list ?? [])
    .filter((item) => item.dt && num(item.main?.temp) !== null)
    .sort((a, b) => (a.dt ?? 0) - (b.dt ?? 0));

  const hourly: HourlyPoint[] = items.slice(0, 16).map((item) => {
    const date = new Date((item.dt as number) * 1000);
    const temperature = num(item.main?.temp) ?? 0;
    const humidity = num(item.main?.humidity);
    const wind = num(item.wind?.speed);
    return {
      time: date.toISOString(),
      temperature: round1(temperature),
      feelsLike:
        num(item.main?.feels_like) ??
        feelsLike(temperature, humidity, wind === null ? null : wind * 3.6),
      kind: item.weather?.[0]?.id
        ? kindFromOwm(item.weather[0].id)
        : kindFromText(item.weather?.[0]?.main),
      isDay: item.sys?.pod ? item.sys.pod === "d" : true,
      precipitation: round1((item.rain?.["3h"] ?? 0) + (item.snow?.["3h"] ?? 0)),
      precipitationProbability:
        typeof item.pop === "number" ? Math.round(item.pop * 100) : null,
      windSpeed: wind === null ? null : round1(wind * 3.6),
      humidity,
      uvIndex: null,
      visibility: null,
    };
  });

  const byDate = new Map<string, OwmForecastItem[]>();
  for (const item of items) {
    const date = dateKeyInTz(new Date((item.dt as number) * 1000), timezone);
    const list = byDate.get(date) ?? [];
    list.push(item);
    byDate.set(date, list);
  }

  const daily: DailyPoint[] = [];
  for (const [date, list] of byDate) {
    let max = maxOf(list.map((item) => num(item.main?.temp_max) ?? num(item.main?.temp)));
    let min = minOf(list.map((item) => num(item.main?.temp_min) ?? num(item.main?.temp)));
    if (date === currentDate && currentTemp !== null) {
      max = max === null ? currentTemp : Math.max(max, currentTemp);
      min = min === null ? currentTemp : Math.min(min, currentTemp);
    }
    if (max === null || min === null) continue;
    const midday = list.filter((item) => {
      const hour = hourInTz(new Date((item.dt as number) * 1000), timezone);
      return hour >= 11 && hour <= 15;
    });
    const kind = midday.length
      ? kindFromOwm(midday[Math.floor(midday.length / 2)].weather?.[0]?.id)
      : dominantKind(
          list.map((item) =>
            item.weather?.[0]?.id
              ? kindFromOwm(item.weather[0].id)
              : kindFromText(item.weather?.[0]?.main),
          ),
        );
    const sun = sunTimes(date, place.lat, place.lon);
    daily.push({
      date,
      kind,
      max: round1(max),
      min: round1(min),
      feelsMax: maxOf(list.map((item) => num(item.main?.feels_like))),
      feelsMin: minOf(list.map((item) => num(item.main?.feels_like))),
      precipitation: round1(
        list.reduce(
          (sum, item) => sum + (item.rain?.["3h"] ?? 0) + (item.snow?.["3h"] ?? 0),
          0,
        ),
      ),
      precipitationProbability: maxOf(list.map((item) => (item.pop ?? 0) * 100)),
      windMax: maxOf(list.map((item) => {
        const speed = num(item.wind?.speed);
        return speed === null ? null : speed * 3.6;
      })),
      windGustMax: maxOf(list.map((item) => {
        const speed = num(item.wind?.gust);
        return speed === null ? null : speed * 3.6;
      })),
      windDirection: mean(list.map((item) => num(item.wind?.deg))),
      uvMax: null,
      humidityMean: mean(list.map((item) => num(item.main?.humidity))),
      sunrise: sun.sunrise,
      sunset: sun.sunset,
      source: "forecast",
    });
  }

  const today = dateKeyInTz(new Date(now), timezone);
  const upcoming = daily
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((day) => day.date >= today);

  return {
    place: { ...place, timezone },
    provider: "openweathermap",
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
