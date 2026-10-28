"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PREFS_STORAGE_KEY } from "@/lib/client/storage";
import { detectLocale, isLocale, translate, type MessageKey, type MessageVars } from "@/lib/i18n";
import { FALLBACK_PLACE, guessPlace, samePlace } from "@/lib/places";
import { applyTheme, detectTheme, isTheme, type ThemeId } from "@/lib/theme";
import type {
  MotionLevel,
  Place,
  PrecipUnit,
  Prefs,
  PressureUnit,
  ProviderId,
  TemperatureUnit,
  WindUnit,
} from "@/lib/types";
import { isProviderId } from "@/lib/weather/providers";

export const ICON_PACKS = [
  "outline",
  "duotone",
  "solid",
  "clay",
  "neon",
  "pixel",
  "emoji",
  "glyph",
] as const;

export type IconPack = (typeof ICON_PACKS)[number];

const ICON_PACK_SET = new Set<string>(ICON_PACKS);

export function isIconPack(value: unknown): value is IconPack {
  return typeof value === "string" && ICON_PACK_SET.has(value);
}

const MOTION: MotionLevel[] = ["full", "calm", "off"];
const TEMPERATURES: TemperatureUnit[] = ["c", "f"];
const WINDS: WindUnit[] = ["kmh", "ms", "mph"];
const PRESSURES: PressureUnit[] = ["hpa", "mmhg", "inhg"];
const PRECIP: PrecipUnit[] = ["mm", "in"];

export function basePrefs(): Prefs {
  return {
    locale: "en",
    theme: "daylight",
    iconPack: "duotone",
    provider: "open-meteo",
    place: FALLBACK_PLACE,
    places: [],
    temperature: "c",
    wind: "kmh",
    pressure: "hpa",
    precipitation: "mm",
    motion: "full",
    keys: {},
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function validPlace(value: unknown): Place | null {
  const raw = asRecord(value);
  const lat = Number(raw.lat);
  const lon = Number(raw.lon);
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : `geo:${lat},${lon}`,
    name: name.slice(0, 120),
    admin1: typeof raw.admin1 === "string" ? raw.admin1.slice(0, 120) : undefined,
    country: typeof raw.country === "string" ? raw.country.slice(0, 120) : undefined,
    countryCode:
      typeof raw.countryCode === "string" ? raw.countryCode.slice(0, 8) : undefined,
    lat,
    lon,
    timezone: typeof raw.timezone === "string" ? raw.timezone.slice(0, 80) : undefined,
  };
}

function normalize(input: unknown, fallback: Prefs): Prefs {
  const raw = asRecord(input);
  const place = validPlace(raw.place) ?? fallback.place;
  const places = Array.isArray(raw.places)
    ? raw.places
        .map(validPlace)
        .filter((item): item is Place => Boolean(item))
        .slice(0, 8)
    : [];

  const keys: Partial<Record<ProviderId, string>> = {};
  const rawKeys = asRecord(raw.keys);
  for (const [id, value] of Object.entries(rawKeys)) {
    if (isProviderId(id) && typeof value === "string" && value.trim()) {
      keys[id] = value.trim().slice(0, 200);
    }
  }

  return {
    locale: isLocale(raw.locale) ? raw.locale : fallback.locale,
    theme: isTheme(raw.theme) ? raw.theme : fallback.theme,
    iconPack: isIconPack(raw.iconPack) ? raw.iconPack : fallback.iconPack,
    provider: isProviderId(raw.provider) ? raw.provider : fallback.provider,
    place,
    places,
    temperature: TEMPERATURES.includes(raw.temperature as TemperatureUnit)
      ? (raw.temperature as TemperatureUnit)
      : fallback.temperature,
    wind: WINDS.includes(raw.wind as WindUnit) ? (raw.wind as WindUnit) : fallback.wind,
    pressure: PRESSURES.includes(raw.pressure as PressureUnit)
      ? (raw.pressure as PressureUnit)
      : fallback.pressure,
    precipitation: PRECIP.includes(raw.precipitation as PrecipUnit)
      ? (raw.precipitation as PrecipUnit)
      : fallback.precipitation,
    motion: MOTION.includes(raw.motion as MotionLevel)
      ? (raw.motion as MotionLevel)
      : fallback.motion,
    keys,
  };
}

interface PrefsContextValue {
  prefs: Prefs;
  ready: boolean;
  theme: ThemeId;
  iconPack: IconPack;
  update: (patch: Partial<Prefs>) => void;
  setPlace: (place: Place) => void;
  addRecentPlace: (place: Place) => void;
  reset: () => void;
  t: (key: MessageKey, vars?: MessageVars) => string;
}

const PrefsContext = createContext<PrefsContextValue | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(basePrefs);
  const [ready, setReady] = useState(false);
  const latest = useRef(prefs);
  latest.current = prefs;

  useEffect(() => {
    let stored: unknown = null;
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
      stored = raw ? JSON.parse(raw) : null;
    } catch {
      stored = null;
    }
    const fallback: Prefs = {
      ...basePrefs(),
      locale: detectLocale(),
      theme: detectTheme(),
      place: guessPlace(),
    };
    const next = normalize(stored, fallback);
    setPrefs(next);
    applyTheme(next.theme as ThemeId);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Storage can be full or blocked; the app still works in memory.
    }
    applyTheme(prefs.theme as ThemeId);
    if (typeof document !== "undefined") {
      document.documentElement.lang = prefs.locale;
    }
  }, [prefs, ready]);

  const update = useCallback((patch: Partial<Prefs>) => {
    setPrefs((current) => ({ ...current, ...patch }));
  }, []);

  const addRecentPlace = useCallback((place: Place) => {
    setPrefs((current) => ({
      ...current,
      places: [place, ...current.places.filter((item) => !samePlace(item, place))].slice(0, 6),
    }));
  }, []);

  const setPlace = useCallback((place: Place) => {
    setPrefs((current) => ({
      ...current,
      place,
      places: [place, ...current.places.filter((item) => !samePlace(item, place))].slice(0, 6),
    }));
  }, []);

  const reset = useCallback(() => {
    setPrefs({
      ...basePrefs(),
      locale: detectLocale(),
      theme: detectTheme(),
      place: guessPlace(),
    });
  }, []);

  const value = useMemo<PrefsContextValue>(() => {
    return {
      prefs,
      ready,
      theme: prefs.theme as ThemeId,
      iconPack: prefs.iconPack as IconPack,
      update,
      setPlace,
      addRecentPlace,
      reset,
      t: (key, vars) => translate(prefs.locale, key, vars),
    };
  }, [prefs, ready, update, setPlace, addRecentPlace, reset]);

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): PrefsContextValue {
  const value = useContext(PrefsContext);
  if (!value) throw new Error("usePrefs must be used inside PrefsProvider");
  return value;
}

export function useT() {
  return usePrefs().t;
}
