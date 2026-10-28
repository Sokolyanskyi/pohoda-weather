import { describe, expect, it } from "vitest";
import {
  addDays,
  dateKeyInTz,
  dayDiff,
  daylightMinutes,
  localToUtcIso,
  moonPhase,
  moonPhaseName,
  sunProgress,
  todayKey,
  tzOffsetMs,
} from "@/lib/time";
import { sunTimes } from "@/lib/weather/sun";

describe("date keys", () => {
  it("adds and subtracts days across months and years", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(dayDiff("2026-10-28", "2026-11-04")).toBe(7);
  });

  it("resolves the local date for an instant", () => {
    expect(dateKeyInTz(new Date("2026-10-28T22:30:00Z"), "Europe/Kyiv")).toBe("2026-10-29");
    expect(dateKeyInTz(new Date("2026-10-28T22:30:00Z"), "UTC")).toBe("2026-10-28");
    expect(todayKey("UTC", new Date("2026-01-01T00:00:00Z"))).toBe("2026-01-01");
  });
});

describe("time zone conversion", () => {
  it("handles summer time in Kyiv", () => {
    expect(localToUtcIso("2026-07-01T12:00", "Europe/Kyiv")).toBe("2026-07-01T09:00:00.000Z");
    expect(tzOffsetMs("Europe/Kyiv", new Date("2026-07-01T12:00:00Z"))).toBe(3 * 3_600_000);
  });

  it("handles winter time in Kyiv", () => {
    expect(localToUtcIso("2026-01-15T12:00", "Europe/Kyiv")).toBe("2026-01-15T10:00:00.000Z");
    expect(tzOffsetMs("Europe/Kyiv", new Date("2026-01-15T12:00:00Z"))).toBe(2 * 3_600_000);
  });

  it("handles negative offsets", () => {
    expect(localToUtcIso("2026-01-15T12:00", "America/New_York")).toBe("2026-01-15T17:00:00.000Z");
  });
});

describe("sun helpers", () => {
  it("computes daylight minutes", () => {
    expect(daylightMinutes("2026-06-21T02:00:00Z", "2026-06-21T19:00:00Z")).toBe(17 * 60);
    expect(daylightMinutes(null, null)).toBeNull();
  });

  it("returns progress only inside the day", () => {
    const sunrise = "2026-06-21T02:00:00Z";
    const sunset = "2026-06-21T19:00:00Z";
    expect(sunProgress(sunrise, sunset, new Date("2026-06-21T02:00:00Z"))).toBe(0);
    expect(sunProgress(sunrise, sunset, new Date("2026-06-21T19:00:00Z"))).toBe(1);
    expect(sunProgress(sunrise, sunset, new Date("2026-06-21T21:00:00Z"))).toBeNull();
  });

  it("returns plausible sunrise and sunset for Kyiv", () => {
    const { sunrise, sunset } = sunTimes("2026-06-21", 50.4547, 30.5238);
    expect(sunrise).not.toBeNull();
    expect(sunset).not.toBeNull();
    const rise = new Date(sunrise as string);
    const set = new Date(sunset as string);
    expect(rise.getUTCHours()).toBeGreaterThanOrEqual(0);
    expect(rise.getUTCHours()).toBeLessThan(5);
    expect(set.getTime() - rise.getTime()).toBeGreaterThan(15 * 3_600_000);
    expect(set.getTime() - rise.getTime()).toBeLessThan(18 * 3_600_000);
  });

  it("returns null during polar night", () => {
    const { sunrise, sunset } = sunTimes("2026-12-21", 78.22, 15.65);
    expect(sunrise).toBeNull();
    expect(sunset).toBeNull();
  });
});

describe("moon helpers", () => {
  it("starts at a new moon on the reference instant", () => {
    const moon = moonPhase(new Date("2000-01-06T18:14:00Z"));
    expect(moon.phase).toBeCloseTo(0, 3);
    expect(moon.illumination).toBeLessThan(0.01);
    expect(moonPhaseName(moon.phase)).toBe("new");
  });

  it("reaches a full moon half a lunar month later", () => {
    const moon = moonPhase(new Date("2000-01-22T00:00:00Z"));
    expect(moon.illumination).toBeGreaterThan(0.99);
    expect(moon.waxing).toBe(false);
    expect(moonPhaseName(moon.phase)).toBe("full");
  });

  it("keeps the phase and illumination in range for a whole month", () => {
    for (let day = 0; day < 30; day += 1) {
      const moon = moonPhase(new Date(Date.UTC(2026, 9, 1 + day, 12)));
      expect(moon.phase).toBeGreaterThanOrEqual(0);
      expect(moon.phase).toBeLessThan(1);
      expect(moon.illumination).toBeGreaterThanOrEqual(0);
      expect(moon.illumination).toBeLessThanOrEqual(1);
    }
  });
});
