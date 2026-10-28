"use client";

import { usePrefs } from "@/lib/client/prefs";
import {
  formatPercent,
  formatPrecip,
  formatTemp,
  formatWind,
} from "@/lib/format";
import { formatDayMonth, formatTime, formatWeekday } from "@/lib/time";
import type { DailyPoint } from "@/lib/types";
import type { MessageKey } from "@/lib/i18n";
import { directionKey, uvKey } from "@/lib/units";
import { RangeBar } from "./RangeBar";
import { WeatherIcon } from "./WeatherIcon";

interface DayRowProps {
  day: DailyPoint;
  index: number;
  globalMin: number;
  globalMax: number;
  timezone: string;
  open: boolean;
  onToggle: () => void;
  compact?: boolean;
}

export function DayRow({
  day,
  index,
  globalMin,
  globalMax,
  timezone,
  open,
  onToggle,
  compact = false,
}: DayRowProps) {
  const { prefs, t, iconPack } = usePrefs();
  const locale = prefs.locale;
  const average = (day.min + day.max) / 2;
  const direction = directionKey(day.windDirection);
  const uv = uvKey(day.uvMax);

  const label =
    index === 0 ? t("week.today") : index === 1 ? t("week.tomorrow") : formatWeekday(day.date, locale, "short");

  return (
    <li className={open ? "day-row is-open" : "day-row"} data-source={day.source}>
      <button
        type="button"
        className="day-main"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={`${label} · ${t(`cond.${day.kind}` as MessageKey)}`}
      >
        <span className="day-name">
          <strong>{label}</strong>
          <small>{formatDayMonth(day.date, locale)}</small>
        </span>
        <WeatherIcon
          kind={day.kind}
          isDay
          pack={iconPack}
          motion={prefs.motion}
          size={compact ? 30 : 38}
        />
        {compact ? null : <span className="day-cond">{t(`cond.${day.kind}` as MessageKey)}</span>}
        <span className="day-rain">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3s5.5 6 5.5 10a5.5 5.5 0 0 1-11 0C6.5 9 12 3 12 3Z" />
          </svg>
          {formatPercent(day.precipitationProbability, locale)}
        </span>
        <span className="day-min">{formatTemp(day.min, prefs.temperature, locale, { withUnit: false })}</span>
        <RangeBar
          min={day.min}
          max={day.max}
          average={average}
          globalMin={globalMin}
          globalMax={globalMax}
          source={day.source}
        />
        <span className="day-max">{formatTemp(day.max, prefs.temperature, locale, { withUnit: false })}</span>
        <svg className="day-chevron" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className="day-details">
          <dl>
            <div>
              <dt>{t("week.feelsRange")}</dt>
              <dd>
                {formatTemp(day.feelsMin, prefs.temperature, locale)} …{" "}
                {formatTemp(day.feelsMax, prefs.temperature, locale)}
              </dd>
            </div>
            <div>
              <dt>{t("week.uv")}</dt>
              <dd>{day.uvMax === null ? "—" : `${Math.round(day.uvMax)} · ${uv ? t(uv) : ""}`}</dd>
            </div>
            <div>
              <dt>{t("week.precipTotal")}</dt>
              <dd>{formatPrecip(day.precipitation, prefs.precipitation, locale)}</dd>
            </div>
            <div>
              <dt>{t("week.gusts")}</dt>
              <dd>{formatWind(day.windGustMax, prefs.wind, locale)}</dd>
            </div>
            <div>
              <dt>{t("week.humidity")}</dt>
              <dd>{formatPercent(day.humidityMean, locale)}</dd>
            </div>
            <div>
              <dt>{t("metric.wind")}</dt>
              <dd>
                {formatWind(day.windMax, prefs.wind, locale)}
                {direction ? ` · ${t(direction)}` : ""}
              </dd>
            </div>
          </dl>
          {day.source === "climate" ? (
            <p className="hint">{t("month.climateBadge")} · {formatDayMonth(day.date, locale)}</p>
          ) : (
            <p className="hint">
              {t("sun.sunrise")} {formatTime(day.sunrise, timezone, locale)} ·{" "}
              {t("sun.sunset")} {formatTime(day.sunset, timezone, locale)}
            </p>
          )}
        </div>
      ) : null}
    </li>
  );
}
