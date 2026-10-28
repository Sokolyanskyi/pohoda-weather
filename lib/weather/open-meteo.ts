import type {
  DailyPoint,
  HourlyPoint,
  Place,
  ProviderId,
  WeatherSnapshot,
} from "@/lib/types";
import { kindFromWmo } from "@/lib/weather/kind";
import { clampDaily, dewPoint, num, round1 } from "@/lib/weather/shared";
import { localToUtcIso } from "@/lib/time";

interface OpenMeteoCurrent {
  time?: string;
  temperature_2m?: number;
  relative_humidity_2m?: number;
  apparent_temperature?: number;
  is_day?: number;
  precipitation?: number;
  weather_code?: number;
  cloud_cover?: number;
  pressure_msl?: number;
  wind_speed_10m?: number;
  wind_direction_10m?: number;
  wind_gusts_10m?: number;
}

interface OpenMeteoHourly {
  time?: string[];
  temperature_2m?: Array<number | null>;
  apparent_temperature?: Array<number | null>;
  relative_humidity_2m?: Array<number | null>;
  precipitation_probability?: Array<number | null>;
  precipitation?: Array<number | null>;
  weather_code?: Array<number | null>;
  wind_speed_10m?: Array<number | null>;
  is_day?: Array<number | null>;
  uv_index?: Array<number | null>;
  visibility?: Array<number | null>;
}

interface OpenMeteoDaily {
  time?: string[];
  weather_code?: Array<number | null>;
  temperature_2m_max?: Array<number | null>;
  temperature_2m_min?: Array<number | null>;
  apparent_temperature_max?: Array<number | null>;
  apparent_temperature_min?: Array<number | null>;
  sunrise?: string[];
  sunset?: string[];
  uv_index_max?: Array<number | null>;
  precipitation_sum?: Array<number | null>;
  precipitation_probability_max?: Array<number | null>;
  wind_speed_10m_max?: Array<number | null>;
  wind_gusts_10m_max?: Array<number | null>;
  wind_direction_10m_dominant?: Array<number | null>;
}

export interface OpenMeteoResponse {
  timezone?: string;
  utc_offset_seconds?: number;
  current?: OpenMeteoCurrent;
  hourly?: OpenMeteoHourly;
  daily?: OpenMeteoDaily;
}

export interface OpenMeteoRequest {
  place: Place;
  provider: ProviderId;
  days: number;
  payload: OpenMeteoResponse;
}

export function buildOpenMeteoUrl(place: Place, provider: ProviderId, days: number): string {
  const params = new URLSearchParams({
    latitude: String(place.lat),
    longitude: String(place.lon),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "cloud_cover",
      "pressure_msl",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
    ].join(","),
    hourly: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "precipitation_probability",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "is_day",
      "uv_index",
      "visibility",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "apparent_temperature_max",
      "apparent_temperature_min",
      "sunrise",
      "sunset",
      "uv_index_max",
      "precipitation_sum",
      "precipitation_probability_max",
      "wind_speed_10m_max",
      "wind_gusts_10m_max",
      "wind_direction_10m_dominant",
    ].join(","),
    timezone: "auto",
    forecast_days: String(Math.min(16, Math.max(1, Math.ceil(days)))),
  });

  const model =
    provider === "open-meteo-ecmwf"
      ? "ecmwf_ifs025"
      : provider === "open-meteo-icon"
        ? "icon_seamless"
        : provider === "open-meteo-gfs"
          ? "gfs_seamless"
          : null;
  if (model) params.set("models", model);

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

