"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { MotionLevel, WeatherKind } from "@/lib/types";
import { scenePreset } from "@/lib/weather/kind";

interface SceneProps {
  kind: WeatherKind;
  isDay: boolean;
  motion: MotionLevel;
}

const CLOUDS = [
  { top: 8, left: -12, scale: 1.15, delay: 0, duration: 64, opacity: 0.5, depth: 1 },
  { top: 22, left: 34, scale: 0.85, delay: -14, duration: 78, opacity: 0.42, depth: 2 },
  { top: 39, left: -6, scale: 1.4, delay: -30, duration: 96, opacity: 0.32, depth: 3 },
  { top: 56, left: 52, scale: 0.7, delay: -48, duration: 88, opacity: 0.36, depth: 2 },
  { top: 66, left: 12, scale: 1.05, delay: -22, duration: 110, opacity: 0.24, depth: 4 },
];

const STARS = Array.from({ length: 64 }, (_, index) => {
  const golden = index * 0.61803398875;
  return {
    left: ((golden * 100) % 100).toFixed(2),
    top: ((golden * 61.8 + 7) % 78).toFixed(2),
    size: index % 9 === 0 ? 2.6 : index % 4 === 0 ? 2 : 1.4,
    delay: ((index * 0.37) % 5).toFixed(2),
    duration: (2.4 + (index % 7) * 0.45).toFixed(2),
  };
});

function useParticles(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  mode: "rain" | "snow" | null,
  intensity: number,
  motion: MotionLevel,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mode || motion === "off") return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced && motion !== "calm") return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let running = true;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    interface Drop {
      x: number;
      y: number;
      len: number;
      speed: number;
      drift: number;
      alpha: number;
      size: number;
    }
    let drops: Drop[] = [];

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const density = motion === "calm" ? 0.45 : 1;
      const count = Math.round(((width * height) / 14000) * intensity * density);
      drops = Array.from({ length: Math.min(520, Math.max(24, count)) }, () => spawn(true));
    };

    const spawn = (anywhere = false): Drop => {
      if (mode === "rain") {
        return {
          x: Math.random() * width,
          y: anywhere ? Math.random() * height : -20,
          len: 10 + Math.random() * 18,
          speed: 620 + Math.random() * 520,
          drift: 90 + Math.random() * 70,
          alpha: 0.18 + Math.random() * 0.35,
          size: 0,
        };
      }
      return {
        x: Math.random() * width,
        y: anywhere ? Math.random() * height : -10,
        len: 0,
        speed: 42 + Math.random() * 58,
        drift: 14 + Math.random() * 26,
        alpha: 0.35 + Math.random() * 0.5,
        size: 1.2 + Math.random() * 2.6,
      };
    };

    resize();
    window.addEventListener("resize", resize);

    let last = performance.now();
    const tick = (time: number) => {
      if (!running) return;
      const delta = Math.min(48, time - last) / 1000;
      last = time;
      context.clearRect(0, 0, width, height);
      if (mode === "rain") {
        context.lineCap = "round";
        context.lineWidth = 1.4;
        for (const drop of drops) {
          drop.y += drop.speed * delta;
          drop.x += drop.drift * delta;
          if (drop.y > height + drop.len || drop.x > width + 30) {
            Object.assign(drop, spawn());
            continue;
          }
          context.strokeStyle = `rgba(186, 214, 245, ${drop.alpha})`;
          context.beginPath();
          context.moveTo(drop.x, drop.y);
          context.lineTo(drop.x - drop.len * 0.22, drop.y + drop.len);
          context.stroke();
        }
      } else {
        for (const drop of drops) {
          drop.y += drop.speed * delta;
          drop.x += Math.sin((drop.y + drop.x) / 90) * drop.drift * delta;
          if (drop.y > height + 6 || drop.x > width + 10 || drop.x < -10) {
            Object.assign(drop, spawn());
            continue;
          }
          context.beginPath();
          context.fillStyle = `rgba(244, 250, 255, ${drop.alpha})`;
          context.arc(drop.x, drop.y, drop.size, 0, Math.PI * 2);
          context.fill();
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else if (!running) {
        running = true;
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [canvasRef, mode, intensity, motion]);
}

export function WeatherScene({ kind, isDay, motion }: SceneProps) {
  const preset = scenePreset(kind);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const precipitation =
    preset === "rain" ? "rain" : preset === "snow" ? "snow" : preset === "storm" ? "rain" : null;
  const intensity =
    kind === "heavy-rain" ? 1.7 : kind === "drizzle" ? 0.55 : kind === "thunder" ? 1.3 : 1;

  useParticles(canvasRef, precipitation, intensity, motion);

  const cloudCount =
    preset === "clear" ? 0 : preset === "partly" ? 2 : preset === "fog" ? 4 : preset === "cloudy" ? 4 : 5;

  return (
    <div
      className="scene"
      data-preset={preset}
      data-kind={kind}
      data-day={isDay ? "day" : "night"}
      data-motion={motion}
      aria-hidden="true"
    >
      <div className="scene-sky" />
      <div className="scene-aura">
        <span />
        <span />
        <span />
      </div>
      {!isDay ? (
        <div className="scene-stars">
          {STARS.slice(0, preset === "clear" ? 64 : 34).map((star, index) => (
            <span
              key={index}
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                width: star.size,
                height: star.size,
                animationDelay: `${star.delay}s`,
                animationDuration: `${star.duration}s`,
              }}
            />
          ))}
        </div>
      ) : null}

      {preset === "clear" || preset === "partly" ? (
        <div className={`scene-orb ${isDay ? "scene-sun" : "scene-moon"}`}>
          <span className="scene-orb-core" />
          <span className="scene-orb-halo" />
        </div>
      ) : null}

      <div className="scene-clouds">
        {CLOUDS.slice(0, cloudCount).map((cloud, index) => (
          <span
            key={index}
            className="scene-cloud"
            style={{
              top: `${cloud.top}%`,
              left: `${cloud.left}%`,
              opacity: cloud.opacity,
              scale: cloud.scale,
              animationDelay: `${cloud.delay}s`,
              animationDuration: `${cloud.duration}s`,
            }}
          >
            <i />
            <i />
            <i />
          </span>
        ))}
      </div>

      {preset === "fog" ? (
        <div className="scene-fog">
          <span />
          <span />
          <span />
        </div>
      ) : null}

      {precipitation ? <canvas ref={canvasRef} className="scene-particles" /> : null}
      {preset === "storm" ? <div className="scene-flash" /> : null}
      <div className="scene-haze" />
      <div className="scene-vignette" />
    </div>
  );
}
