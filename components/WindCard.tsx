"use client";

import type { CSSProperties } from "react";
import { usePrefs } from "@/lib/client/prefs";
import { formatWind } from "@/lib/format";
import { directionKey } from "@/lib/units";
import type { CurrentWeather } from "@/lib/types";

export function WindCard({ current }: { current: CurrentWeather }) {
  const { prefs, t } = usePrefs();
  const speed = current.windSpeed ?? 0;
  // 0..1 drives how far the tree and the grass bend; the period shrinks as
  // the wind picks up so a gale looks faster, not just wider.
  const strength = Math.max(0.08, Math.min(1, speed / 42));
  const duration = (4.4 - strength * 2.9).toFixed(2);
  const direction = directionKey(current.windDirection);

  return (
    <article
      className="card wind-card"
      data-motion={prefs.motion}
      style={
        {
          "--wind-strength": strength.toFixed(2),
          "--wind-duration": `${duration}s`,
        } as CSSProperties
      }
    >
      <header className="card-head">
        <h3>{t("metric.wind")}</h3>
        <span className="chip chip-soft">{direction ? t(direction) : "—"}</span>
      </header>

      <div className="wind-body">
        <div className="wind-art" aria-hidden="true">
          <svg viewBox="0 0 164 150">
            <line className="wind-ground" x1="8" y1="146" x2="156" y2="146" />

            <g className="wind-tree">
              <path
                className="wind-trunk"
                d="M80 146c.6-24 1.2-42 2-58h6c.8 16 1.4 34 2 58Z"
              />
              <g className="wind-crown">
                <ellipse cx="84" cy="52" rx="27" ry="31" />
                <ellipse cx="64" cy="70" rx="22" ry="24" />
                <ellipse cx="105" cy="68" rx="23" ry="26" />
                <ellipse cx="84" cy="84" rx="30" ry="21" />
              </g>
            </g>

            <g className="wind-grass">
              <path d="M52 146c0-7 1-12 3-17" />
              <path d="M60 146c0-5 2-10 4-14" />
              <path d="M68 146c0-8-1-13-3-18" />
              <path d="M96 146c0-7 1-12 3-17" />
              <path d="M104 146c0-5 2-10 4-14" />
              <path d="M112 146c0-8-1-13-3-18" />
            </g>
          </svg>
        </div>

        <div className="wind-readout">
          <strong>{formatWind(current.windSpeed, prefs.wind, prefs.locale)}</strong>
          <span>{direction ? t(direction) : "—"}</span>
          <small>
            {t("metric.gust")}: {formatWind(current.windGust, prefs.wind, prefs.locale)}
          </small>
        </div>
      </div>
    </article>
  );
}
