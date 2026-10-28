import type { MessageKey } from "@/lib/i18n";
import type { ProviderId } from "@/lib/types";

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  model: string;
  /** Maximum forecast days the provider returns. */
  days: number;
  keyless: boolean;
  keyEnv?: string;
  keyUrl?: string;
  descriptionKey: MessageKey;
}

export const PROVIDERS: readonly ProviderMeta[] = [
  {
    id: "open-meteo",
    name: "Open-Meteo",
    model: "Best match",
    days: 16,
    keyless: true,
    descriptionKey: "provider.open-meteo.desc",
  },
  {
    id: "open-meteo-ecmwf",
    name: "Open-Meteo",
    model: "ECMWF IFS",
    days: 16,
    keyless: true,
    descriptionKey: "provider.open-meteo-ecmwf.desc",
  },
  {
    id: "open-meteo-icon",
    name: "Open-Meteo",
    model: "DWD ICON",
    days: 16,
    keyless: true,
    descriptionKey: "provider.open-meteo-icon.desc",
  },
  {
    id: "open-meteo-gfs",
    name: "Open-Meteo",
    model: "NOAA GFS",
    days: 16,
    keyless: true,
    descriptionKey: "provider.open-meteo-gfs.desc",
  },
  {
    id: "met-no",
    name: "MET Norway",
    model: "Locationforecast 2.0",
    days: 10,
    keyless: true,
    descriptionKey: "provider.met-no.desc",
  },
  {
    id: "openweathermap",
    name: "OpenWeatherMap",
    model: "5-day / 3-hour",
    days: 5,
    keyless: false,
    keyEnv: "OPENWEATHER_API_KEY",
    keyUrl: "https://openweathermap.org/api",
    descriptionKey: "provider.openweathermap.desc",
  },
  {
    id: "visual-crossing",
    name: "Visual Crossing",
    model: "Timeline",
    days: 15,
    keyless: false,
    keyEnv: "VISUAL_CROSSING_API_KEY",
    keyUrl: "https://www.visualcrossing.com/weather-api",
    descriptionKey: "provider.visual-crossing.desc",
  },
];

export const PROVIDER_MAP: Record<ProviderId, ProviderMeta> = Object.fromEntries(
  PROVIDERS.map((provider) => [provider.id, provider]),
) as Record<ProviderId, ProviderMeta>;

export const DEFAULT_PROVIDER: ProviderId = "open-meteo";

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === "string" && value in PROVIDER_MAP;
}

export function providerLabel(provider: ProviderId): string {
  const meta = PROVIDER_MAP[provider];
  return `${meta.name} · ${meta.model}`;
}
