import { NextResponse } from "next/server";
import { fetchJson } from "@/lib/weather/errors";
import { isLocale } from "@/lib/i18n";

interface GeoResult {
  id?: number;
  name?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  timezone?: string;
  population?: number;
}

interface GeoResponse {
  results?: GeoResult[];
}

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();
  const languageRaw = searchParams.get("lang") ?? "en";
  const language = isLocale(languageRaw) ? languageRaw : "en";
  const count = Math.max(1, Math.min(12, Number(searchParams.get("count") ?? "8") || 8));

  if (query.length < 2) {
    return NextResponse.json({ results: [] }, { headers: CACHE_HEADERS });
  }

  const params = new URLSearchParams({
    name: query.slice(0, 100),
    count: String(count),
    format: "json",
  });

  // Open-Meteo indexes place names per language, so "Львів" is only found with
  // language=uk while "Львов" needs ru. Ask a couple of catalogues and merge.
  const languages = Array.from(
    new Set(
      /[\u0400-\u04FF]/.test(query)
        ? [language, "uk", "ru"]
        : [language, "en"],
    ),
  );

  try {
    const responses = await Promise.allSettled(
      languages.map((lang) =>
        fetchJson<GeoResponse>(
          `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}&language=${lang}`,
          { revalidate: 86_400, timeoutMs: 8000 },
        ),
      ),
    );

    const seen = new Set<string>();
    const results: Array<Record<string, unknown>> = [];

    for (const response of responses) {
      if (response.status !== "fulfilled") continue;
      for (const item of response.value.results ?? []) {
        if (typeof item.latitude !== "number" || typeof item.longitude !== "number") continue;
        if (!item.name) continue;
        const id = item.id ? `g:${item.id}` : `geo:${item.latitude},${item.longitude}`;
        if (seen.has(id)) continue;
        seen.add(id);
        results.push({
          id,
          name: item.name,
          admin1: item.admin1,
          country: item.country,
          countryCode: item.country_code,
          lat: item.latitude,
          lon: item.longitude,
          timezone: item.timezone,
          population: item.population,
        });
        if (results.length >= count) break;
      }
      if (results.length >= count) break;
    }

    return NextResponse.json({ results }, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json({ error: "provider_error" }, { status: 502 });
  }
}
