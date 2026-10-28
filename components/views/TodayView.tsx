"use client";

import { usePrefs } from "@/lib/client/prefs";
import { useNow } from "@/lib/client/use-weather";
import {
  formatPercent,
  formatPressure,
  formatTemp,
  formatVisibility,
  formatWind,
  tempValue,
} from "@/lib/format";
import {
  directionKey,
  temperatureTone,
  uvKey,
} from "@/lib/units";
import { formatFullDate, formatHour, formatTime } from "@/lib/time";
import type { WeatherSnapshot } from "@/lib/types";
import type { MessageKey } from "@/lib/i18n";
import type { ReactNode } from "react";
import { useState } from "react";
import { RadarDialog } from "../RadarDialog";
import { SunCard } from "../SunCard";
import { ThisDayCard } from "../ThisDayCard";
import { WeatherIcon } from "../WeatherIcon";
import { WindCard } from "../WindCard";

function DetailCard({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <article className="card detail">
      <span className="detail-label">{label}</span>
      <strong className="detail-value">{value}</strong>
      {hint ? <span className="detail-hint">{hint}</span> : null}
      {children}
    </article>
  );
}

function Meter({ value, tone }: { value: number; tone?: string }) {
  return (
    <span className="meter" data-tone={tone}>
      <span style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </span>
  );
}

