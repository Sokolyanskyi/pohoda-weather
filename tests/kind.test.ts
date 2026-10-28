import { describe, expect, it } from "vitest";
import {
  isStorm,
  isWet,
  kindFromMetSymbol,
  kindFromOwm,
  kindFromText,
  kindFromVisualCrossing,
  kindFromWmo,
  isNightSymbol,
  scenePreset,
} from "@/lib/weather/kind";

describe("WMO codes", () => {
  it("maps the main groups", () => {
    expect(kindFromWmo(0)).toBe("clear");
    expect(kindFromWmo(1)).toBe("partly");
    expect(kindFromWmo(3)).toBe("overcast");
    expect(kindFromWmo(45)).toBe("fog");
    expect(kindFromWmo(51)).toBe("drizzle");
    expect(kindFromWmo(63)).toBe("rain");
    expect(kindFromWmo(65)).toBe("heavy-rain");
    expect(kindFromWmo(71)).toBe("snow");
    expect(kindFromWmo(66)).toBe("sleet");
    expect(kindFromWmo(95)).toBe("thunder");
    expect(kindFromWmo(96)).toBe("hail");
  });

  it("falls back to cloudy", () => {
    expect(kindFromWmo(null)).toBe("cloudy");
    expect(kindFromWmo(999)).toBe("cloudy");
  });
});

describe("MET Norway symbols", () => {
  it("strips day and night suffixes", () => {
    expect(kindFromMetSymbol("clearsky_day")).toBe("clear");
    expect(kindFromMetSymbol("clearsky_night")).toBe("clear");
    expect(kindFromMetSymbol("partlycloudy_day")).toBe("partly");
    expect(kindFromMetSymbol("heavyrainandthunder")).toBe("thunder");
    expect(kindFromMetSymbol("lightsnowshowers")).toBe("snow");
    expect(kindFromMetSymbol("sleet")).toBe("sleet");
  });

  it("detects night symbols", () => {
    expect(isNightSymbol("clearsky_night")).toBe(true);
    expect(isNightSymbol("clearsky_day")).toBe(false);
  });
});

describe("OpenWeatherMap ids", () => {
  it("maps groups and special cases", () => {
    expect(kindFromOwm(800)).toBe("clear");
    expect(kindFromOwm(801)).toBe("partly");
    expect(kindFromOwm(804)).toBe("overcast");
    expect(kindFromOwm(500)).toBe("rain");
    expect(kindFromOwm(502)).toBe("heavy-rain");
    expect(kindFromOwm(511)).toBe("sleet");
    expect(kindFromOwm(601)).toBe("snow");
    expect(kindFromOwm(741)).toBe("fog");
    expect(kindFromOwm(200)).toBe("thunder");
  });
});

describe("Visual Crossing icons", () => {
  it("maps the timeline icons", () => {
    expect(kindFromVisualCrossing("clear-day")).toBe("clear");
    expect(kindFromVisualCrossing("partly-cloudy-night")).toBe("partly");
    expect(kindFromVisualCrossing("thunder-rain")).toBe("thunder");
    expect(kindFromVisualCrossing("sleet")).toBe("sleet");
    expect(kindFromVisualCrossing("unknown")).toBe("cloudy");
  });
});

describe("text fallback", () => {
  it("recognises several languages", () => {
    expect(kindFromText("Heavy rain")).toBe("heavy-rain");
    expect(kindFromText("Сильный дождь")).toBe("heavy-rain");
    expect(kindFromText("Гроза")).toBe("thunder");
    expect(kindFromText("Śnieg")).toBe("snow");
    expect(kindFromText("Nebel")).toBe("fog");
    expect(kindFromText("Lluvia")).toBe("rain");
  });
});

describe("scene presets", () => {
  it("groups conditions", () => {
    expect(scenePreset("clear")).toBe("clear");
    expect(scenePreset("overcast")).toBe("cloudy");
    expect(scenePreset("heavy-rain")).toBe("rain");
    expect(scenePreset("sleet")).toBe("snow");
    expect(scenePreset("hail")).toBe("storm");
    expect(scenePreset("fog")).toBe("fog");
  });

  it("knows wet and stormy weather", () => {
    expect(isWet("rain")).toBe(true);
    expect(isWet("clear")).toBe(false);
    expect(isStorm("thunder")).toBe(true);
    expect(isStorm("snow")).toBe(false);
  });
});
