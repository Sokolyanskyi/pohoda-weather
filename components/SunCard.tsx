"use client";

import { usePrefs } from "@/lib/client/prefs";
import { formatDaylight } from "@/lib/format";
import { formatTime } from "@/lib/time";
import { useNow } from "@/lib/client/use-weather";
import { daylightMinutes, sunProgress } from "@/lib/time";
import type { DailyPoint } from "@/lib/types";

const ARC = { left: 8, right: 92, top: 10, bottom: 50 };

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
  const now = useNow(15_000);
  const progress = day ? sunProgress(day.sunrise, day.sunset, now) : null;
  const minutes = day ? daylightMinutes(day.sunrise, day.sunset) : null;
  const point = arcPoint(progress ?? 0);
  const path = `M${ARC.left} ${ARC.bottom} Q50 ${ARC.bottom - (ARC.bottom - ARC.top) * 2} ${ARC.right} ${ARC.bottom}`;

  return (
    <article className="card sun-card">
      <header className="card-head">
        <h3>{t("sun.title")}</h3>
        <span className="chip chip-soft">
          {progress === null ? t("sun.down") : t("sun.up")}
        </span>
      </header>

      <div className="sun-arc">
        <svg
          className="sun-arc-svg"
          viewBox="0 0 100 60"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path className="sun-path" d={path} vectorEffect="non-scaling-stroke" />
          {progress !== null ? (
            <path
              className="sun-progress"
              d={path}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - progress}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          <line
            className="sun-horizon"
            x1="4"
            y1={ARC.bottom}
            x2="96"
            y2={ARC.bottom}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span className="sun-edge sun-edge-rise" aria-hidden="true" />
        <span className="sun-edge sun-edge-set" aria-hidden="true" />
        {progress !== null ? (
          <svg
            className="sun-dot"
            viewBox="-13 -13 26 26"
            style={{ left: `${point.x}%`, top: `${(point.y / 60) * 100}%` }}
            aria-hidden="true"
          >
            <circle r="9" className="sun-dot-halo" />
            <g className="sun-dot-rays">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <line
                  key={angle}
                  x1="0"
                  y1="-6.4"
                  x2="0"
                  y2="-9.4"
                  transform={`rotate(${angle})`}
                />
              ))}
            </g>
            <circle r="3.4" className="sun-dot-core" />
          </svg>
        ) : null}
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
