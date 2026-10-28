import type {
  CurrentWeather,
  DailyPoint,
  HourlyPoint,
  Place,
  WeatherSnapshot,
} from "@/lib/types";
import { kindFromText, kindFromVisualCrossing } from "@/lib/weather/kind";
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
import { dateKeyInTz, localToUtcIso, tzOffsetMs } from "@/lib/time";

interface VcHour {
  datetime?: string;
  temp?: number;
  feelslike?: number;
  humidity?: number;
  precip?: number;
  precipprob?: number;
  windspeed?: number;
  windgust?: number;
  winddir?: number;
  visibility?: number;
  cloudcover?: number;
  uvindex?: number;
  conditions?: string;
  icon?: string;
}

interface VcDay extends VcHour {
  tempmax?: number;
  tempmin?: number;
  feelslikemax?: number;
  feelslikemin?: number;
  sunrise?: string;
  sunset?: string;
  hours?: VcHour[];
}

interface VcCurrent extends VcHour {
  pressure?: number;
  dew?: number;
}

export interface VcResponse {
  timezone?: string;
  currentConditions?: VcCurrent;
  days?: VcDay[];
}

export interface VcRequest {
  place: Place;
  days: number;
  payload: VcResponse;
}

export function buildVcUrl(place: Place, key: string): string {
  const params = new URLSearchParams({
    unitGroup: "metric",
    include: "current,hours,days",
    key,
    contentType: "json",
    lang: "en",
  });
  return `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${place.lat},${place.lon}?${params.toString()}`;
}

export function normalizeVc({ place, days, payload }: VcRequest): WeatherSnapshot {
  const timezone = payload.timezone || place.timezone || "UTC";
  const daysRaw = payload.days ?? [];
  const firstDate = daysRaw[0]?.datetime ?? dateKeyInTz(new Date(), timezone);
  const currentRaw = payload.currentConditions ?? {};
  const currentLocal = currentRaw.datetime
    ? `${firstDate}T${currentRaw.datetime}`
    : `${firstDate}T12:00:00`;
  const currentIso = localToUtcIso(currentLocal, timezone);
  const currentDate = dateKeyInTz(new Date(currentIso), timezone);
  const currentSun = sunTimes(currentDate, place.lat, place.lon);

  const current: CurrentWeather = {
    time: currentIso,
    temperature: num(currentRaw.temp) ?? 0,
    feelsLike:
      num(currentRaw.feelslike) ??
      feelsLike(
        num(currentRaw.temp),
        num(currentRaw.humidity),
        num(currentRaw.windspeed),
      ),
    kind: currentRaw.icon
      ? kindFromVisualCrossing(currentRaw.icon)
      : kindFromText(currentRaw.conditions),
    isDay: currentRaw.icon ? !currentRaw.icon.includes("night") : true,
    humidity: num(currentRaw.humidity),
    pressure: num(currentRaw.pressure),
    windSpeed: num(currentRaw.windspeed),
    windGust: num(currentRaw.windgust),
    windDirection: num(currentRaw.winddir),
    cloudCover: num(currentRaw.cloudcover),
    precipitation: num(currentRaw.precip) ?? 0,
    visibility:
      typeof currentRaw.visibility === "number" ? currentRaw.visibility * 1000 : null,
    uvIndex: num(currentRaw.uvindex),
    dewPoint:
      num(currentRaw.dew) ?? null,
  };

  const hourly: HourlyPoint[] = [];
  for (const day of daysRaw.slice(0, 3)) {
    for (const hour of day.hours ?? []) {
      if (!hour.datetime) continue;
      const iso = localToUtcIso(`${day.datetime}T${hour.datetime}`, timezone);
      const temperature = num(hour.temp);
      if (temperature === null) continue;
      const sun = sunTimes(day.datetime ?? currentDate, place.lat, place.lon);
      const timestamp = new Date(iso).getTime();
      const isDay = hour.icon
        ? !hour.icon.includes("night")
        : timestamp >= new Date(sun.sunrise ?? 0).getTime() &&
          timestamp <= new Date(sun.sunset ?? 0).getTime();
      hourly.push({
        time: iso,
        temperature: round1(temperature),
        feelsLike: num(hour.feelslike),
        kind: hour.icon
          ? kindFromVisualCrossing(hour.icon)
          : kindFromText(hour.conditions),
        isDay,
        precipitation: num(hour.precip) ?? 0,
        precipitationProbability: num(hour.precipprob),
        windSpeed: num(hour.windspeed),
        humidity: num(hour.humidity),
        uvIndex: num(hour.uvindex),
        visibility:
          typeof hour.visibility === "number" ? hour.visibility * 1000 : null,
      });
    }
  }

  const daily: DailyPoint[] = [];
  for (const day of daysRaw) {
    if (!day.datetime) continue;
    const max = num(day.tempmax);
    const min = num(day.tempmin);
    if (max === null || min === null) continue;
    const sun =
      day.sunrise && day.sunset
        ? {
            sunrise: localToUtcIso(`${day.datetime}T${day.sunrise}`, timezone),
            sunset: localToUtcIso(`${day.datetime}T${day.sunset}`, timezone),
          }
        : sunTimes(day.datetime, place.lat, place.lon);
    const noon = (day.hours ?? []).filter((hour) => {
      const value = Number(hour.datetime?.slice(0, 2));
      return value >= 11 && value <= 15;
    });
    const kind = day.icon
      ? kindFromVisualCrossing(day.icon)
      : noon.length
        ? kindFromText(noon[Math.floor(noon.length / 2)].conditions)
        : dominantKind((day.hours ?? []).map((hour) => kindFromText(hour.conditions)));
    daily.push({
      date: day.datetime,
      kind,
      max: round1(max),
      min: round1(min),
      feelsMax: num(day.feelslikemax),
      feelsMin: num(day.feelslikemin),
      precipitation: num(day.precip) ?? 0,
      precipitationProbability: num(day.precipprob),
      windMax: num(day.windspeed),
      windGustMax: num(day.windgust),
      windDirection: num(day.winddir),
      uvMax: num(day.uvindex),
      humidityMean: mean((day.hours ?? []).map((hour) => num(hour.humidity))),
      sunrise: sun.sunrise,
      sunset: sun.sunset,
      source: "forecast",
    });
  }

  const sorted = daily.sort((a, b) => a.date.localeCompare(b.date));
  const today = dateKeyInTz(new Date(), timezone);
  const upcoming = sorted.filter((day) => day.date >= today);

  return {
    place: { ...place, timezone },
    provider: "visual-crossing",
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
