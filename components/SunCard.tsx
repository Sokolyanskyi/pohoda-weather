"use client";

import { usePrefs } from "@/lib/client/prefs";
import { formatDaylight } from "@/lib/format";
import { formatTime } from "@/lib/time";
import { useNow } from "@/lib/client/use-weather";
import { daylightMinutes, sunProgress } from "@/lib/time";
import type { DailyPoint } from "@/lib/types";

const ARC = { left: 12, right: 88, top: 10, bottom: 50 };

function arcPoint(progress: number): { x: number; y: number } {
  const x = ARC.left + (ARC.right - ARC.left) * progress;
  const controlY = ARC.bottom - (ARC.bottom - ARC.top) * 2;
  const y =
    (1 - progress) ** 2 * ARC.bottom +
    2 * (1 - progress) * progress * controlY +
    progress ** 2 * ARC.bottom;
  return { x, y };
}

export function SunCard({ day, timezone }: { day: DailyPoint | undefined; timezone: string }) {
  const { prefs, t } = usePrefs();
  const now = useNow(60_000);
  const progress = day ? sunProgress(day.sunrise, day.sunset, now) : null;
  const minutes = day ? daylightMinutes(day.sunrise, day.sunset) : null;
  const point = arcPoint(progress ?? 0);

  return (
    <article className="card sun-card">
      <header className="card-head">
        <h3>{t("sun.title")}</h3>
        <span className="chip chip-soft">
          {progress === null ? t("sun.down") : t("sun.up")}
        </span>
      </header>

      <div className="sun-arc">
        <svg viewBox="0 0 100 60" aria-hidden="true">
          <path
            className="sun-path"
            d={`M${ARC.left} ${ARC.bottom} Q50 ${ARC.bottom - (ARC.bottom - ARC.top) * 2} ${ARC.right} ${ARC.bottom}`}
          />
          <line className="sun-horizon" x1="6" y1={ARC.bottom} x2="94" y2={ARC.bottom} />
          {progress !== null ? (
            <g className="sun-dot" style={{ transform: `translate(${point.x}px, ${point.y}px)` }}>
              <circle r="4.6" className="sun-dot-halo" />
              <circle r="2.6" className="sun-dot-core" />
            </g>
          ) : null}
        </svg>
        <span className="sun-label sun-label-rise">{formatTime(day?.sunrise, timezone, prefs.locale)}</span>
        <span className="sun-label sun-label-set">{formatTime(day?.sunset, timezone, prefs.locale)}</span>
      </div>

      <dl className="sun-stats">
        <div>
          <dt>{t("sun.sunrise")}</dt>
          <dd>{formatTime(day?.sunrise, timezone, prefs.locale)}</dd>
        </div>
        <div>
          <dt>{t("sun.sunset")}</dt>
          <dd>{formatTime(day?.sunset, timezone, prefs.locale)}</dd>
        </div>
        <div>
          <dt>{t("sun.daylight")}</dt>
          <dd>{formatDaylight(minutes, prefs.locale)}</dd>
        </div>
      </dl>
    </article>
  );
}
