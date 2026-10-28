"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefs } from "@/lib/client/prefs";
import { placeSecondary } from "@/lib/places";
import type { Place } from "@/lib/types";
import { formatCoords } from "@/lib/format";
import { Modal } from "./Modal";

interface PlaceDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (place: Place) => void;
}

interface GeoPlace extends Place {
  population?: number;
}

export function PlaceDialog({ open, onClose, onSelect }: PlaceDialogProps) {
  const { prefs, t } = usePrefs();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [touched, setTouched] = useState(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
    setError(null);
    setTouched(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    setError(null);
    const timer = window.setTimeout(async () => {
      controller.current?.abort();
      const next = new AbortController();
      controller.current = next;
      try {
        const params = new URLSearchParams({
          q: trimmed,
          lang: prefs.locale,
          count: "8",
        });
        const response = await fetch(`/api/places?${params.toString()}`, {
          signal: next.signal,
        });
        if (!response.ok) throw new Error("search");
        const data = (await response.json()) as { results?: GeoPlace[] };
        if (!next.signal.aborted) {
          setResults(data.results ?? []);
          setTouched(true);
        }
      } catch {
        if (!next.signal.aborted) {
          setResults([]);
          setError(t("place.searchError"));
        }
      } finally {
        if (!next.signal.aborted) setSearching(false);
      }
    }, 340);
    return () => window.clearTimeout(timer);
  }, [query, open, prefs.locale, t]);

  const locate = () => {
    if (!navigator.geolocation) {
      setError(t("error.geoUnsupported"));
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Math.round(position.coords.latitude * 10000) / 10000;
        const lon = Math.round(position.coords.longitude * 10000) / 10000;
        let place: Place = {
          id: `geo:${lat},${lon}`,
          name: t("place.myLocation"),
          lat,
          lon,
        };
        try {
          const params = new URLSearchParams({
            lat: String(lat),
            lon: String(lon),
            lang: prefs.locale,
          });
          const response = await fetch(`/api/places/reverse?${params.toString()}`);
          if (response.ok) {
            const data = (await response.json()) as { place?: Place };
            if (data.place) place = { ...data.place, id: `geo:${lat},${lon}`, lat, lon };
          }
        } catch {
          // Coordinates alone are enough for the forecast.
        }
        setLocating(false);
        onSelect(place);
      },
      (geoError) => {
        setLocating(false);
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? t("error.geoDenied")
            : t("error.geoUnavailable"),
        );
      },
      { timeout: 12_000, maximumAge: 300_000, enableHighAccuracy: false },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("place.title")}
      closeLabel={t("common.close")}
    >
      <div className="place-search">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="search-icon">
          <circle cx="11" cy="11" r="7" />
          <path d="m16.5 16.5 4 4" />
        </svg>
        <input
          type="search"
          value={query}
          autoFocus
          placeholder={t("place.search")}
          aria-label={t("place.search")}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query ? (
          <button
            type="button"
            className="clear-btn"
            onClick={() => setQuery("")}
            aria-label={t("common.cancel")}
          >
            ×
          </button>
        ) : null}
      </div>

      <button type="button" className="locate-btn" onClick={locate} disabled={locating}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          <circle cx="12" cy="12" r="8" />
        </svg>
        {locating ? t("place.locating") : t("place.useLocation")}
      </button>

      {error ? <p className="form-error">{error}</p> : null}

      {query.trim().length < 2 ? (
        prefs.places.length > 0 ? (
          <div className="place-section">
            <h4>{t("place.recent")}</h4>
            <ul className="place-list">
              {prefs.places.map((place) => (
                <li key={place.id}>
                  <button type="button" onClick={() => onSelect(place)}>
                    <span className="place-main">
                      <strong>{place.name}</strong>
                      <small>{placeSecondary(place)}</small>
                    </span>
                    <span className="place-coords">
                      {formatCoords(place.lat, place.lon, prefs.locale)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null
      ) : (
        <div className="place-section">
          <h4>
            {searching ? t("place.searching") : t("place.results")}
            {!searching && touched && results.length > 0 ? ` · ${results.length}` : ""}
          </h4>
          {searching && results.length === 0 ? (
            <div className="place-skeleton" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          ) : null}
          {!searching && touched && results.length === 0 && !error ? (
            <p className="hint">{t("place.empty")}</p>
          ) : null}
          <ul className="place-list">
            {results.map((place) => (
              <li key={place.id}>
                <button type="button" onClick={() => onSelect(place)}>
                  <span className="place-main">
                    <strong>{place.name}</strong>
                    <small>{placeSecondary(place)}</small>
                  </span>
                  <span className="place-coords">
                    {formatCoords(place.lat, place.lon, prefs.locale)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
