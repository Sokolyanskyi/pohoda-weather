import { describe, expect, it } from "vitest";
import {
  formatNumber,
  formatPercent,
  formatPrecip,
  formatPressure,
  formatTemp,
  formatVisibility,
  formatWind,
  formatDaylight,
} from "@/lib/format";
import {
  clampDaily,
  dewPoint,
  dominantKind,
  feelsLike,
  mean,
  minOf,
  maxOf,
} from "@/lib/weather/shared";
import type { DailyPoint } from "@/lib/types";

const day = (date: string, min: number, max: number): DailyPoint => ({
  date,
  kind: "clear",
  min,
  max,
  feelsMax: null,
  feelsMin: null,
  precipitation: 0,
  precipitationProbability: null,
  windMax: null,
  windGustMax: null,
  windDirection: null,
  uvMax: null,
  humidityMean: null,
  sunrise: null,
  sunset: null,
  source: "forecast",
});

describe("formatting", () => {
  it("formats temperature with a degree sign", () => {
    expect(formatTemp(12.4, "c", "en")).toBe("12°C");
    expect(formatTemp(12.4, "f", "en")).toBe("54°F");
    expect(formatTemp(null, "c", "en")).toBe("—");
  });

  it("uses locale-specific decimal separators", () => {
    expect(formatNumber(1234.5, "en", 1)).toBe("1,234.5");
    expect(formatNumber(1234.5, "de", 1)).toBe("1.234,5");
  });

  it("formats wind in the selected unit", () => {
    expect(formatWind(36, "kmh", "en")).toBe("36 km/h");
    expect(formatWind(36, "ms", "en")).toBe("10.0 m/s");
    expect(formatWind(36, "mph", "en")).toBe("22 mph");
  });

  it("formats pressure", () => {
    expect(formatPressure(1013.25, "hpa", "en")).toBe("1,013 hPa");
    expect(formatPressure(1013.25, "mmhg", "en")).toBe("760 mmHg");
    expect(formatPressure(1013.25, "inhg", "en")).toBe("29.92 inHg");
  });

  it("formats precipitation and visibility", () => {
    expect(formatPrecip(2.5, "mm", "en")).toBe("2.5 mm");
    expect(formatPrecip(25.4, "in", "en")).toBe("1.00 in");
    expect(formatVisibility(1200, "mm", "en")).toBe("1.2 km");
  });

  it("formats percentages and daylight", () => {
    expect(formatPercent(87.6, "en")).toBe("88%");
    expect(formatPercent(null, "en")).toBe("—");
    expect(formatDaylight(545, "en")).toBe("9 h 5 min");
  });

  it("never prints a negative zero", () => {
    expect(formatTemp(-0.4, "c", "en")).toBe("0°C");
    expect(formatNumber(-0.04, "en", 1)).toBe("0.0");
  });
});

describe("weather helpers", () => {
  it("computes a dew point below the temperature", () => {
    const value = dewPoint(20, 60);
    expect(value).not.toBeNull();
    expect(value as number).toBeLessThan(20);
    expect(value as number).toBeGreaterThan(10);
    expect(dewPoint(20, 0)).toBeNull();
  });

  it("computes wind chill and heat index", () => {
    expect(feelsLike(0, 50, 30) as number).toBeLessThan(0);
    expect(feelsLike(35, 70, 5) as number).toBeGreaterThan(35);
    expect(feelsLike(18, 50, 5)).toBe(18);
    expect(feelsLike(null, 50, 5)).toBeNull();
  });

  it("picks the most notable condition", () => {
    expect(dominantKind(["clear", "rain", "cloudy"])).toBe("rain");
    expect(dominantKind(["snow", "thunder"])).toBe("thunder");
    expect(dominantKind([])).toBe("cloudy");
  });

  it("aggregates numbers", () => {
    expect(mean([1, 2, null, 3])).toBe(2);
    expect(mean([])).toBeNull();
    expect(maxOf([1, null, 5])).toBe(5);
    expect(minOf([1, null, 5])).toBe(1);
  });

  it("sorts and clamps daily data", () => {
    const input = [day("2026-11-02", 1, 2), day("2026-11-01", 3, 4), day("2026-11-03", 5, 6)];
    const result = clampDaily(input, 2);
    expect(result.map((item) => item.date)).toEqual(["2026-11-01", "2026-11-02"]);
  });
});
