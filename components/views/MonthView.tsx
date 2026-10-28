"use client";

import { useState } from "react";
import { usePrefs } from "@/lib/client/prefs";
import { formatDayMonth, formatMonthYear } from "@/lib/time";
import { formatPercent, formatTemp } from "@/lib/format";
import { mean } from "@/lib/weather/shared";
import type { WeatherSnapshot } from "@/lib/types";
import { DayRow } from "../DayRow";

export function MonthView({ snapshot }: { snapshot: WeatherSnapshot }) {
  const { prefs, t } = usePrefs();
  const locale = prefs.locale;
  const [open, setOpen] = useState<string | null>(null);
  const days = snapshot.daily.slice(0, 30);
  const forecast = days.filter((day) => day.source === "forecast");
  const climate = days.filter((day) => day.source === "climate");

  const globalMin = Math.min(...days.map((day) => day.min));
  const globalMax = Math.max(...days.map((day) => day.max));
  const avgHigh = mean(days.map((day) => day.max)) ?? 0;
  const avgLow = mean(days.map((day) => day.min)) ?? 0;
  const wetDays = days.filter(
    (day) => day.precipitation >= 1 || (day.precipitationProbability ?? 0) >= 50,
  ).length;
  const warmest = days.reduce((best, day) => (day.max > best.max ? day : best), days[0]);
  const coldest = days.reduce((best, day) => (day.min < best.min ? day : best), days[0]);

  return (
    <div className="view view-month">
      <div className="view-head">
        <div>
          <span className="eyebrow">{formatMonthYear(days[0]?.date ?? "", locale)} — {formatMonthYear(days[days.length - 1]?.date ?? "", locale)}</span>
          <h2>{t("month.title")}</h2>
        </div>
      </div>

      <div className="summary-grid">
        <article className="card summary">
          <span>{t("month.avgHigh")}</span>
          <strong>{formatTemp(avgHigh, prefs.temperature, locale)}</strong>
          <small>{formatDayMonth(days[0]?.date ?? "", locale)} — {formatDayMonth(days[days.length - 1]?.date ?? "", locale)}</small>
        </article>
        <article className="card summary">
          <span>{t("month.avgLow")}</span>
          <strong>{formatTemp(avgLow, prefs.temperature, locale)}</strong>
          <small>{t("settings.provider.days", { days: days.length })}</small>
        </article>
        <article className="card summary">
          <span>{t("month.wetDays")}</span>
          <strong>{wetDays}</strong>
          <small>{formatPercent((wetDays / Math.max(1, days.length)) * 100, locale)}</small>
        </article>
        <article className="card summary">
          <span>{t("month.warmest")}</span>
          <strong>{formatTemp(warmest?.max, prefs.temperature, locale)}</strong>
          <small>
            {warmest ? `${formatDayMonth(warmest.date, locale)} · ${t("month.coldest")} ${formatTemp(coldest?.min, prefs.temperature, locale)}` : ""}
          </small>
        </article>
      </div>

      <section className="card day-list-card" aria-label={t("month.title")}>
        <header className="month-section-head">
          <div>
            <h3>{t("month.forecastSection", { days: forecast.length })}</h3>
            <p className="card-sub">{t("month.forecastBadge")}</p>
          </div>
          <span className="chip chip-soft">{formatDayMonth(forecast[0]?.date ?? "", locale)}</span>
        </header>
        <ul className="day-list">
          {forecast.map((day, index) => (
            <DayRow
              key={day.date}
              day={day}
              index={index}
              globalMin={globalMin}
              globalMax={globalMax}
              timezone={snapshot.timezone}
              open={open === day.date}
              onToggle={() => setOpen(open === day.date ? null : day.date)}
              compact
            />
          ))}
        </ul>

        {climate.length > 0 ? (
          <>
            <header className="month-section-head climate">
              <div>
                <h3>{t("month.climateSection", { days: climate.length })}</h3>
                <p className="card-sub">{t("month.climateNote", { days: forecast.length })}</p>
              </div>
              <span className="chip chip-warn">{t("month.climateBadge")}</span>
            </header>
            <ul className="day-list">
              {climate.map((day, index) => (
                <DayRow
                  key={day.date}
                  day={day}
                  index={forecast.length + index}
                  globalMin={globalMin}
                  globalMax={globalMax}
                  timezone={snapshot.timezone}
                  open={open === day.date}
                  onToggle={() => setOpen(open === day.date ? null : day.date)}
                  compact
                />
              ))}
            </ul>
          </>
        ) : null}

        <p className="legend">{t("month.legend")}</p>
      </section>
    </div>
  );
}
