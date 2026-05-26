"use client";

import { useEffect, useState } from "react";

function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function LatencySparkline() {
  const [data, setData] = useState<number[]>(() => Array.from({ length: 60 }, (_, i) => 40 + rand(i) * 60));

  useEffect(() => {
    const id = setInterval(() => {
      setData((d) => [...d.slice(1), 40 + Math.random() * 80]);
    }, 700);
    return () => clearInterval(id);
  }, []);

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 600;
  const h = 80;
  const stepX = w / (data.length - 1);
  const points = data.map((v, i) => `${(i * stepX).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`).join(" ");
  const area = `0,${h} ${points} ${w},${h}`;

  const current = data[data.length - 1];
  const avg = data.reduce((a, b) => a + b, 0) / data.length;

  return (
    <section className="rounded-xl border border-border/80 bg-panel/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-300">Detection Latency · 60s window</div>
          <div className="mt-1 text-lg font-semibold">Time-to-finding distribution</div>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <div className="font-mono text-2xl text-glow text-cyan-300">{current.toFixed(0)}ms</div>
            <div className="text-[10px] uppercase tracking-widest text-muted">now</div>
          </div>
          <div>
            <div className="font-mono text-2xl text-violet-300">{avg.toFixed(0)}ms</div>
            <div className="text-[10px] uppercase tracking-widest text-muted">avg</div>
          </div>
          <div>
            <div className="font-mono text-2xl text-emerald-300">p99</div>
            <div className="text-[10px] uppercase tracking-widest text-muted">{(max * 0.96).toFixed(0)}ms</div>
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#spark-grad)" />
        <polyline points={points} fill="none" stroke="#22d3ee" strokeWidth="1.5" />
        <circle
          cx={(data.length - 1) * stepX}
          cy={h - ((current - min) / range) * h}
          r="3"
          fill="#22d3ee"
          className="live-dot"
        />
      </svg>
    </section>
  );
}
