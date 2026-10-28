"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrefs } from "@/lib/client/prefs";
import { formatPrecip, formatTemp, formatWind } from "@/lib/format";
import type { MessageKey } from "@/lib/i18n";
import { formatArchiveDate, formatDayMonth } from "@/lib/time";
import type { DailyPoint } from "@/lib/types";
import type { HistoryYear } from "@/lib/history";
import { directionKey } from "@/lib/units";
import { WeatherIcon } from "./WeatherIcon";

interface ThisDayCardProps {
  /** Today's local calendar date, YYYY-MM-DD. */
  date: string;
  today: DailyPoint | undefined;
  lat: number;
  lon: number;
}

function yearsKey(locale: string, years: number): MessageKey {
  let category: Intl.LDMLPluralRule = "other";
  try {
    category = new Intl.PluralRules(locale).select(years);
  } catch {
    category = "other";
  }
  const supported = ["one", "few", "many", "other"];
  const suffix = supported.includes(category) ? category : "other";
  return `history.years.${suffix}` as MessageKey;
}

export function ThisDayCard({ date, today, lat, lon }: ThisDayCardProps) {
  const { prefs, t, iconPack } = usePrefs();
  const locale = prefs.locale;
  const [open, setOpen] = useState(false);
  const [years, setYears] = useState<HistoryYear[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState(1);

  useEffect(() => {
    if (!open || years !== null || failed) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      date,
    });
    fetch(`/api/history?${params.toString()}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("request"))))
      .then((payload: { years?: HistoryYear[] }) => {
        if (controller.signal.aborted) return;
        setYears(Array.isArray(payload.years) ? payload.years : []);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setFailed(true);
      });
    return () => controller.abort();
  }, [open, years, failed, lat, lon, date]);

  const active = useMemo(
    () => years?.find((year) => year.yearsAgo === selected) ?? years?.[0] ?? null,
    [years, selected],
  );

  const delta = useMemo(() => {
    if (!active || !today) return null;
    const then = (active.max + active.min) / 2;
    const now = (today.max + today.min) / 2;
    const diff = then - now;
    const scaled = prefs.temperature === "f" ? diff * 1.8 : diff;
    const rounded = Math.round(scaled);
    if (Math.abs(rounded) < 1) return t("history.same");
    const amount = `${Math.abs(rounded)}°`;
    return rounded > 0 ? t("history.warmer", { diff: amount }) : t("history.colder", { diff: amount });
  }, [active, today, prefs.temperature, t]);

  return (
    <section className={open ? "card history-card is-open" : "card history-card"}>
      <button
        type="button"
        className="history-toggle"
        aria-expanded={open}
        aria-controls="history-body"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="history-toggle-text">
          <strong>{t("history.title")}</strong>
          <span className="card-sub">{t("history.subtitle", { date: formatDayMonth(date, locale) })}</span>
        </span>
        <span className="chip chip-soft">{t("history.source")}</span>
        <svg className="history-chevron" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className="history-body" id="history-body">
          {failed ? (
            <p className="history-empty">{t("history.empty")}</p>
          ) : years === null ? (
            <p className="history-empty">{t("history.loading")}</p>
          ) : years.length === 0 ? (
            <p className="history-empty">{t("history.empty")}</p>
          ) : (
            <>
              <div className="history-tabs" role="tablist" aria-label={t("history.title")}>
                {years.map((year) => (
                  <button
                    key={year.yearsAgo}
                    type="button"
                    role="tab"
                    aria-selected={year.yearsAgo === active?.yearsAgo}
                    className={year.yearsAgo === active?.yearsAgo ? "history-tab is-active" : "history-tab"}
                    onClick={() => setSelected(year.yearsAgo)}
                  >
                    {t(yearsKey(locale, year.yearsAgo), { n: year.yearsAgo })}
                  </button>
                ))}
              </div>

              {active ? (
                <div className="history-panel">
                  <WeatherIcon
                    kind={active.kind}
                    isDay
                    pack={iconPack}
                    motion={prefs.motion}
                    size={56}
                  />
                  <div className="history-main">
                    <strong>{formatArchiveDate(active.date, locale)}</strong>
                    <span>{t(`cond.${active.kind}` as MessageKey)}</span>
                    {delta ? <small>{delta}</small> : null}
                  </div>
                  <dl className="history-stats">
                    <div>
                      <dt>{t("history.high")}</dt>
                      <dd>{formatTemp(active.max, prefs.temperature, locale)}</dd>
                    </div>
                    <div>
                      <dt>{t("history.low")}</dt>
                      <dd>{formatTemp(active.min, prefs.temperature, locale)}</dd>
                    </div>
                    <div>
                      <dt>{t("week.precipTotal")}</dt>
                      <dd>{formatPrecip(active.precipitation, prefs.precipitation, locale)}</dd>
                    </div>
                    <div>
                      <dt>{t("metric.wind")}</dt>
                      <dd>
                        {formatWind(active.windMax, prefs.wind, locale)}
                        {directionKey(active.windDirection)
                          ? ` · ${t(directionKey(active.windDirection) as MessageKey)}`
                          : ""}
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
