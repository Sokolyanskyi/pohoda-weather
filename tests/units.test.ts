import { describe, expect, it } from "vitest";
import {
  convertPrecip,
  convertPressure,
  convertTemperature,
  convertVisibility,
  convertWind,
  directionKey,
  temperatureTone,
  uvKey,
} from "@/lib/units";

describe("temperature", () => {
  it("converts to Fahrenheit", () => {
    expect(convertTemperature(0, "f")).toBe(32);
    expect(convertTemperature(100, "f")).toBe(212);
    expect(convertTemperature(-40, "f")).toBe(-40);
  });

  it("keeps Celsius as is", () => {
    expect(convertTemperature(21.5, "c")).toBe(21.5);
  });
});

describe("wind", () => {
  it("converts km/h to m/s and mph", () => {
    expect(convertWind(36, "ms")).toBeCloseTo(10, 5);
    expect(convertWind(100, "mph")).toBeCloseTo(62.1371, 3);
    expect(convertWind(12, "kmh")).toBe(12);
  });
});

describe("pressure", () => {
  it("converts hPa to mmHg and inHg", () => {
    expect(convertPressure(1013.25, "mmhg")).toBeCloseTo(760, 1);
    expect(convertPressure(1013.25, "inhg")).toBeCloseTo(29.92, 2);
    expect(convertPressure(1013.25, "hpa")).toBe(1013.25);
  });
});

describe("precipitation and visibility", () => {
  it("converts millimetres to inches", () => {
    expect(convertPrecip(25.4, "in")).toBeCloseTo(1, 5);
    expect(convertPrecip(5, "mm")).toBe(5);
  });

  it("converts metres to kilometres and miles", () => {
    expect(convertVisibility(10_000, "mm")).toBe(10);
    expect(convertVisibility(1609.344, "in")).toBeCloseTo(1, 5);
  });
});

describe("direction", () => {
  it("maps degrees to compass keys", () => {
    expect(directionKey(0)).toBe("dir.n");
    expect(directionKey(45)).toBe("dir.ne");
    expect(directionKey(180)).toBe("dir.s");
    expect(directionKey(359)).toBe("dir.n");
    expect(directionKey(-90)).toBe("dir.w");
  });

  it("returns null for missing values", () => {
    expect(directionKey(null)).toBeNull();
    expect(directionKey(Number.NaN)).toBeNull();
  });
});

describe("uv", () => {
  it("buckets the index", () => {
    expect(uvKey(0)).toBe("uv.low");
    expect(uvKey(2.9)).toBe("uv.low");
    expect(uvKey(3)).toBe("uv.moderate");
    expect(uvKey(7)).toBe("uv.high");
    expect(uvKey(9)).toBe("uv.veryHigh");
    expect(uvKey(12)).toBe("uv.extreme");
    expect(uvKey(null)).toBeNull();
  });
});

describe("temperature tone", () => {
  it("classifies comfort ranges", () => {
    expect(temperatureTone(-5)).toBe("cold");
    expect(temperatureTone(4)).toBe("cool");
    expect(temperatureTone(16)).toBe("mild");
    expect(temperatureTone(24)).toBe("warm");
    expect(temperatureTone(33)).toBe("hot");
  });
});
