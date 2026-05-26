"use client";

import { useEffect, useState } from "react";

type Gauge = {
  label: string;
  target: number;
  color: string;
  caption: string;
};

const GAUGES: Gauge[] = [
  { label: "Coverage", target: 92, color: "#22d3ee", caption: "of attack surface" },
  { label: "Detection rate", target: 87, color: "#8b5cf6", caption: "true positives" },
  { label: "MTTR", target: 78, color: "#10b981", caption: "vs industry baseline" },
  { label: "Auth posture", target: 64, color: "#f97316", caption: "MFA + key rotation" },
  { label: "TLS hygiene", target: 96, color: "#3b82f6", caption: "modern ciphers" },
  { label: "Secret scan", target: 81, color: "#ef4444", caption: "leaks remediated" }
];

function Ring({ pct, color, size = 110 }: { pct: number; color: string; size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1.8s cubic-bezier(0.16,1,0.3,1)" }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r + 8}
        fill="none"
        stroke={color}
        strokeOpacity={0.25}
        strokeWidth={1}
        strokeDasharray="4 6"
        style={{ animation: "rotate 8s linear infinite", transformOrigin: "center" }}
      />
    </svg>
  );
}

export function AnimatedGauges() {
  const [values, setValues] = useState(GAUGES.map(() => 0));

  useEffect(() => {
    // Animate 0 → target over 1.8s, then keep small live wiggle
    const start = performance.now();
    const dur = 1800;
    let raf: number;
    const step = (ts: number) => {
      const t = Math.min(1, (ts - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setValues(GAUGES.map((g) => g.target * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    // Live wiggle: small random delta each second
    const id = setInterval(() => {
      setValues((curr) =>
        curr.map((v, i) => {
          const target = GAUGES[i].target;
          const drift = (Math.random() - 0.5) * 2;
          return Math.max(0, Math.min(100, target + drift));
        })
      );
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="rounded-xl border border-border/80 bg-panel/60 p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-300">Posture Indicators</div>
          <div className="mt-1 text-lg font-semibold">Live performance dials</div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted">
          <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />
          updating 1.5s
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {GAUGES.map((g, i) => (
          <div key={g.label} className="flex flex-col items-center">
            <div className="relative">
              <Ring pct={values[i]} color={g.color} />
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="ticker font-mono text-2xl font-semibold" style={{ color: g.color }}>
                    {values[i].toFixed(0)}
                    <span className="text-sm opacity-70">%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2 text-center">
              <div className="text-xs font-medium" style={{ color: g.color }}>
                {g.label}
              </div>
              <div className="text-[10px] text-muted">{g.caption}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
