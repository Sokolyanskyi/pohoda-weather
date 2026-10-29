"use client";

import { useId } from "react";
import type { IconPack } from "@/lib/client/prefs";
import { scenePreset } from "@/lib/weather/kind";
import type { MotionLevel, WeatherKind } from "@/lib/types";

interface WeatherIconProps {
  kind: WeatherKind;
  isDay?: boolean;
  pack: IconPack;
  motion?: MotionLevel;
  size?: number;
  className?: string;
  title?: string;
}

const CLOUD_PATH =
  "M17 44a9 9 0 0 1 .6-17.9 13 13 0 0 1 24.6-1.6A9.5 9.5 0 0 1 47 44Z";

function Rays({ cx, cy, inner, outer }: { cx: number; cy: number; inner: number; outer: number }) {
  return (
    <g className="wi-rays">
      {Array.from({ length: 8 }, (_, index) => (
        <line
          key={index}
          x1={cx}
          y1={cy - inner}
          x2={cx}
          y2={cy - outer}
          transform={`rotate(${index * 45} ${cx} ${cy})`}
        />
      ))}
    </g>
  );
}

function Cloud({
  transform,
  className = "wi-cloud",
}: {
  transform?: string;
  className?: string;
}) {
  return (
    <g className={className} transform={transform}>
      <path d={CLOUD_PATH} />
    </g>
  );
}

function Drops({ count, snow = false }: { count: number; snow?: boolean }) {
  const positions = [
    [23, 47],
    [31.5, 49],
    [40, 47],
    [27, 54],
    [36, 55],
  ];
  const items = [];
  for (let index = 0; index < count; index += 1) {
    const [x, y] = positions[index % positions.length];
    if (snow) {
      items.push(
        <g key={index} className="wi-flake" style={{ animationDelay: `${index * 0.42}s` }}>
          <path d={`M${x - 2.4} ${y}h4.8M${x} ${y - 2.4}v4.8M${x - 1.7} ${y - 1.7}l3.4 3.4M${x + 1.7} ${y - 1.7}l-3.4 3.4`} />
        </g>,
      );
    } else {
      items.push(
        <line
          key={index}
          className="wi-drop"
          x1={x}
          y1={y}
          x2={x - 1.6}
          y2={y + 5}
          style={{ animationDelay: `${index * 0.28}s` }}
        />,
      );
    }
  }
  return <g className="wi-precip">{items}</g>;
}

function Bolt({ x = 0, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g className="wi-bolt" transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M32 44 24 56h6l-3 8 12-13h-7l4-7Z" />
    </g>
  );
}

function Stars({ points }: { points: Array<[number, number]> }) {
  return (
    <g className="wi-stars">
      {points.map(([x, y], index) => (
        <circle
          key={index}
          cx={x}
          cy={y}
          r={index % 2 === 0 ? 1.5 : 1}
          style={{ animationDelay: `${index * 0.6}s` }}
        />
      ))}
    </g>
  );
}

function Crescent({ cx = 31, cy = 30, r = 14 }: { cx?: number; cy?: number; r?: number }) {
  const raw = useId();
  const mask = `moon${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <g className="wi-moon">
      <defs>
        <mask id={mask}>
          <rect x="0" y="0" width="64" height="64" fill="white" />
          <circle cx={cx + 10} cy={cy - 7} r={r - 2} fill="black" />
        </mask>
      </defs>
      <circle cx={cx} cy={cy} r={r} mask={`url(#${mask})`} />
    </g>
  );
}

function SvgGlyph({
  kind,
  isDay,
  pack,
}: {
  kind: WeatherKind;
  isDay: boolean;
  pack: IconPack;
}) {
  const preset = scenePreset(kind);
  const day = isDay;
  const clear = preset === "clear";

  const sun =
    clear && day ? (
      <g className="wi-sun">
        <circle cx="32" cy="30" r="10" />
        <Rays cx={32} cy={30} inner={14} outer={19} />
      </g>
    ) : null;

  const moon =
    clear && !day ? (
      <g>
        <Crescent />
        <Stars points={[[48, 16], [51, 27], [43, 12], [19, 18]]} />
      </g>
    ) : null;

  if (clear && day) return sun;
  if (clear) return moon;

  const smallSun =
    preset === "partly" && day ? (
      <g className="wi-sun wi-sun-small" transform="translate(-9 -9) scale(0.72)">
        <circle cx="32" cy="30" r="9" />
        <Rays cx={32} cy={30} inner={13} outer={18} />
      </g>
    ) : null;

  const smallMoon =
    preset === "partly" && !day ? (
      <g transform="translate(-8 -8) scale(0.66)">
        <Crescent cx={32} cy={30} r={13} />
      </g>
    ) : null;

  const doubleCloud = kind === "overcast";

  return (
    <g>
      {smallSun}
      {smallMoon}
      {doubleCloud ? (
        <Cloud className="wi-cloud wi-cloud-back" transform="translate(8 4) scale(0.7)" />
      ) : null}
      <Cloud transform={preset === "partly" ? "translate(4 8) scale(0.86)" : undefined} />
      {preset === "fog" ? (
        <g className="wi-fog">
          <line x1="18" y1="48" x2="46" y2="48" />
          <line x1="22" y1="53" x2="42" y2="53" />
          <line x1="26" y1="58" x2="38" y2="58" />
        </g>
      ) : null}
      {preset === "rain" ? (
        <Drops count={kind === "drizzle" ? 2 : kind === "heavy-rain" ? 5 : 3} />
      ) : null}
      {preset === "snow" ? <Drops count={kind === "sleet" ? 2 : 4} snow /> : null}
      {preset === "storm" ? (
        <g>
          {kind === "hail" ? (
            <g className="wi-hail">
              <circle cx="23" cy="51" r="2.1" />
              <circle cx="31" cy="56" r="2.1" />
              <circle cx="39" cy="51" r="2.1" />
            </g>
          ) : null}
          <Bolt />
        </g>
      ) : null}
      {pack === "neon" ? <circle className="wi-halo" cx="32" cy="34" r="26" /> : null}
    </g>
  );
}