export function TodayView({ snapshot }: { snapshot: WeatherSnapshot }) {
  const { prefs, t, iconPack } = usePrefs();
  const now = useNow(30_000);
  const [radarOpen, setRadarOpen] = useState(false);
  const { current, timezone, daily, hourly } = snapshot;
  const today = daily[0];
  const locale = prefs.locale;

  const nextHours = hourly.slice(0, 24);
  const rainChance =
    today?.precipitationProbability ??
    Math.max(0, ...nextHours.map((hour) => hour.precipitationProbability ?? 0));
  const direction = directionKey(current.windDirection);
  const uv = uvKey(current.uvIndex);
  const tone = temperatureTone(current.temperature);

  return (
    <div className="view view-today">
      <article className="card hero" data-tone={tone}>
        <div className="hero-main">
          <div className="hero-top">
            <span className="eyebrow">{formatFullDate(now, timezone, locale)}</span>
            <div className="hero-top-right">
              <span className="hero-live">
                <i aria-hidden="true" />
                {t("hero.now")} · {formatTime(now.toISOString(), timezone, locale)}
              </span>
              <button
                type="button"
                className="hero-radar"
                onClick={() => setRadarOpen(true)}
                aria-haspopup="dialog"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="8.5" />
                  <circle cx="12" cy="12" r="4.5" />
                  <path d="M12 12 18.5 5.5" />
                </svg>
                {t("radar.open")}
              </button>
            </div>
          </div>

          <div className="hero-temp-row">
            <WeatherIcon
              kind={current.kind}
              isDay={current.isDay}
              pack={iconPack}
              motion={prefs.motion}
              size={104}
              className="hero-icon"
            />
            <div className="hero-temp-wrap">
              <span className="hero-temp">{tempValue(current.temperature, prefs.temperature, locale)}</span>
              <span className="hero-unit">
                °{prefs.temperature === "f" ? "F" : "C"}
              </span>
            </div>
          </div>

          <h2 className="hero-cond">{t(`cond.${current.kind}` as MessageKey)}</h2>
          <p className="hero-feels">
            {t("hero.feels", {
              temp: formatTemp(current.feelsLike ?? current.temperature, prefs.temperature, locale),
            })}
          </p>

          <div className="hero-meta">
            <span>
              <i className="arrow up" aria-hidden="true" />
              {t("hero.high", { temp: formatTemp(today?.max, prefs.temperature, locale) })}
            </span>
            <span>
              <i className="arrow down" aria-hidden="true" />
              {t("hero.low", { temp: formatTemp(today?.min, prefs.temperature, locale) })}
            </span>
          </div>
        </div>

        <div className="hero-side">
          <div className="hero-stat">
            <span className="hero-stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M7 15a4.5 4.5 0 0 1 .6-9 6 6 0 0 1 11.2 1.3A3.9 3.9 0 0 1 18 15Z" />
                <path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2" />
              </svg>
            </span>
            <span>
              <small>{t("metric.precipChance")}</small>
              <strong>{formatPercent(rainChance, locale)}</strong>
            </span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h8" />
              </svg>
            </span>
            <span>
              <small>{t("metric.wind")}</small>
              <strong>{formatWind(current.windSpeed, prefs.wind, locale)}</strong>
            </span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z" />
              </svg>
            </span>
            <span>
              <small>{t("metric.humidity")}</small>
              <strong>{formatPercent(current.humidity, locale)}</strong>
            </span>
          </div>
        </div>
      </article>

      <section className="card strip" aria-labelledby="hourly-title">
        <header className="card-head">
          <div>
            <h3 id="hourly-title">{t("hourly.title")}</h3>
            <p className="card-sub">{t("hourly.subtitle")}</p>
          </div>
          <span className="chip chip-soft">{nextHours.length} h</span>
        </header>
        <div className="hourly-scroll">
          {nextHours.map((hour, index) => (
            <div className="hour" key={hour.time}>
              <span className="hour-time">
                {index === 0
                  ? t("hourly.now")
                  : formatHour(hour.time, timezone, locale)}
              </span>
              <WeatherIcon
                kind={hour.kind}
                isDay={hour.isDay}
                pack={iconPack}
                motion={prefs.motion}
                size={34}
              />
              <span className="hour-temp">{formatTemp(hour.temperature, prefs.temperature, locale, { withUnit: false })}</span>
              <span className={hour.precipitationProbability ? "hour-rain" : "hour-rain is-dry"}>
                {hour.precipitationProbability === null
                  ? "·"
                  : `${Math.round(hour.precipitationProbability)}%`}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="details-section" aria-labelledby="details-title">
        <div className="section-head">
          <h3 id="details-title">{t("details.title")}</h3>
          <span className="section-rule" aria-hidden="true" />
        </div>
        <div className="details-grid">
          <DetailCard
            label={t("metric.wind")}
            value={formatWind(current.windSpeed, prefs.wind, locale)}
            hint={direction ? t(direction) : undefined}
          >
            <span
              className="wind-arrow"
              style={{ transform: `rotate(${(current.windDirection ?? 0) + 180}deg)` }}
              aria-hidden="true"
            >
              ↑
            </span>
          </DetailCard>
          <DetailCard
            label={t("metric.gust")}
            value={formatWind(current.windGust, prefs.wind, locale)}
            hint={t("metric.wind")}
          />
          <DetailCard
            label={t("metric.humidity")}
            value={formatPercent(current.humidity, locale)}
          >
            <Meter value={current.humidity ?? 0} />
          </DetailCard>
          <DetailCard
            label={t("metric.pressure")}
            value={formatPressure(current.pressure, prefs.pressure, locale)}
          />
          <DetailCard
            label={t("metric.uv")}
            value={current.uvIndex === null ? "—" : String(Math.round(current.uvIndex))}
            hint={uv ? t(uv) : undefined}
          >
            <Meter value={((current.uvIndex ?? 0) / 11) * 100} tone={uv ?? undefined} />
          </DetailCard>
          <DetailCard
            label={t("metric.visibility")}
            value={formatVisibility(current.visibility, prefs.precipitation, locale)}
          />
          <DetailCard
            label={t("metric.clouds")}
            value={formatPercent(current.cloudCover, locale)}
          >
            <Meter value={current.cloudCover ?? 0} tone="cloud" />
          </DetailCard>
          <DetailCard
            label={t("metric.dewPoint")}
            value={formatTemp(current.dewPoint, prefs.temperature, locale)}
          />
        </div>
      </section>

      <div className="two-col">
        <SunCard day={today} timezone={timezone} />
        <WindCard current={current} />
      </div>

      {today ? (
        <ThisDayCard
          date={today.date}
          today={today}
          lat={snapshot.place.lat}
          lon={snapshot.place.lon}
        />
      ) : null}

      <RadarDialog
        open={radarOpen}
        onClose={() => setRadarOpen(false)}
        place={snapshot.place}
      />
    </div>
  );
}
