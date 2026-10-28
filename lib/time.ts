const MS_MINUTE = 60_000;
const MS_HOUR = 3_600_000;

function partsToMap(parts: Intl.DateTimeFormatPart[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of parts) {
    if (part.type !== "literal") map.set(part.type, part.value);
  }
  return map;
}

function safeFormatter(options: Intl.DateTimeFormatOptions, locale: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale, options);
}

/** Offset of a time zone at a given instant, in milliseconds (local - UTC). */
export function tzOffsetMs(timeZone: string, date: Date): number {
  try {
    const formatter = safeFormatter(
      {
        timeZone,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      },
      "en-US",
    );
    const parts = partsToMap(formatter.formatToParts(date));
    const year = Number(parts.get("year"));
    const month = Number(parts.get("month"));
    const day = Number(parts.get("day"));
    const hour = Number(parts.get("hour")) % 24;
    const minute = Number(parts.get("minute"));
    const second = Number(parts.get("second"));
    if ([year, month, day, hour, minute, second].some((v) => Number.isNaN(v))) return 0;
    const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);
    return asUtc - Math.floor(date.getTime() / 1000) * 1000;
  } catch {
    return 0;
  }
}

/** Convert a wall-clock ISO string ("2026-10-28T14:30") in a zone to a UTC ISO string. */
export function localToUtcIso(local: string, timeZone: string): string {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(local.trim());
  if (!match) {
    const parsed = new Date(local);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }
  const [, y, mo, d, h, mi, s] = match;
  const naive = Date.UTC(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(s ?? 0),
  );
  let timestamp = naive - tzOffsetMs(timeZone, new Date(naive));
  timestamp = naive - tzOffsetMs(timeZone, new Date(timestamp));
  return new Date(timestamp).toISOString();
}

export function utcToLocalIso(date: Date, timeZone: string): string {
  try {
    const formatter = safeFormatter(
      {
        timeZone,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      },
      "en-CA",
    );
    const parts = partsToMap(formatter.formatToParts(date));
    return `${parts.get("year")}-${parts.get("month")}-${parts.get("day")}T${String(
      Number(parts.get("hour")) % 24,
    ).padStart(2, "0")}:${parts.get("minute")}`;
  } catch {
    return date.toISOString().slice(0, 16);
  }
}

/** Local calendar date (YYYY-MM-DD) for an instant in a zone. */
export function dateKeyInTz(date: Date, timeZone: string): string {
  try {
    const formatter = safeFormatter(
      { timeZone, year: "numeric", month: "2-digit", day: "2-digit" },
      "en-CA",
    );
    const parts = partsToMap(formatter.formatToParts(date));
    return `${parts.get("year")}-${parts.get("month")}-${parts.get("day")}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function todayKey(timeZone: string, now = new Date()): string {
  return dateKeyInTz(now, timeZone);
}

export function parseDateKeyUtcNoon(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y || 2000, (m || 1) - 1, d || 1, 12, 0, 0));
}

export function addDays(dateKey: string, days: number): string {
  const date = parseDateKeyUtcNoon(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function dayDiff(from: string, to: string): number {
  return Math.round(
    (parseDateKeyUtcNoon(to).getTime() - parseDateKeyUtcNoon(from).getTime()) / 86_400_000,
  );
}

/** Same calendar day a number of years back. 29 February falls back to 28 February. */
export function addYears(dateKey: string, years: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const targetYear = (y || 2000) + years;
  const month = m || 1;
  const lastDay = new Date(Date.UTC(targetYear, month, 0)).getUTCDate();
  const day = Math.min(d || 1, lastDay);
  return `${targetYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatTime(
  iso: string | null | undefined,
  timeZone: string,
  locale: string,
): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso.slice(11, 16);
  }
}

export function formatHour(iso: string, timeZone: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      hour: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(11, 13);
  }
}

export function formatWeekday(
  dateKey: string,
  locale: string,
  style: "short" | "long" | "narrow" = "short",
): string {
  try {
    return new Intl.DateTimeFormat(locale, { weekday: style, timeZone: "UTC" }).format(
      parseDateKeyUtcNoon(dateKey),
    );
  } catch {
    return dateKey;
  }
}

export function formatDayMonth(dateKey: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(parseDateKeyUtcNoon(dateKey));
  } catch {
    return dateKey;
  }
}

export function formatMonthYear(dateKey: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(parseDateKeyUtcNoon(dateKey));
  } catch {
    return dateKey;
  }
}

/** "28 October 2016" — used by the archive block. */
export function formatArchiveDate(dateKey: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(parseDateKeyUtcNoon(dateKey));
  } catch {
    return dateKey;
  }
}

export function formatFullDate(iso: Date, timeZone: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(iso);
  } catch {
    return "";
  }
}

export function minutesBetween(startIso: string, endIso: string): number {
  return (new Date(endIso).getTime() - new Date(startIso).getTime()) / MS_MINUTE;
}

export function daylightMinutes(sunrise: string | null, sunset: string | null): number | null {
  if (!sunrise || !sunset) return null;
  const value = minutesBetween(sunrise, sunset);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

/** Position 0..1 of the sun between sunrise and sunset. Null outside daytime. */
export function sunProgress(
  sunrise: string | null,
  sunset: string | null,
  now = new Date(),
): number | null {
  if (!sunrise || !sunset) return null;
  const start = new Date(sunrise).getTime();
  const end = new Date(sunset).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  const progress = (now.getTime() - start) / (end - start);
  if (progress < 0 || progress > 1) return null;
  return progress;
}

export type AgoUnit = "minute" | "hour" | "day";

export function agoParts(
  iso: string | null | undefined,
  now = Date.now(),
): { value: number; unit: AgoUnit } | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return null;
  const diff = Math.max(0, now - time);
  if (diff < MS_MINUTE) return { value: 0, unit: "minute" };
  if (diff < MS_HOUR) return { value: Math.floor(diff / MS_MINUTE), unit: "minute" };
  if (diff < 86_400_000) return { value: Math.floor(diff / MS_HOUR), unit: "hour" };
  return { value: Math.floor(diff / 86_400_000), unit: "day" };
}

/** Hours of the day in a zone, 0..23, for the given instant. */
export function hourInTz(date: Date, timeZone: string): number {
  try {
    const parts = partsToMap(
      safeFormatter({ timeZone, hour: "2-digit", hour12: false }, "en-US").formatToParts(date),
    );
    return Number(parts.get("hour")) % 24;
  } catch {
    return date.getUTCHours();
  }
}

export { MS_HOUR, MS_MINUTE };
