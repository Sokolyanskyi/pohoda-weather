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
