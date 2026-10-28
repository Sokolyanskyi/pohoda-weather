"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FORECAST_DAYS, REFRESH_MS } from "@/lib/config";
import type { Prefs, WeatherSnapshot } from "@/lib/types";

interface WeatherState {
  data: WeatherSnapshot | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  fetchedAt: number | null;
}

function buildUrl(prefs: Prefs): string {
  const params = new URLSearchParams({
    lat: String(prefs.place.lat),
    lon: String(prefs.place.lon),
    id: prefs.place.id,
    name: prefs.place.name,
    provider: prefs.provider,
    days: String(FORECAST_DAYS),
  });
  if (prefs.place.admin1) params.set("admin1", prefs.place.admin1);
  if (prefs.place.country) params.set("country", prefs.place.country);
  if (prefs.place.countryCode) params.set("countryCode", prefs.place.countryCode);
  if (prefs.place.timezone) params.set("timezone", prefs.place.timezone);
  const key = prefs.keys[prefs.provider];
  if (key) params.set("key", key);
  return `/api/weather?${params.toString()}`;
}

export function useWeather(prefs: Prefs, ready: boolean) {
  const [state, setState] = useState<WeatherState>({
    data: null,
    error: null,
    loading: true,
    refreshing: false,
    fetchedAt: null,
  });
  const controller = useRef<AbortController | null>(null);
  const inFlight = useRef(false);
  const hasData = useRef(false);
  hasData.current = Boolean(state.data);

  const load = useCallback(
    async (silent: boolean) => {
      if (!ready || inFlight.current) return;
      inFlight.current = true;
      controller.current?.abort();
      const next = new AbortController();
      controller.current = next;
      setState((current) => ({
        ...current,
        loading: !silent && !hasData.current,
        refreshing: silent || hasData.current,
        error: silent ? current.error : null,
      }));
      try {
        const response = await fetch(buildUrl(prefs), {
          signal: next.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) {
          let code = "unknown";
          try {
            const body = (await response.json()) as { error?: string };
            if (body.error) code = body.error;
          } catch {
            // Keep the generic code.
          }
          throw new Error(code);
        }
        const data = (await response.json()) as WeatherSnapshot;
        if (next.signal.aborted) return;
        setState({
          data,
          error: null,
          loading: false,
          refreshing: false,
          fetchedAt: Date.now(),
        });
      } catch (error) {
        if (next.signal.aborted) return;
        const code =
          error instanceof Error && error.message && error.message !== "Failed to fetch"
            ? error.message
            : "network";
        setState((current) => ({
          ...current,
          error: code,
          loading: false,
          refreshing: false,
        }));
      } finally {
        inFlight.current = false;
      }
    },
    [prefs, ready],
  );

  useEffect(() => {
    if (!ready) return;
    void load(false);
    return () => {
      controller.current?.abort();
      inFlight.current = false;
    };
  }, [load, ready]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setInterval(() => void load(true), REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const fetched = state.fetchedAt;
      if (!fetched || Date.now() - fetched > REFRESH_MS) void load(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load, ready, state.fetchedAt]);

  const refresh = useCallback(() => void load(true), [load]);

  return { ...state, refresh };
}

/** Clock used for the "local time" chip; ticks once a minute. */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}
