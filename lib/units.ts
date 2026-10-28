import type {
  PrecipUnit,
  PressureUnit,
  TemperatureUnit,
  WindUnit,
} from "@/lib/types";

export function convertTemperature(celsius: number, unit: TemperatureUnit): number {
  return unit === "f" ? (celsius * 9) / 5 + 32 : celsius;
}

export function temperatureUnit(unit: TemperatureUnit): string {
  return unit === "f" ? "°F" : "°C";
}

export function convertWind(kmh: number, unit: WindUnit): number {
  if (unit === "ms") return kmh / 3.6;
  if (unit === "mph") return kmh * 0.621371;
  return kmh;
}

export function windUnit(unit: WindUnit): string {
  if (unit === "ms") return "m/s";
  if (unit === "mph") return "mph";
  return "km/h";
}

export function convertPressure(hpa: number, unit: PressureUnit): number {
  if (unit === "mmhg") return hpa * 0.750061683;
  if (unit === "inhg") return hpa * 0.029529983;
  return hpa;
}

export function pressureUnit(unit: PressureUnit): string {
  if (unit === "mmhg") return "mmHg";
  if (unit === "inhg") return "inHg";
  return "hPa";
}

export function convertPrecip(mm: number, unit: PrecipUnit): number {
  return unit === "in" ? mm / 25.4 : mm;
}

export function precipUnit(unit: PrecipUnit): string {
  return unit === "in" ? "in" : "mm";
}

export function convertVisibility(meters: number, unit: PrecipUnit): number {
  return unit === "in" ? meters / 1609.344 : meters / 1000;
}

export function visibilityUnit(unit: PrecipUnit): string {
  return unit === "in" ? "mi" : "km";
}

export type WindDirectionKey =
  | "dir.n"
  | "dir.ne"
  | "dir.e"
  | "dir.se"
  | "dir.s"
  | "dir.sw"
  | "dir.w"
  | "dir.nw";

const DIRECTIONS: WindDirectionKey[] = [
  "dir.n",
  "dir.ne",
  "dir.e",
  "dir.se",
  "dir.s",
  "dir.sw",
  "dir.w",
  "dir.nw",
];

export function directionKey(degrees: number | null | undefined): WindDirectionKey | null {
  if (degrees === null || degrees === undefined || Number.isNaN(degrees)) return null;
  const normalized = ((degrees % 360) + 360) % 360;
  return DIRECTIONS[Math.round(normalized / 45) % 8] ?? null;
}

export type UvKey = "uv.low" | "uv.moderate" | "uv.high" | "uv.veryHigh" | "uv.extreme";

export function uvKey(index: number | null | undefined): UvKey | null {
  if (index === null || index === undefined || Number.isNaN(index)) return null;
  if (index < 3) return "uv.low";
  if (index < 6) return "uv.moderate";
  if (index < 8) return "uv.high";
  if (index < 11) return "uv.veryHigh";
  return "uv.extreme";
}

/** Indian summer / "feels" ranges are not used: this is a plain comfort hint. */
export function temperatureTone(celsius: number): "cold" | "cool" | "mild" | "warm" | "hot" {
  if (celsius <= 0) return "cold";
  if (celsius <= 10) return "cool";
  if (celsius <= 20) return "mild";
  if (celsius <= 28) return "warm";
  return "hot";
}

interface ColorStop {
  t: number;
  h: number;
  s: number;
  l: number;
}

/**
 * Temperature colour ramp used by every temperature scale in the app:
 * deep violet when it is well below freezing, sky blue around 0 °C, then
 * green, amber, orange and finally red as it gets hot. Interpolated in HSL so
 * the hue walks the short way round instead of turning grey halfway.
 */
const TEMP_STOPS: readonly ColorStop[] = [
  { t: -30, h: 278, s: 60, l: 38 },
  { t: -18, h: 272, s: 66, l: 46 },
  { t: -8, h: 258, s: 76, l: 56 },
  { t: 0, h: 205, s: 88, l: 58 },
  /* Above freezing the ramp stays blue/cyan until ~10 °C, crosses green only
     briefly and turns amber around 20 °C, so a mild autumn day never reads as
     "green = warm". */
  { t: 10, h: 192, s: 80, l: 54 },
  { t: 15, h: 118, s: 58, l: 44 },
  { t: 20, h: 52, s: 92, l: 56 },
  { t: 26, h: 28, s: 92, l: 55 },
  { t: 34, h: 356, s: 82, l: 50 },
];

function hueLerp(from: number, to: number, ratio: number): number {
  const delta = ((to - from + 540) % 360) - 180;
  return (from + delta * ratio + 360) % 360;
}

/** CSS colour for a Celsius temperature on the shared cold-to-hot ramp. */
export function temperatureColor(celsius: number): string {
  if (!Number.isFinite(celsius)) return "hsl(205 20% 55%)";
  const first = TEMP_STOPS[0];
  const last = TEMP_STOPS[TEMP_STOPS.length - 1];
  if (celsius <= first.t) return `hsl(${first.h} ${first.s}% ${first.l}%)`;
  if (celsius >= last.t) return `hsl(${last.h} ${last.s}% ${last.l}%)`;

  for (let index = 1; index < TEMP_STOPS.length; index += 1) {
    const right = TEMP_STOPS[index];
    if (celsius > right.t) continue;
    const left = TEMP_STOPS[index - 1];
    const ratio = (celsius - left.t) / (right.t - left.t);
    const h = Math.round(hueLerp(left.h, right.h, ratio));
    const s = Math.round(left.s + (right.s - left.s) * ratio);
    const l = Math.round(left.l + (right.l - left.l) * ratio);
    return `hsl(${h} ${s}% ${l}%)`;
  }
  return `hsl(${last.h} ${last.s}% ${last.l}%)`;
}
