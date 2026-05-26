"use client";

import { useMemo } from "react";

type Blip = { x: number; y: number; severity: "low" | "med" | "high" | "crit"; delay: number };

const SEV: Record<Blip["severity"], string> = {
  low: "bg-cyan-400",
  med: "bg-amber-400",
  high: "bg-orange-400",
  crit: "bg-red-500"
};

function rand(seed: number) {
  // deterministic random so SSR + client match
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function ThreatRadar() {
  const blips = useMemo<Blip[]>(() => {
    return Array.from({ length: 22 }, (_, i) => {
      const angle = rand(i + 1) * Math.PI * 2;
      const radius = 8 + rand(i + 10) * 36; // % from centre
      const sevRoll = rand(i + 99);
      const severity: Blip["severity"] = sevRoll > 0.92 ? "crit" : sevRoll > 0.78 ? "high" : sevRoll > 0.55 ? "med" : "low";
      return {
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius,
        severity,
        delay: rand(i + 50) * 4
      };
    });
  }, []);

  return (
    <div className="relative aspect-square w-full max-w-[280px]">
      {/* Rings */}
      <div className="radar-ring" style={{ inset: "0%" }} />
      <div className="radar-ring" style={{ inset: "10%" }} />
      <div className="radar-ring" style={{ inset: "25%" }} />
      <div className="radar-ring" style={{ inset: "42%" }} />

      {/* Crosshairs */}
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-cyan-400/15" />
      <div className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-cyan-400/15" />

      {/* Sweep */}
      <div className="radar-sweep" />

      {/* Blips */}
      {blips.map((b, i) => (
        <span
          key={i}
          className={`absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${SEV[b.severity]} live-dot`}
          style={{ left: `${b.x}%`, top: `${b.y}%`, animationDelay: `${b.delay}s` }}
        />
      ))}

      {/* Centre */}
      <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_24px_4px_rgba(34,211,238,0.65)]" />

      {/* Label */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-cyan-400/30 bg-bg/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300">
        Threat surface · live
      </div>
    </div>
  );
}
