"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrefs } from "@/lib/client/prefs";
import type { Place } from "@/lib/types";
import { Modal } from "./Modal";

type RadarLayer = "radar" | "wind" | "temp";

const LAYERS: RadarLayer[] = ["radar", "wind", "temp"];

const OVERLAY: Record<RadarLayer, { overlay: string; product: string }> = {
  radar: { overlay: "radar", product: "radar" },
  wind: { overlay: "wind", product: "ecmwf" },
  temp: { overlay: "temp", product: "ecmwf" },
};

const WIND_UNIT: Record<string, string> = { kmh: "km/h", ms: "m/s", mph: "mph" };

function buildUrl(layer: RadarLayer, place: Place, locale: string, windUnit: string, tempUnit: string) {
  const params = new URLSearchParams({
    lat: String(place.lat),
    lon: String(place.lon),
    zoom: "9",
    level: "surface",
    overlay: OVERLAY[layer].overlay,
    product: OVERLAY[layer].product,
    menu: "",
    message: "",
    marker: "true",
    calendar: "now",
    pressure: "",
    type: "map",
    location: "coordinates",
    metricWind: WIND_UNIT[windUnit] ?? "km/h",
    metricTemp: tempUnit === "f" ? "°F" : "°C",
    radarRange: "-1",
    lang: locale,
  });
  return `https://embed.windy.com/embed2.html?${params.toString()}`;
}

function LayerIcon({ id }: { id: RadarLayer }) {
  if (id === "wind") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h8" />
      </svg>
    );
  }
  if (id === "temp") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z" />
        <path d="M12 9v6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 12 18.5 5.5" />
    </svg>
  );
}

interface RadarDialogProps {
  open: boolean;
  onClose: () => void;
  place: Place;
}

export function RadarDialog({ open, onClose, place }: RadarDialogProps) {
  const { prefs, t } = usePrefs();
  const [layer, setLayer] = useState<RadarLayer>("radar");
  const [loading, setLoading] = useState(true);

  const src = useMemo(
    () => buildUrl(layer, place, prefs.locale, prefs.wind, prefs.temperature),
    [layer, place, prefs.locale, prefs.wind, prefs.temperature],
  );

  useEffect(() => {
    if (open) setLoading(true);
  }, [open, src]);

  const external = `https://www.windy.com/${place.lat.toFixed(3)}/${place.lon.toFixed(3)}?${OVERLAY[layer].overlay},${place.lat.toFixed(3)},${place.lon.toFixed(3)},9`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("radar.title")}
      description={t("radar.description", { place: place.name })}
      closeLabel={t("radar.close")}
      size="lg"
    >
      <div className="radar">
        <div className="radar-layers" role="tablist" aria-label={t("radar.layers")}>
          {LAYERS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={layer === id}
              className="radar-layer"
              onClick={() => setLayer(id)}
            >
              <LayerIcon id={id} />
              {t(`radar.layer.${id}` as "radar.layer.radar")}
            </button>
          ))}
        </div>

        <div className="radar-frame-wrap">
          <iframe
            key={src}
            src={src}
            title={t("radar.frame", { place: place.name })}
            className="radar-frame"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allow="fullscreen"
            onLoad={() => setLoading(false)}
          />
          {loading ? (
            <div className="radar-loading" aria-live="polite">
              {t("radar.loading")}
            </div>
          ) : null}
        </div>

        <p className="radar-hint">{t("radar.hint")}</p>

        <div className="radar-foot">
          <span>{t("radar.source")}</span>
          <a href={external} target="_blank" rel="noreferrer">
            {t("radar.openWindy")}
          </a>
        </div>
      </div>
    </Modal>
  );
}
