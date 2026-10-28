import { NextResponse } from "next/server";
import { clampCoordinates } from "@/lib/places";
import { isProviderId, DEFAULT_PROVIDER } from "@/lib/weather/providers";
import { loadWeather } from "@/lib/weather";
import { WeatherProviderError } from "@/lib/weather/errors";
import type { Place } from "@/lib/types";

function clean(value: string | null, max = 120): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  const coords = clampCoordinates(lat, lon);
  if (!coords) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const providerRaw = searchParams.get("provider") ?? DEFAULT_PROVIDER;
  const provider = isProviderId(providerRaw) ? providerRaw : DEFAULT_PROVIDER;
  const daysRaw = Number(searchParams.get("days") ?? "7");
  const days = Math.max(1, Math.min(30, Number.isFinite(daysRaw) ? Math.floor(daysRaw) : 7));
  const key = clean(searchParams.get("key"), 200);

  const place: Place = {
    id: clean(searchParams.get("id"), 160) ?? `geo:${coords.lat},${coords.lon}`,
    name: clean(searchParams.get("name")) ?? "Selected place",
    admin1: clean(searchParams.get("admin1")),
    country: clean(searchParams.get("country")),
    countryCode: clean(searchParams.get("countryCode"), 8),
    lat: coords.lat,
    lon: coords.lon,
    timezone: clean(searchParams.get("timezone"), 80),
  };

  try {
    const snapshot = await loadWeather({ provider, place, days, key });
    const keyless = provider !== "openweathermap" && provider !== "visual-crossing";
    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": keyless
          ? "public, s-maxage=300, stale-while-revalidate=900"
          : "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof WeatherProviderError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.status >= 400 && error.status < 600 ? error.status : 502 },
      );
    }
    console.error("weather route failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }
}
