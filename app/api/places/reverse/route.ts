import { NextResponse } from "next/server";
import { clampCoordinates } from "@/lib/places";
import { fetchJson } from "@/lib/weather/errors";
import { isLocale } from "@/lib/i18n";

interface BigDataCloud {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
  countryCode?: string;
}

interface Nominatim {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    suburb?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coords = clampCoordinates(
    Number(searchParams.get("lat")),
    Number(searchParams.get("lon")),
  );
  if (!coords) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const languageRaw = searchParams.get("lang") ?? "en";
  const language = isLocale(languageRaw) ? languageRaw : "en";

  try {
    const params = new URLSearchParams({
      latitude: String(coords.lat),
      longitude: String(coords.lon),
      localityLanguage: language,
    });
    const data = await fetchJson<BigDataCloud>(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`,
      { revalidate: 86_400, timeoutMs: 7000 },
    );
    const name = data.city || data.locality || data.principalSubdivision;
    if (name) {
      return NextResponse.json(
        {
          place: {
            id: `geo:${coords.lat},${coords.lon}`,
            name,
            admin1: data.principalSubdivision,
            country: data.countryName,
            countryCode: data.countryCode,
            lat: coords.lat,
            lon: coords.lon,
          },
        },
        { headers: { "Cache-Control": "public, s-maxage=86400" } },
      );
    }
  } catch {
    // Fall back to Nominatim below.
  }

  try {
    const params = new URLSearchParams({
      format: "jsonv2",
      lat: String(coords.lat),
      lon: String(coords.lon),
      "accept-language": language,
      zoom: "10",
    });
    const data = await fetchJson<Nominatim>(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        revalidate: 86_400,
        timeoutMs: 8000,
        headers: {
          "User-Agent": "pohoda-weather/1.0 (+https://github.com/Sokolyanskyi/pohoda-weather)",
        },
      },
    );
    const address = data.address ?? {};
    const name =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.suburb ||
      address.state;
    if (name) {
      return NextResponse.json(
        {
          place: {
            id: `geo:${coords.lat},${coords.lon}`,
            name,
            admin1: address.state,
            country: address.country,
            countryCode: address.country_code?.toUpperCase(),
            lat: coords.lat,
            lon: coords.lon,
          },
        },
        { headers: { "Cache-Control": "public, s-maxage=86400" } },
      );
    }
  } catch {
    // The client falls back to coordinates.
  }

  return NextResponse.json({ error: "provider_error" }, { status: 502 });
}
