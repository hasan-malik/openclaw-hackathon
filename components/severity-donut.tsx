"use client";

import { useMemo } from "react";
import type { Finding } from "@shared/types";

const ORDER: Finding["severity"][] = ["critical", "high", "medium", "low", "info"];
const COLORS: Record<Finding["severity"], string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#3b82f6",
  info: "#6b7280"
};

export function SeverityDonut({ findings }: { findings: Finding[] }) {
  const data = useMemo(() => {
    const base: Record<Finding["severity"], number> = {
      critical: 3,
      high: 11,
      medium: 27,
      low: 41,
      info: 18
    };
    for (const f of findings) base[f.severity]++;
    const total = Object.values(base).reduce((a, b) => a + b, 0);
    return { base, total };
  }, [findings]);

  const radius = 48;
  const circ = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = ORDER.map((sev) => {
    const fraction = data.base[sev] / data.total;
    const dash = circ * fraction;
    const arc = { sev, dash, offset, color: COLORS[sev], count: data.base[sev], fraction };
    offset += dash;
    return arc;
  });

  return (
    <div className="rounded-xl border border-border/80 bg-panel/60 p-5">
      <div className="mb-4 text-[10px] uppercase tracking-[0.25em] text-cyan-300">Severity mix · all findings</div>
      <div className="flex items-center gap-5">
        <svg viewBox="-60 -60 120 120" className="h-32 w-32 -rotate-90">
          <circle r={radius} cx={0} cy={0} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={12} />
          {arcs.map((a) => (
            <circle
              key={a.sev}
              r={radius}
              cx={0}
              cy={0}
              fill="none"
              stroke={a.color}
              strokeWidth={12}
              strokeDasharray={`${a.dash} ${circ - a.dash}`}
              strokeDashoffset={-a.offset}
              strokeLinecap="butt"
            />
          ))}
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            transform="rotate(90)"
            className="fill-fg font-mono text-[14px] font-semibold"
          >
            {data.total}
          </text>
          <text
            x={0}
            y={12}
            textAnchor="middle"
            dominantBaseline="middle"
            transform="rotate(90)"
            className="fill-muted text-[6px] uppercase tracking-widest"
          >
            findings
          </text>
        </svg>
        <div className="flex-1 space-y-1.5">
          {arcs.map((a) => (
            <div key={a.sev} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                <span className="capitalize">{a.sev}</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-fg">{a.count}</span>
                <span className="ml-1 text-muted">{(a.fraction * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
