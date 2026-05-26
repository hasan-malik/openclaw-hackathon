"use client";

import { useMemo } from "react";

function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function intensityToColor(v: number) {
  if (v === 0) return "rgb(20,20,24)";
  if (v < 0.2) return "rgba(34,211,238,0.15)";
  if (v < 0.4) return "rgba(34,211,238,0.35)";
  if (v < 0.6) return "rgba(245,158,11,0.55)";
  if (v < 0.8) return "rgba(249,115,22,0.7)";
  return "rgba(239,68,68,0.85)";
}

export function ThreatHeatmap() {
  const weeks = 26;
  const days = 7;

  const cells = useMemo(() => {
    return Array.from({ length: weeks }, (_, w) =>
      Array.from({ length: days }, (_, d) => {
        const r = rand(w * 7 + d + 13);
        const burst = w > 18 && rand(w * 13 + d + 91) > 0.7;
        return burst ? Math.min(1, r + 0.3) : r;
      })
    );
  }, []);

  return (
    <section className="rounded-xl border border-border/80 bg-panel/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-300">Detection Heatmap · 6 months</div>
          <div className="mt-1 text-lg font-semibold">Daily threat activity</div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted">
          Less
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: intensityToColor(0.1) }} />
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: intensityToColor(0.3) }} />
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: intensityToColor(0.5) }} />
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: intensityToColor(0.7) }} />
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: intensityToColor(0.9) }} />
          More
        </div>
      </div>

      <div className="flex gap-[3px]">
        {cells.map((week, w) => (
          <div key={w} className="flex flex-col gap-[3px]">
            {week.map((v, d) => (
              <div
                key={d}
                title={`week ${w + 1}, day ${d + 1} — intensity ${(v * 100).toFixed(0)}%`}
                className="h-3 w-3 rounded-sm transition hover:scale-150"
                style={{ background: intensityToColor(v) }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-between font-mono text-[10px] text-muted">
        <span>26w ago</span>
        <span>now</span>
      </div>
    </section>
  );
}
