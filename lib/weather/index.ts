import type { Place, ProviderId, WeatherSnapshot } from "@/lib/types";
import { fillClimate } from "@/lib/weather/climate";
import { fetchJson, WeatherProviderError } from "@/lib/weather/errors";
import { normalizeMetNo, buildMetNoUrl, type MetNoResponse } from "@/lib/weather/met-no";
import {
  buildOpenMeteoUrl,
  normalizeOpenMeteo,
  type OpenMeteoResponse,
} from "@/lib/weather/open-meteo";
import { PROVIDER_MAP, isProviderId } from "@/lib/weather/providers";
import { resolveTimezone } from "@/lib/weather/timezone";

export interface LoadWeatherInput {
  provider: ProviderId;
  place: Place;
  days: number;
}

const USER_AGENT =
  "pohoda-weather/1.0 (+https://github.com/Sokolyanskyi/pohoda-weather)";

export async function loadWeather({
  provider,
  place,
  days,
}: LoadWeatherInput): Promise<WeatherSnapshot> {
  if (!isProviderId(provider)) {
    throw new WeatherProviderError("invalid_request", "Unknown provider", 400);
  }
  const meta = PROVIDER_MAP[provider];
  const requestedDays = Math.max(1, Math.min(30, Math.floor(days) || 7));

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
