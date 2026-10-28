import type { Place } from "@/lib/types";

interface TzPlace {
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
}

const BY_TIMEZONE: Record<string, TzPlace> = {
  "Europe/Kyiv": { name: "Kyiv", country: "Ukraine", countryCode: "UA", lat: 50.4547, lon: 30.5238 },
  "Europe/Kiev": { name: "Kyiv", country: "Ukraine", countryCode: "UA", lat: 50.4547, lon: 30.5238 },
  "Europe/Warsaw": { name: "Warsaw", country: "Poland", countryCode: "PL", lat: 52.2297, lon: 21.0122 },
  "Europe/Berlin": { name: "Berlin", country: "Germany", countryCode: "DE", lat: 52.52, lon: 13.405 },
  "Europe/Vienna": { name: "Vienna", country: "Austria", countryCode: "AT", lat: 48.2082, lon: 16.3738 },
  "Europe/Zurich": { name: "Zurich", country: "Switzerland", countryCode: "CH", lat: 47.3769, lon: 8.5417 },
  "Europe/Prague": { name: "Prague", country: "Czechia", countryCode: "CZ", lat: 50.0755, lon: 14.4378 },
  "Europe/Budapest": { name: "Budapest", country: "Hungary", countryCode: "HU", lat: 47.4979, lon: 19.0402 },
  "Europe/Bucharest": { name: "Bucharest", country: "Romania", countryCode: "RO", lat: 44.4268, lon: 26.1025 },
  "Europe/Sofia": { name: "Sofia", country: "Bulgaria", countryCode: "BG", lat: 42.6977, lon: 23.3219 },
  "Europe/Athens": { name: "Athens", country: "Greece", countryCode: "GR", lat: 37.9838, lon: 23.7275 },
  "Europe/Istanbul": { name: "Istanbul", country: "Türkiye", countryCode: "TR", lat: 41.0082, lon: 28.9784 },
  "Europe/London": { name: "London", country: "United Kingdom", countryCode: "GB", lat: 51.5074, lon: -0.1278 },
  "Europe/Dublin": { name: "Dublin", country: "Ireland", countryCode: "IE", lat: 53.3498, lon: -6.2603 },
  "Europe/Paris": { name: "Paris", country: "France", countryCode: "FR", lat: 48.8566, lon: 2.3522 },
  "Europe/Madrid": { name: "Madrid", country: "Spain", countryCode: "ES", lat: 40.4168, lon: -3.7038 },
  "Europe/Lisbon": { name: "Lisbon", country: "Portugal", countryCode: "PT", lat: 38.7223, lon: -9.1393 },
  "Europe/Rome": { name: "Rome", country: "Italy", countryCode: "IT", lat: 41.9028, lon: 12.4964 },
  "Europe/Amsterdam": { name: "Amsterdam", country: "Netherlands", countryCode: "NL", lat: 52.3676, lon: 4.9041 },
  "Europe/Brussels": { name: "Brussels", country: "Belgium", countryCode: "BE", lat: 50.8503, lon: 4.3517 },
  "Europe/Copenhagen": { name: "Copenhagen", country: "Denmark", countryCode: "DK", lat: 55.6761, lon: 12.5683 },
  "Europe/Oslo": { name: "Oslo", country: "Norway", countryCode: "NO", lat: 59.9139, lon: 10.7522 },
  "Europe/Stockholm": { name: "Stockholm", country: "Sweden", countryCode: "SE", lat: 59.3293, lon: 18.0686 },
  "Europe/Helsinki": { name: "Helsinki", country: "Finland", countryCode: "FI", lat: 60.1699, lon: 24.9384 },
  "Europe/Tallinn": { name: "Tallinn", country: "Estonia", countryCode: "EE", lat: 59.437, lon: 24.7536 },
  "Europe/Riga": { name: "Riga", country: "Latvia", countryCode: "LV", lat: 56.9496, lon: 24.1052 },
  "Europe/Vilnius": { name: "Vilnius", country: "Lithuania", countryCode: "LT", lat: 54.6872, lon: 25.2797 },
  "Europe/Moscow": { name: "Moscow", country: "Russia", countryCode: "RU", lat: 55.7558, lon: 37.6173 },
  "Europe/Belgrade": { name: "Belgrade", country: "Serbia", countryCode: "RS", lat: 44.7866, lon: 20.4489 },
  "Europe/Zagreb": { name: "Zagreb", country: "Croatia", countryCode: "HR", lat: 45.815, lon: 15.9819 },
  "Asia/Tbilisi": { name: "Tbilisi", country: "Georgia", countryCode: "GE", lat: 41.7151, lon: 44.8271 },
  "Asia/Yerevan": { name: "Yerevan", country: "Armenia", countryCode: "AM", lat: 40.1792, lon: 44.4991 },
  "Asia/Baku": { name: "Baku", country: "Azerbaijan", countryCode: "AZ", lat: 40.4093, lon: 49.8671 },
  "Asia/Dubai": { name: "Dubai", country: "United Arab Emirates", countryCode: "AE", lat: 25.2048, lon: 55.2708 },
  "Asia/Jerusalem": { name: "Jerusalem", country: "Israel", countryCode: "IL", lat: 31.7683, lon: 35.2137 },
  "Africa/Cairo": { name: "Cairo", country: "Egypt", countryCode: "EG", lat: 30.0444, lon: 31.2357 },
  "Africa/Johannesburg": { name: "Johannesburg", country: "South Africa", countryCode: "ZA", lat: -26.2041, lon: 28.0473 },
  "Africa/Nairobi": { name: "Nairobi", country: "Kenya", countryCode: "KE", lat: -1.2921, lon: 36.8219 },
  "Africa/Lagos": { name: "Lagos", country: "Nigeria", countryCode: "NG", lat: 6.5244, lon: 3.3792 },
  "America/New_York": { name: "New York", country: "United States", countryCode: "US", lat: 40.7128, lon: -74.006 },
  "America/Chicago": { name: "Chicago", country: "United States", countryCode: "US", lat: 41.8781, lon: -87.6298 },
  "America/Denver": { name: "Denver", country: "United States", countryCode: "US", lat: 39.7392, lon: -104.9903 },
  "America/Los_Angeles": { name: "Los Angeles", country: "United States", countryCode: "US", lat: 34.0522, lon: -118.2437 },
  "America/Toronto": { name: "Toronto", country: "Canada", countryCode: "CA", lat: 43.6532, lon: -79.3832 },
  "America/Vancouver": { name: "Vancouver", country: "Canada", countryCode: "CA", lat: 49.2827, lon: -123.1207 },
  "America/Mexico_City": { name: "Mexico City", country: "Mexico", countryCode: "MX", lat: 19.4326, lon: -99.1332 },
  "America/Sao_Paulo": { name: "São Paulo", country: "Brazil", countryCode: "BR", lat: -23.5505, lon: -46.6333 },
  "America/Argentina/Buenos_Aires": { name: "Buenos Aires", country: "Argentina", countryCode: "AR", lat: -34.6037, lon: -58.3816 },
  "America/Santiago": { name: "Santiago", country: "Chile", countryCode: "CL", lat: -33.4489, lon: -70.6693 },
  "America/Bogota": { name: "Bogotá", country: "Colombia", countryCode: "CO", lat: 4.711, lon: -74.0721 },
  "America/Lima": { name: "Lima", country: "Peru", countryCode: "PE", lat: -12.0464, lon: -77.0428 },
  "Asia/Tokyo": { name: "Tokyo", country: "Japan", countryCode: "JP", lat: 35.6762, lon: 139.6503 },
  "Asia/Seoul": { name: "Seoul", country: "South Korea", countryCode: "KR", lat: 37.5665, lon: 126.978 },
  "Asia/Shanghai": { name: "Shanghai", country: "China", countryCode: "CN", lat: 31.2304, lon: 121.4737 },
  "Asia/Hong_Kong": { name: "Hong Kong", country: "Hong Kong", countryCode: "HK", lat: 22.3193, lon: 114.1694 },
  "Asia/Singapore": { name: "Singapore", country: "Singapore", countryCode: "SG", lat: 1.3521, lon: 103.8198 },
  "Asia/Bangkok": { name: "Bangkok", country: "Thailand", countryCode: "TH", lat: 13.7563, lon: 100.5018 },
  "Asia/Jakarta": { name: "Jakarta", country: "Indonesia", countryCode: "ID", lat: -6.2088, lon: 106.8456 },
  "Asia/Manila": { name: "Manila", country: "Philippines", countryCode: "PH", lat: 14.5995, lon: 120.9842 },
  "Asia/Kolkata": { name: "Delhi", country: "India", countryCode: "IN", lat: 28.6139, lon: 77.209 },
  "Australia/Sydney": { name: "Sydney", country: "Australia", countryCode: "AU", lat: -33.8688, lon: 151.2093 },
  "Australia/Melbourne": { name: "Melbourne", country: "Australia", countryCode: "AU", lat: -37.8136, lon: 144.9631 },
  "Pacific/Auckland": { name: "Auckland", country: "New Zealand", countryCode: "NZ", lat: -36.8485, lon: 174.7633 },
  "Atlantic/Reykjavik": { name: "Reykjavík", country: "Iceland", countryCode: "IS", lat: 64.1466, lon: -21.9426 },
  "Pacific/Honolulu": { name: "Honolulu", country: "United States", countryCode: "US", lat: 21.3069, lon: -157.8583 },
};

