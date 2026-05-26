"use client";

import { useEffect, useState } from "react";

type Row = { label: string; pct: number; count: number; severity: "crit" | "high" | "med" | "low" };

const ROWS: Row[] = [
  { label: "Exposed secrets (.env, .git/config)", pct: 92, count: 247, severity: "crit" },
  { label: "SQL injection — login endpoints", pct: 86, count: 198, severity: "crit" },
  { label: "Outdated jQuery / Lodash / Axios", pct: 78, count: 174, severity: "high" },
  { label: "CORS reflects arbitrary origin", pct: 64, count: 132, severity: "high" },
  { label: "Weak TLS cipher / no HSTS", pct: 58, count: 119, severity: "med" },
  { label: "JWT — alg=none accepted", pct: 41, count: 87, severity: "high" },
  { label: "S3 / IPFS bucket publicly listed", pct: 36, count: 73, severity: "med" },
  { label: "SSRF via webhook callback", pct: 28, count: 58, severity: "high" },
  { label: "GraphQL introspection enabled", pct: 19, count: 42, severity: "low" },
  { label: "Default admin credentials", pct: 14, count: 31, severity: "crit" }
];

const COLORS: Record<Row["severity"], string> = {
  crit: "from-red-500 to-red-400",
  high: "from-orange-500 to-orange-400",
  med: "from-amber-500 to-amber-400",
  low: "from-cyan-500 to-cyan-400"
};

const TEXT_COLORS: Record<Row["severity"], string> = {
  crit: "text-red-300",
  high: "text-orange-300",
  med: "text-amber-300",
  low: "text-cyan-300"
};

export function TopThreatsBars() {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="rounded-xl border border-border/80 bg-panel/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-300">Top Threats · Last 30 days</div>
          <div className="mt-1 text-lg font-semibold">Most-detected vulnerability classes</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl text-glow text-cyan-300">1,161</div>
          <div className="text-[10px] uppercase tracking-widest text-muted">findings · 30d</div>
        </div>
      </div>

      <div className="space-y-3">
        {ROWS.map((r, i) => (
          <div key={r.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <span className={`font-mono text-[10px] tabular-nums ${TEXT_COLORS[r.severity]}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-fg/90">{r.label}</span>
              </span>
              <span className="font-mono text-xs">
                <span className={TEXT_COLORS[r.severity]}>{r.count}</span>
                <span className="ml-2 text-muted">{r.pct}%</span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-bg/80 ring-1 ring-border/60">
              <div
                className={`h-full bg-gradient-to-r ${COLORS[r.severity]} transition-all duration-1500`}
                style={{
                  width: animated ? `${r.pct}%` : "0%",
                  transitionDelay: `${i * 80}ms`,
                  transitionDuration: "1500ms"
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
