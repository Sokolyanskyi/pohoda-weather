"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefs } from "@/lib/client/prefs";
import { formatDaylight } from "@/lib/format";
import { formatTime } from "@/lib/time";
import { useNow } from "@/lib/client/use-weather";
import { arcGeometry, arcPath, arcPoint, arcSegment } from "@/lib/arc";
import {
  daylightMinutes,
  moonPhase,
  moonPhaseName,
  sunProgress,
} from "@/lib/time";
import type { DailyPoint } from "@/lib/types";
import type { MessageKey } from "@/lib/i18n";

const MS_DAY = 86_400_000;

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

/** Rendered size of the arc box, so the drawing can stay in real pixels. */
function useArcBox() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      setBox((current) =>
        current &&
        Math.abs(current.width - rect.width) < 0.5 &&
        Math.abs(current.height - rect.height) < 0.5
          ? current
          : { width: rect.width, height: rect.height },
      );
    };

    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, box] as const;
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
  const [arcRef, box] = useArcBox();
  const progress = day ? sunProgress(day.sunrise, day.sunset, now) : null;
  const night = progress === null;
  const nightInfo = nightArc(now, day, nextDay);
  const position = night ? nightInfo.progress : (progress ?? 0);
  const geometry = box ? arcGeometry(box.width, box.height) : null;
  const point = geometry ? arcPoint(geometry, position) : null;
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

      <div className="sun-arc" ref={arcRef}>
        {geometry && box ? (
          <svg
            className="sun-arc-svg"
            viewBox={`0 0 ${box.width} ${box.height}`}
            aria-hidden="true"
          >
            <path className="sun-path" d={arcPath(geometry)} />
            {!night && progress !== null ? (
              <path className="sun-progress" d={arcSegment(geometry, progress)} />
            ) : null}
            <line
              className="sun-horizon"
              x1={box.width * 0.04}
              y1={geometry.y0}
              x2={box.width * 0.96}
              y2={geometry.y0}
            />
          </svg>
        ) : null}
        <span className="sun-edge sun-edge-rise" aria-hidden="true" />
        <span className="sun-edge sun-edge-set" aria-hidden="true" />

        {box && point ? (
          night ? (
            <svg
              className="moon-dot"
              viewBox="-16 -16 32 32"
              style={{ left: `${(point.x / box.width) * 100}%`, top: `${(point.y / box.height) * 100}%` }}
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
          ) : (
            <svg
              className="sun-dot"
              viewBox="-13 -13 26 26"
              style={{ left: `${(point.x / box.width) * 100}%`, top: `${(point.y / box.height) * 100}%` }}
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
          )
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
