"use client";

import { usePrefs } from "@/lib/client/prefs";
import { formatPercent, formatWind, tempValue } from "@/lib/format";
import { directionKey } from "@/lib/units";
import { formatWeekday } from "@/lib/time";
import type { DailyPoint } from "@/lib/types";
import { WeatherIcon } from "./WeatherIcon";

const PLOT = 152;

export function WeekChart({ days }: { days: DailyPoint[] }) {
  const { prefs, t, iconPack } = usePrefs();
  const locale = prefs.locale;

  if (days.length === 0) return null;

  const low = Math.min(...days.map((day) => day.min));
  const high = Math.max(...days.map((day) => day.max));
  const span = Math.max(1, high - low);

  return (
    <section className="card week-chart" aria-label={t("week.title")}>
      <header className="card-head">
        <div>
          <h3>{t("week.summary")}</h3>
        </div>
        <span className="chip chip-soft">
          {t("settings.provider.days", { days: days.length })}
        </span>
      </header>

      <div className="wc-scroll">
        <div className="wc-grid">
          {days.map((day) => {
            const bottom = ((day.min - low) / span) * PLOT;
            const height = Math.max(8, ((day.max - day.min) / span) * PLOT);
            const average = ((day.min + day.max) / 2 - low) / span;
            const direction = directionKey(day.windDirection);

            return (
              <div className="wc-col" key={day.date}>
                <div className="wc-plot">
                  <span
                    className="wc-bar"
                    style={{ bottom: `${bottom}px`, height: `${height}px` }}
                  >
                    <i
                      className="wc-avg"
                      style={{ bottom: `${Math.max(0, Math.min(100, average * 100))}%` }}
                    />
                  </span>
                  <span className="wc-max" style={{ bottom: `${bottom + height + 7}px` }}>
                    {tempValue(day.max, prefs.temperature, locale)}°
                  </span>
                  <span className="wc-min" style={{ bottom: `${bottom - 22}px` }}>
                    {tempValue(day.min, prefs.temperature, locale)}°
                  </span>
                </div>

                <span className="wc-rain">
                  {formatPercent(day.precipitationProbability, locale)}
                </span>

                <WeatherIcon
                  kind={day.kind}
                  isDay
                  pack={iconPack}
                  motion={prefs.motion}
                  size={30}
                />

                <span className="wc-wind">{formatWind(day.windMax, prefs.wind, locale)}</span>

                <span
                  className="wc-arrow"
                  title={direction ? t(direction) : undefined}
                  aria-label={direction ? t(direction) : undefined}
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    style={{ transform: `rotate(${(day.windDirection ?? 0) + 180}deg)` }}
                  >
                    <path d="M12 20V5M6 11l6-6 6 6" />
                  </svg>
                </span>

                <span className="wc-day">{formatWeekday(day.date, locale, "short")}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
