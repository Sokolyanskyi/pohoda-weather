export type WeatherKind =
  | "clear"
  | "partly"
  | "cloudy"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "heavy-rain"
  | "snow"
  | "sleet"
  | "thunder"
  | "hail";

export type ProviderId =
  | "open-meteo"
  | "open-meteo-ecmwf"
  | "open-meteo-icon"
  | "open-meteo-gfs"
  | "open-meteo-meteofrance"
  | "open-meteo-ukmo"
  | "open-meteo-jma"
  | "open-meteo-gem"
  | "open-meteo-knmi"
  | "met-no";

export type TabId = "today" | "week" | "month";

export type MotionLevel = "full" | "calm" | "off";

export type TemperatureUnit = "c" | "f";
export type WindUnit = "kmh" | "ms" | "mph";
export type PressureUnit = "hpa" | "mmhg" | "inhg";
export type PrecipUnit = "mm" | "in";

export interface Place {
  /** Stable id: geonames id, "geo:lat,lon" or "tz:<area/city>". */
  id: string;
  name: string;
  admin1?: string;
  country?: string;
  countryCode?: string;
  lat: number;
  lon: number;
  timezone?: string;
}

export interface CurrentWeather {
  /** UTC ISO string. */
  time: string;
  temperature: number;
  feelsLike: number | null;
  kind: WeatherKind;
  isDay: boolean;
  humidity: number | null;
  pressure: number | null;
  windSpeed: number | null;
  windGust: number | null;
  windDirection: number | null;
  cloudCover: number | null;
  precipitation: number | null;
  visibility: number | null;
  uvIndex: number | null;
  dewPoint: number | null;
}

export interface HourlyPoint {
  /** UTC ISO string. */
  time: string;
  temperature: number;
  feelsLike: number | null;
  kind: WeatherKind;
  isDay: boolean;
  precipitation: number;
  precipitationProbability: number | null;
  windSpeed: number | null;
  humidity: number | null;
  uvIndex: number | null;
  visibility: number | null;
}

export interface DailyPoint {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  kind: WeatherKind;
  max: number;
  min: number;
  feelsMax: number | null;
  feelsMin: number | null;
  precipitation: number;
  precipitationProbability: number | null;
  windMax: number | null;
  windGustMax: number | null;
  windDirection: number | null;
  uvMax: number | null;
  humidityMean: number | null;
  sunrise: string | null;
  sunset: string | null;
  /** Forecast data or a 10-year climate average. */
  source: "forecast" | "climate";
}

export interface WeatherSnapshot {
  place: Place;
  provider: ProviderId;
  fetchedAt: string;
  timezone: string;
  utcOffsetSeconds: number;
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  /** Days beyond the provider range filled from climate averages. */
  climateDays: number;
  /** Forecast days returned by the provider itself. */
  forecastDays: number;
  notes: string[];
}

export interface Prefs {
  locale: string;
  theme: string;
  iconPack: string;
  provider: ProviderId;
  place: Place;
  places: Place[];
  temperature: TemperatureUnit;
  wind: WindUnit;
  pressure: PressureUnit;
  precipitation: PrecipUnit;
  motion: MotionLevel;
  keys: Partial<Record<ProviderId, string>>;
}

export type WeatherErrorCode =
  | "key_required"
  | "key_invalid"
  | "provider_error"
  | "invalid_request"
  | "timeout"
  | "rate_limit"
  | "network"
  | "unknown";
