"use client";

import { usePrefs } from "@/lib/client/prefs";
import { formatDaylight } from "@/lib/format";
import { formatTime } from "@/lib/time";
import { useNow } from "@/lib/client/use-weather";
import {
  daylightMinutes,
  moonPhase,
  moonPhaseName,
  sunProgress,
} from "@/lib/time";
import type { DailyPoint } from "@/lib/types";
import type { MessageKey } from "@/lib/i18n";

const ARC = { left: 8, right: 92, top: 10, bottom: 50 };
const MS_DAY = 86_400_000;

function arcPoint(progress: number): { x: number; y: number } {
  const x = ARC.left + (ARC.right - ARC.left) * progress;
  const controlY = ARC.bottom - (ARC.bottom - ARC.top) * 2;
  const y =
    (1 - progress) ** 2 * ARC.bottom +
    2 * (1 - progress) * progress * controlY +
    progress ** 2 * ARC.bottom;
  return { x, y };
}

/** SVG path for the lit part of the moon at a given phase. */
function moonLitPath(phase: number, radius: number): string {
  const p = ((phase % 1) + 1) % 1;
  const rx = Math.max(0.001, radius * Math.abs(Math.cos(2 * Math.PI * p)));
  if (p < 0.5) {
    const sweep = p < 0.25 ? 0 : 1;
    return `M0,${-radius} A${radius},${radius} 0 0 1 0,${radius} A${rx},${radius} 0 0 ${sweep} 0,${-radius} Z`;
  }
  const sweep = p < 0.75 ? 0 : 1;
  return `M0,${-radius} A${radius},${radius} 0 0 0 0,${radius} A${rx},${radius} 0 0 ${sweep} 0,${-radius} Z`;
}

/**
 * Progress of the night between sunset and the next sunrise, plus the times
 * shown at the two ends of the arc. Before dawn the night started yesterday,
 * so its beginning is today's sunset shifted back by a day.
 */
function nightArc(now: Date, day: DailyPoint | undefined, nextDay: DailyPoint | undefined) {
  const sunrise = day?.sunrise ? new Date(day.sunrise).getTime() : NaN;
  const sunset = day?.sunset ? new Date(day.sunset).getTime() : NaN;
  const nextSunrise = nextDay?.sunrise ? new Date(nextDay.sunrise).getTime() : NaN;
  if (!Number.isFinite(sunrise) || !Number.isFinite(sunset)) {
    return { progress: 0.5, startIso: day?.sunset ?? null, endIso: day?.sunrise ?? null };
  }
  const time = now.getTime();
  if (time >= sunset) {
    const end = Number.isFinite(nextSunrise) ? nextSunrise : sunrise + MS_DAY;
    const progress = (time - sunset) / (end - sunset);
    return {
      progress: Math.min(1, Math.max(0, progress)),
      startIso: day?.sunset ?? null,
      endIso: nextDay?.sunrise ?? null,
    };
  }
  const start = sunset - MS_DAY;
  const progress = (time - start) / (sunrise - start);
  return {
    progress: Math.min(1, Math.max(0, progress)),
    startIso: day?.sunset ?? null,
    endIso: day?.sunrise ?? null,
  };
}

export function SunCard({
  day,
  nextDay,
  timezone,
}: {
  day: DailyPoint | undefined;
  nextDay?: DailyPoint;
  timezone: string;
}) {
  const { prefs, t } = usePrefs();
  const now = useNow(15_000);
  const progress = day ? sunProgress(day.sunrise, day.sunset, now) : null;
  const night = progress === null;
  const nightInfo = nightArc(now, day, nextDay);
  const point = arcPoint(night ? nightInfo.progress : (progress ?? 0));
  const path = `M${ARC.left} ${ARC.bottom} Q50 ${ARC.bottom - (ARC.bottom - ARC.top) * 2} ${ARC.right} ${ARC.bottom}`;
  const minutes = day ? daylightMinutes(day.sunrise, day.sunset) : null;

  const moon = moonPhase(now);
  const phaseKey = `moon.phase.${moonPhaseName(moon.phase)}` as MessageKey;
  const startLabel = formatTime(night ? nightInfo.startIso : day?.sunrise, timezone, prefs.locale);
  const endLabel = formatTime(night ? nightInfo.endIso : day?.sunset, timezone, prefs.locale);

  return (
    <article className="card sun-card" data-motion={prefs.motion}>
      <header className="card-head">
        <h3>{t("sun.title")}</h3>
        <span className="chip chip-soft">{night ? t(phaseKey) : t("sun.up")}</span>
      </header>

      <div className="sun-arc">
        <svg
          className="sun-arc-svg"
          viewBox="0 0 100 60"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path className="sun-path" d={path} vectorEffect="non-scaling-stroke" />
          {!night && progress !== null ? (
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

        {night ? (
          <svg
            className="moon-dot"
            viewBox="-16 -16 32 32"
            style={{ left: `${point.x}%`, top: `${(point.y / 60) * 100}%` }}
            aria-hidden="true"
          >
            <defs>
              <clipPath id="moon-lit-clip">
                <path d={moonLitPath(moon.phase, 9)} />
              </clipPath>
            </defs>
            <circle className="moon-halo" r="15" />
            <circle className="moon-disc" r="9" />
            <path className="moon-lit" d={moonLitPath(moon.phase, 9)} />
            <g className="moon-craters" clipPath="url(#moon-lit-clip)">
              <circle cx="-2.6" cy="-2.2" r="1.6" />
              <circle cx="2.9" cy="1.4" r="1.1" />
              <circle cx="-0.8" cy="3.7" r="0.9" />
              <circle cx="3.3" cy="-3.6" r="0.7" />
            </g>
          </svg>
        ) : progress !== null ? (
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

        <span className="sun-label sun-label-rise">{startLabel}</span>
        <span className="sun-label sun-label-set">{endLabel}</span>
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
