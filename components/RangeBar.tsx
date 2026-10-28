"use client";

import { temperatureColor } from "@/lib/units";
import type { CSSProperties } from "react";

interface RangeBarProps {
  min: number;
  max: number;
  average?: number;
  globalMin: number;
  globalMax: number;
  source?: "forecast" | "climate";
}

export function RangeBar({ min, max, average, globalMin, globalMax, source }: RangeBarProps) {
  const span = Math.max(1, globalMax - globalMin);
  const left = ((min - globalMin) / span) * 100;
  const width = Math.max(3, ((max - min) / span) * 100);
  const dot = average === undefined ? null : ((average - globalMin) / span) * 100;

  return (
    <span
      className="range"
      data-source={source ?? "forecast"}
      style={
        {
          "--range-left": `${Math.max(0, Math.min(100, left))}%`,
          "--range-width": `${Math.min(100 - Math.max(0, left), width)}%`,
          "--range-dot": `${Math.max(0, Math.min(100, dot ?? 0))}%`,
          "--range-from": temperatureColor(min),
          "--range-to": temperatureColor(max),
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <span className="range-track" />
      <span className="range-fill" />
      {dot === null ? null : <span className="range-dot" />}
    </span>
  );
}
