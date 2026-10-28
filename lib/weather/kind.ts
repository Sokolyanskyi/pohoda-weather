import type { WeatherKind } from "@/lib/types";

export const WEATHER_KINDS: readonly WeatherKind[] = [
  "clear",
  "partly",
  "cloudy",
  "overcast",
  "fog",
  "drizzle",
  "rain",
  "heavy-rain",
  "snow",
  "sleet",
  "thunder",
  "hail",
];

const WMO: Record<number, WeatherKind> = {
  0: "clear",
  1: "partly",
  2: "partly",
  3: "overcast",
  45: "fog",
  48: "fog",
  51: "drizzle",
  53: "drizzle",
  55: "drizzle",
  56: "sleet",
  57: "sleet",
  61: "rain",
  63: "rain",
  65: "heavy-rain",
  66: "sleet",
  67: "sleet",
  71: "snow",
  73: "snow",
  75: "snow",
  77: "snow",
  80: "rain",
  81: "rain",
  82: "heavy-rain",
  85: "snow",
  86: "snow",
  95: "thunder",
  96: "hail",
  99: "hail",
};

/** WMO weather code used by Open-Meteo and many other services. */
export function kindFromWmo(code: number | null | undefined): WeatherKind {
  if (code === null || code === undefined || Number.isNaN(code)) return "cloudy";
  return WMO[code] ?? "cloudy";
}

const MET_PREFIX: Record<string, WeatherKind> = {
  clearsky: "clear",
  fair: "partly",
  partlycloudy: "partly",
  cloudy: "cloudy",
  fog: "fog",
  lightrain: "drizzle",
  lightrainshowers: "drizzle",
  rain: "rain",
  rainshowers: "rain",
  heavyrain: "heavy-rain",
  heavyrainshowers: "heavy-rain",
  lightrainandthunder: "thunder",
  rainandthunder: "thunder",
  heavyrainandthunder: "thunder",
  rainshowersandthunder: "thunder",
  lightssleetshowersandthunder: "thunder",
  sleetshowersandthunder: "thunder",
  heavysleetshowersandthunder: "thunder",
  lightsnowandthunder: "thunder",
  snowandthunder: "thunder",
  heavysnowandthunder: "thunder",
  lightssnowshowersandthunder: "thunder",
  snowshowersandthunder: "thunder",
  heavysnowshowersandthunder: "thunder",
  lightsleet: "sleet",
  sleet: "sleet",
  heavysleet: "sleet",
  lightsleetshowers: "sleet",
  sleetshowers: "sleet",
  heavysleetshowers: "sleet",
  lightsnow: "snow",
  snow: "snow",
  heavysnow: "snow",
  lightsnowshowers: "snow",
  snowshowers: "snow",
  heavysnowshowers: "snow",
};

/** MET Norway symbol_code, for example "partlycloudy_day". */
export function kindFromMetSymbol(symbol: string | null | undefined): WeatherKind {
  if (!symbol) return "cloudy";
  const base = symbol
    .toLowerCase()
    .replace(/_(day|night|polartwilight)$/, "")
    .replace(/_/g, "");
  return MET_PREFIX[base] ?? "cloudy";
}

export function isNightSymbol(symbol: string | null | undefined): boolean {
  return Boolean(symbol && /_night$/.test(symbol));
}

const TEXT_HINTS: Array<[RegExp, WeatherKind]> = [
  [/thunder|storm|гроза|гроз|burz|gewitter|tormenta/i, "thunder"],
  [/hail|град|grad|hagel|granizo/i, "hail"],
  [/sleet|freez|мокрый снег|ожелед|deszcz ze śniegiem|schneeregen|aguanieve/i, "sleet"],
  [/heavy rain|ливень|сильный дождь|ulewa|starkregen|lluvia fuerte/i, "heavy-rain"],
  [/drizzle|морось|мряка|mżawka|niesel|llovizna/i, "drizzle"],
  [/rain|дождь|дощ|deszcz|regen|lluvia/i, "rain"],
  [/snow|снег|сніг|śnieg|schnee|nieve/i, "snow"],
  [/fog|mist|туман|mgła|nebel|niebla/i, "fog"],
  [/overcast|пасмурно|похмуро|pochmurno|bedeckt|nublado/i, "overcast"],
  [/cloud|облач|хмар|chmur|wolken|nube/i, "cloudy"],
  [/clear|sunny|ясно|сонце|słońce|sonnig|despejado/i, "clear"],
];

/** Last-resort mapping for text-only provider responses. */
export function kindFromText(text: string | null | undefined): WeatherKind {
  if (!text) return "cloudy";
  for (const [pattern, kind] of TEXT_HINTS) {
    if (pattern.test(text)) return kind;
  }
  return "cloudy";
}

export function isWet(kind: WeatherKind): boolean {
  return (
    kind === "drizzle" ||
    kind === "rain" ||
    kind === "heavy-rain" ||
    kind === "snow" ||
    kind === "sleet" ||
    kind === "thunder" ||
    kind === "hail"
  );
}

export function isStorm(kind: WeatherKind): boolean {
  return kind === "thunder" || kind === "hail";
}

export type ScenePreset = "clear" | "partly" | "cloudy" | "rain" | "snow" | "storm" | "fog";

export function scenePreset(kind: WeatherKind): ScenePreset {
  switch (kind) {
    case "clear":
      return "clear";
    case "partly":
      return "partly";
    case "cloudy":
    case "overcast":
      return "cloudy";
    case "drizzle":
    case "rain":
    case "heavy-rain":
      return "rain";
    case "snow":
    case "sleet":
      return "snow";
    case "thunder":
    case "hail":
      return "storm";
    case "fog":
      return "fog";
  }
}