const PIXEL_SHAPES: Record<string, Array<{ x: number; y: number; w: number; h: number; role: string }>> = {
  sun: [
    { x: 5, y: 5, w: 6, h: 6, role: "sun" },
    { x: 7, y: 1, w: 2, h: 2, role: "sun" },
    { x: 7, y: 13, w: 2, h: 2, role: "sun" },
    { x: 1, y: 7, w: 2, h: 2, role: "sun" },
    { x: 13, y: 7, w: 2, h: 2, role: "sun" },
    { x: 2, y: 2, w: 1, h: 1, role: "sun" },
    { x: 13, y: 2, w: 1, h: 1, role: "sun" },
    { x: 2, y: 13, w: 1, h: 1, role: "sun" },
    { x: 13, y: 13, w: 1, h: 1, role: "sun" },
  ],
  moon: [
    { x: 4, y: 2, w: 4, h: 2, role: "moon" },
    { x: 3, y: 3, w: 2, h: 3, role: "moon" },
    { x: 3, y: 8, w: 2, h: 3, role: "moon" },
    { x: 4, y: 13, w: 4, h: 2, role: "moon" },
    { x: 7, y: 4, w: 2, h: 1, role: "moon" },
    { x: 7, y: 11, w: 2, h: 1, role: "moon" },
    { x: 2, y: 6, w: 1, h: 1, role: "star" },
    { x: 13, y: 2, w: 1, h: 1, role: "star" },
    { x: 12, y: 13, w: 1, h: 1, role: "star" },
  ],
  cloud: [
    { x: 3, y: 7, w: 10, h: 4, role: "cloud" },
    { x: 5, y: 5, w: 5, h: 3, role: "cloud" },
    { x: 2, y: 9, w: 2, h: 2, role: "cloud" },
    { x: 12, y: 9, w: 2, h: 2, role: "cloud" },
  ],
};

function PixelShape({ role, x, y, w, h }: { role: string; x: number; y: number; w: number; h: number }) {
  return <rect className={`wi-px wi-px-${role}`} x={x} y={y} width={w} height={h} />;
}