export const FALLBACK_PLACE: Place = {
  id: "tz:Europe/Kyiv",
  name: "Kyiv",
  country: "Ukraine",
  countryCode: "UA",
  lat: 50.4547,
  lon: 30.5238,
  timezone: "Europe/Kyiv",
};

/** Best guess for a first visit: a familiar city in the browser's time zone. */
export function guessPlace(): Place {
  if (typeof Intl === "undefined") return FALLBACK_PLACE;
  let timeZone = "UTC";
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return FALLBACK_PLACE;
  }
  const found = BY_TIMEZONE[timeZone];
  if (!found) return FALLBACK_PLACE;
  return {
    id: `tz:${timeZone}`,
    name: found.name,
    country: found.country,
    countryCode: found.countryCode,
    lat: found.lat,
    lon: found.lon,
    timezone: timeZone,
  };
}

export function samePlace(a: Place | null | undefined, b: Place | null | undefined): boolean {
  if (!a || !b) return false;
  if (a.id === b.id) return true;
  return Math.abs(a.lat - b.lat) < 0.02 && Math.abs(a.lon - b.lon) < 0.02;
}

export function placeSecondary(place: Place): string {
  return [place.admin1, place.country].filter(Boolean).join(", ");
}

export function placeLabel(place: Place): string {
  const secondary = placeSecondary(place);
  return secondary ? `${place.name}, ${secondary}` : place.name;
}

export function clampCoordinates(lat: number, lon: number): { lat: number; lon: number } | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat: Math.round(lat * 10000) / 10000, lon: Math.round(lon * 10000) / 10000 };
}
