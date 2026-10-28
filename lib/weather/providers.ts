import type { MessageKey } from "@/lib/i18n";
import type { ProviderId } from "@/lib/types";

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  model: string;
  /** Maximum forecast days the provider returns. */
  days: number;
  /** Every provider here is free and keyless. */
  keyless: boolean;
  descriptionKey: MessageKey;
}

/**
 * All providers are free and need no API key: Open-Meteo model runs and MET
 * Norway. Paid services with keys were removed on purpose.
 */
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
    id: "open-meteo-meteofrance",
    name: "Open-Meteo",
    model: "Météo-France",
    days: 10,
    keyless: true,
    descriptionKey: "provider.open-meteo-meteofrance.desc",
  },
  {
    id: "open-meteo-ukmo",
    name: "Open-Meteo",
    model: "UK Met Office",
    days: 10,
    keyless: true,
    descriptionKey: "provider.open-meteo-ukmo.desc",
  },
  {
    id: "open-meteo-jma",
    name: "Open-Meteo",
    model: "JMA",
    days: 10,
    keyless: true,
    descriptionKey: "provider.open-meteo-jma.desc",
  },
  {
    id: "open-meteo-gem",
    name: "Open-Meteo",
    model: "Canada GEM",
    days: 10,
    keyless: true,
    descriptionKey: "provider.open-meteo-gem.desc",
  },
  {
    id: "open-meteo-knmi",
    name: "Open-Meteo",
    model: "KNMI",
    days: 10,
    keyless: true,
    descriptionKey: "provider.open-meteo-knmi.desc",
  },
  {
    id: "met-no",
    name: "MET Norway",
    model: "Locationforecast 2.0",
    days: 10,
    keyless: true,
    descriptionKey: "provider.met-no.desc",
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