export function normalizeOpenMeteo({
  place,
  provider,
  days,
  payload,
}: OpenMeteoRequest): WeatherSnapshot {
  const timezone = payload.timezone || place.timezone || "UTC";
  const offset = payload.utc_offset_seconds ?? 0;
  const currentRaw = payload.current ?? {};
  const nowLocal = currentRaw.time ?? "";
  const nowIso = nowLocal ? localToUtcIso(nowLocal, timezone) : new Date().toISOString();

  const hourlyTimes = payload.hourly?.time ?? [];
  const firstHour = Math.max(0, hourlyTimes.findIndex((time) => time >= (nowLocal ? nowLocal.slice(0, 13) : "")));
  const startIndex = firstHour >= 0 ? firstHour : 0;

  const hourly: HourlyPoint[] = [];
  for (let index = startIndex; index < hourlyTimes.length && hourly.length < 48; index += 1) {
    const temperature = num(payload.hourly?.temperature_2m?.[index]);
    const code = payload.hourly?.weather_code?.[index];
    if (temperature === null || code === null || code === undefined) continue;
    hourly.push({
      time: localToUtcIso(hourlyTimes[index], timezone),
      temperature,
      feelsLike: num(payload.hourly?.apparent_temperature?.[index]),
      kind: kindFromWmo(code),
      isDay: payload.hourly?.is_day?.[index] === 1,
      precipitation: num(payload.hourly?.precipitation?.[index]) ?? 0,
      precipitationProbability: num(payload.hourly?.precipitation_probability?.[index]),
      windSpeed: num(payload.hourly?.wind_speed_10m?.[index]),
      humidity: num(payload.hourly?.relative_humidity_2m?.[index]),
      uvIndex: num(payload.hourly?.uv_index?.[index]),
      visibility: num(payload.hourly?.visibility?.[index]),
    });
  }

  const currentHourIndex = hourlyTimes.findIndex(
    (time) => time === nowLocal.slice(0, 13) || time.slice(0, 13) === nowLocal.slice(0, 13),
  );
  const currentUv =
    currentHourIndex >= 0 ? num(payload.hourly?.uv_index?.[currentHourIndex]) : null;
  const currentVisibility =
    currentHourIndex >= 0 ? num(payload.hourly?.visibility?.[currentHourIndex]) : null;

  const temperature = num(currentRaw.temperature_2m) ?? hourly[0]?.temperature ?? 0;
  const humidity = num(currentRaw.relative_humidity_2m);

  const daily: DailyPoint[] = [];
  const dailyDates = payload.daily?.time ?? [];
  for (let index = 0; index < dailyDates.length && daily.length < days; index += 1) {
    const max = num(payload.daily?.temperature_2m_max?.[index]);
    const min = num(payload.daily?.temperature_2m_min?.[index]);
    if (max === null || min === null) continue;
    const sunriseLocal = payload.daily?.sunrise?.[index];
    const sunsetLocal = payload.daily?.sunset?.[index];
    daily.push({
      date: dailyDates[index],
      kind: kindFromWmo(payload.daily?.weather_code?.[index] ?? null),
      max: round1(max),
      min: round1(min),
      feelsMax: num(payload.daily?.apparent_temperature_max?.[index]),
      feelsMin: num(payload.daily?.apparent_temperature_min?.[index]),
      precipitation: num(payload.daily?.precipitation_sum?.[index]) ?? 0,
      precipitationProbability: num(payload.daily?.precipitation_probability_max?.[index]),
      windMax: num(payload.daily?.wind_speed_10m_max?.[index]),
      windGustMax: num(payload.daily?.wind_gusts_10m_max?.[index]),
      windDirection: num(payload.daily?.wind_direction_10m_dominant?.[index]),
      uvMax: num(payload.daily?.uv_index_max?.[index]),
      humidityMean: null,
      sunrise: sunriseLocal ? localToUtcIso(sunriseLocal, timezone) : null,
      sunset: sunsetLocal ? localToUtcIso(sunsetLocal, timezone) : null,
      source: "forecast",
    });
  }

  const current = {
    time: nowIso,
    temperature: round1(temperature),
    feelsLike: num(currentRaw.apparent_temperature),
    kind: kindFromWmo(currentRaw.weather_code ?? null),
    isDay: currentRaw.is_day === 1,
    humidity,
    pressure: num(currentRaw.pressure_msl),
    windSpeed: num(currentRaw.wind_speed_10m),
    windGust: num(currentRaw.wind_gusts_10m),
    windDirection: num(currentRaw.wind_direction_10m),
    cloudCover: num(currentRaw.cloud_cover),
    precipitation: num(currentRaw.precipitation),
    visibility: currentVisibility,
    uvIndex: currentUv,
    dewPoint: dewPoint(temperature, humidity),
  };

  return {
    place: { ...place, timezone },
    provider,
    fetchedAt: new Date().toISOString(),
    timezone,
    utcOffsetSeconds: offset,
    current,
    hourly,
    daily: clampDaily(daily, days),
    climateDays: 0,
    forecastDays: daily.length,
    notes: [],
  };
}
