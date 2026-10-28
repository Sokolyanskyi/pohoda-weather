import type { Place, ProviderId, WeatherSnapshot } from "@/lib/types";
import { fillClimate } from "@/lib/weather/climate";
import { fetchJson, WeatherProviderError } from "@/lib/weather/errors";
import { normalizeMetNo, buildMetNoUrl, type MetNoResponse } from "@/lib/weather/met-no";
import {
  buildOpenMeteoUrl,
  normalizeOpenMeteo,
  type OpenMeteoResponse,
} from "@/lib/weather/open-meteo";
import {
  buildOwmUrls,
  normalizeOwm,
  type OwmForecastResponse,
} from "@/lib/weather/openweather";
import { PROVIDER_MAP, isProviderId } from "@/lib/weather/providers";
import { resolveTimezone } from "@/lib/weather/timezone";
import { normalizeVc, buildVcUrl, type VcResponse } from "@/lib/weather/visual-crossing";

export interface LoadWeatherInput {
  provider: ProviderId;
  place: Place;
  days: number;
  key?: string | null;
}

const USER_AGENT =
  "pohoda-weather/1.0 (+https://github.com/Sokolyanskyi/pohoda-weather)";

function envKey(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

export async function loadWeather({
  provider,
  place,
  days,
  key,
}: LoadWeatherInput): Promise<WeatherSnapshot> {
  if (!isProviderId(provider)) {
    throw new WeatherProviderError("invalid_request", "Unknown provider", 400);
  }
  const meta = PROVIDER_MAP[provider];
  const requestedDays = Math.max(1, Math.min(30, Math.floor(days) || 7));
  const resolvedKey = key?.trim() || envKey(meta.keyEnv);

  if (!meta.keyless && !resolvedKey) {
    throw new WeatherProviderError(
      "key_required",
      "This provider needs an API key",
      400,
    );
  }

  let snapshot: WeatherSnapshot;

  if (provider === "met-no") {
    const timezone = await resolveTimezone(place);
    const payload = await fetchJson<MetNoResponse>(buildMetNoUrl(place), {
      revalidate: 600,
      headers: { "User-Agent": USER_AGENT },
    });
    snapshot = normalizeMetNo({
      place,
      timezone,
      days: Math.min(requestedDays, meta.days),
      payload,
    });
  } else if (provider === "openweathermap") {
    const timezone = await resolveTimezone(place);
    const urls = buildOwmUrls(place, resolvedKey as string);
    const [current, forecast] = await Promise.all([
      fetchJson<Record<string, unknown>>(urls.current),
      fetchJson<OwmForecastResponse>(urls.forecast),
    ]);
    snapshot = normalizeOwm({
      place,
      timezone,
      days: Math.min(requestedDays, meta.days),
      current: current as never,
      forecast,
    });
  } else if (provider === "visual-crossing") {
    const payload = await fetchJson<VcResponse>(buildVcUrl(place, resolvedKey as string), {
      timeoutMs: 15_000,
    });
    snapshot = normalizeVc({
      place,
      days: Math.min(requestedDays, meta.days),
      payload,
    });
  } else {
    const payload = await fetchJson<OpenMeteoResponse>(
      buildOpenMeteoUrl(place, provider, Math.min(requestedDays, meta.days)),
      { revalidate: 600 },
    );
    snapshot = normalizeOpenMeteo({
      place,
      provider,
      days: Math.min(requestedDays, meta.days),
      payload,
    });
    if (snapshot.daily.length === 0) {
      throw new WeatherProviderError("provider_error", "No daily data returned", 502);
    }
  }

  if (snapshot.daily.length === 0) {
    throw new WeatherProviderError("provider_error", "No daily data returned", 502);
  }

  return fillClimate(snapshot, requestedDays);
}