function PixelIcon({ kind, isDay }: { kind: WeatherKind; isDay: boolean }) {
  const preset = scenePreset(kind);
  const cloud = PIXEL_SHAPES.cloud;
  const clear = preset === "clear";

  if (clear) {
    return (
      <svg viewBox="0 0 16 16" className="wi-svg" aria-hidden="true">
        {(isDay ? PIXEL_SHAPES.sun : PIXEL_SHAPES.moon).map((shape, index) => (
          <PixelShape key={index} {...shape} />
        ))}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" className="wi-svg" aria-hidden="true">
      {preset === "partly" ? (
        <g className="wi-px-sun-group" transform="translate(1 -1)">
          {PIXEL_SHAPES.sun.slice(0, 5).map((shape, index) => (
            <PixelShape key={index} {...shape} />
          ))}
        </g>
      ) : null}
      {kind === "overcast" ? (
        <g transform="translate(2 1) scale(0.85)" opacity="0.55">
          {cloud.map((shape, index) => (
            <PixelShape key={index} {...shape} />
          ))}
        </g>
      ) : null}
      <g transform={preset === "partly" ? "translate(-1 3)" : "translate(0 1)"}>
        {cloud.map((shape, index) => (
          <PixelShape key={index} {...shape} />
        ))}
      </g>
      {preset === "rain" ? (
        <g className="wi-px-drops">
          <rect className="wi-px wi-px-drop" x="4" y="12" width="1" height="2" />
          <rect className="wi-px wi-px-drop" x="7" y="13" width="1" height="2" />
          <rect className="wi-px wi-px-drop" x="10" y="12" width="1" height="2" />
          {kind === "heavy-rain" ? <rect className="wi-px wi-px-drop" x="12" y="14" width="1" height="2" /> : null}
        </g>
      ) : null}
      {preset === "snow" ? (
        <g className="wi-px-drops">
          <rect className="wi-px wi-px-flake" x="4" y="12" width="1" height="1" />
          <rect className="wi-px wi-px-flake" x="7" y="13" width="1" height="1" />
          <rect className="wi-px wi-px-flake" x="10" y="12" width="1" height="1" />
        </g>
      ) : null}
      {preset === "storm" ? (
        <g className="wi-px-bolt">
          <rect className="wi-px wi-px-bolt-fill" x="8" y="11" width="2" height="2" />
          <rect className="wi-px wi-px-bolt-fill" x="7" y="13" width="1" height="3" />
          <rect className="wi-px wi-px-bolt-fill" x="9" y="13" width="2" height="1" />
        </g>
      ) : null}
      {preset === "fog" ? (
        <g className="wi-px-fog">
          <rect className="wi-px wi-px-fog" x="3" y="12" width="10" height="1" />
          <rect className="wi-px wi-px-fog" x="5" y="14" width="7" height="1" />
        </g>
      ) : null}
    </svg>
  );
}

const EMOJI: Record<WeatherKind, [string, string]> = {
  clear: ["☀️", "🌙"],
  partly: ["⛅", "☁️"],
  cloudy: ["🌥️", "☁️"],
  overcast: ["☁️", "☁️"],
  fog: ["🌫️", "🌫️"],
  drizzle: ["🌦️", "🌧️"],
  rain: ["🌧️", "🌧️"],
  "heavy-rain": ["🌧️", "🌧️"],
  snow: ["🌨️", "🌨️"],
  sleet: ["🌨️", "🌨️"],
  thunder: ["⛈️", "⛈️"],
  hail: ["⛈️", "⛈️"],
};

/* Meteocons by Bas Milius (MIT): ready-made animated SVG sets. The files are
   vendored under public/meteocons, one folder per style and variant. */
const METEOCON_STYLES: Partial<Record<IconPack, string>> = {
  "meteo-fill": "fill",
  "meteo-flat": "flat",
  "meteo-line": "line",
  "meteo-mono": "monochrome",
};

const METEOCONS: Record<WeatherKind, [string, string]> = {
  clear: ["clear-day", "clear-night"],
  partly: ["partly-cloudy-day", "partly-cloudy-night"],
  cloudy: ["cloudy", "cloudy"],
  overcast: ["overcast", "overcast"],
  fog: ["fog-day", "fog-night"],
  drizzle: ["drizzle", "drizzle"],
  rain: ["rain", "rain"],
  "heavy-rain": ["overcast-rain", "overcast-rain"],
  snow: ["snow", "snow"],
  sleet: ["sleet", "sleet"],
  thunder: ["thunderstorms", "thunderstorms"],
  hail: ["hail", "hail"],
};

export function WeatherIcon({
  kind,
  isDay = true,
  pack,
  motion = "full",
  size = 64,
  className = "",
  title,
}: WeatherIconProps) {
  const label = title ?? kind;
  const style = { width: size, height: size };

  if (pack === "emoji") {
    const [dayEmoji, nightEmoji] = EMOJI[kind];
    return (
      <span
        className={`wi wi-emoji ${className}`}
        data-motion={motion}
        data-kind={kind}
        style={{ ...style, fontSize: size * 0.78 }}
        role="img"
        aria-label={label}
      >
        <span className="wi-emoji-glyph">{isDay ? dayEmoji : nightEmoji}</span>
      </span>
    );
  }

  if (pack === "pixel") {
    return (
      <span
        className={`wi wi-pixel ${className}`}
        data-motion={motion}
        data-kind={kind}
        style={style}
        role="img"
        aria-label={label}
      >
        <PixelIcon kind={kind} isDay={isDay} />
      </span>
    );
  }

  const meteoStyle = METEOCON_STYLES[pack];
  if (meteoStyle) {
    const [dayFile, nightFile] = METEOCONS[kind];
    // The static copies exist so the motion setting can really stop the
    // SMIL animations inside the SVG; an <img> cannot pause them from CSS.
    const variant = motion === "full" ? "animated" : "static";
    return (
      <span
        className={`wi wi-meteo ${className}`}
        data-pack={pack}
        data-motion={motion}
        data-kind={kind}
        style={style}
        role="img"
        aria-label={label}
      >
        <img
          src={`/meteocons/${meteoStyle}/${variant}/${isDay ? dayFile : nightFile}.svg`}
          alt=""
          width={size}
          height={size}
          draggable={false}
        />
      </span>
    );
  }

  return (
    <span
      className={`wi wi-svgpack ${className}`}
      data-pack={pack}
      data-motion={motion}
      data-kind={kind}
      style={style}
      role="img"
      aria-label={label}
    >
      <svg viewBox="0 0 64 64" className="wi-svg" aria-hidden="true">
        <SvgGlyph kind={kind} isDay={isDay} pack={pack} />
      </svg>
    </span>
  );
}
