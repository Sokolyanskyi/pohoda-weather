/**
 * Geometry of the sunrise → sunset arc.
 *
 * The arc used to live in a 100 × 60 viewBox stretched with
 * `preserveAspectRatio="none"`. That distorted every dash and dash offset, so the
 * lit part of the day showed up as stripes instead of one solid line. The helpers
 * below work in the component's own pixel space, so the viewBox is 1:1, dashes
 * keep their length and the sun dot can be placed from the very same curve.
 */

export interface ArcGeometry {
  x0: number;
  y0: number;
  /** Quadratic control point. */
  cx: number;
  cy: number;
  x1: number;
  y1: number;
}

export interface ArcPoint {
  x: number;
  y: number;
}

/** Fractions of the card box the arc lives in: sunrise/sunset on the horizon. */
export const ARC_SHAPE = {
  left: 0.08,
  right: 0.92,
  top: 1 / 6,
  bottom: 5 / 6,
} as const;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function arcGeometry(width: number, height: number): ArcGeometry {
  const x0 = width * ARC_SHAPE.left;
  const x1 = width * ARC_SHAPE.right;
  const y0 = height * ARC_SHAPE.bottom;
  const apex = height * ARC_SHAPE.top;
  return { x0, y0, cx: (x0 + x1) / 2, cy: 2 * apex - y0, x1, y1: y0 };
}

/** Point on the arc at 0 (sunrise) … 1 (sunset). */
export function arcPoint(geometry: ArcGeometry, progress: number): ArcPoint {
  const t = clamp01(progress);
  const u = 1 - t;
  return {
    x: u * u * geometry.x0 + 2 * u * t * geometry.cx + t * t * geometry.x1,
    y: u * u * geometry.y0 + 2 * u * t * geometry.cy + t * t * geometry.y1,
  };
}

export function arcPath(geometry: ArcGeometry): string {
  return `M${round(geometry.x0)} ${round(geometry.y0)} Q${round(geometry.cx)} ${round(
    geometry.cy,
  )} ${round(geometry.x1)} ${round(geometry.y1)}`;
}

/**
 * The part of the arc that the sun has already travelled, from sunrise to
 * `progress`. It is a real sub-curve (de Casteljau split), so the lit line ends
 * exactly under the sun dot instead of wherever a dash offset happened to land.
 */
export function arcSegment(geometry: ArcGeometry, progress: number): string {
  const t = clamp01(progress);
  if (t <= 0) return "";
  if (t >= 1) return arcPath(geometry);
  const a: ArcPoint = {
    x: geometry.x0 + (geometry.cx - geometry.x0) * t,
    y: geometry.y0 + (geometry.cy - geometry.y0) * t,
  };
  const b: ArcPoint = {
    x: geometry.cx + (geometry.x1 - geometry.cx) * t,
    y: geometry.cy + (geometry.y1 - geometry.cy) * t,
  };
  const end: ArcPoint = {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
  return `M${round(geometry.x0)} ${round(geometry.y0)} Q${round(a.x)} ${round(a.y)} ${round(
    end.x,
  )} ${round(end.y)}`;
}
