"use client";

import { useEffect, useState } from "react";

type Card = {
  framework: string;
  grade: "A+" | "A" | "B" | "C";
  pct: number;
  color: string;
};

const CARDS: Card[] = [
  { framework: "SOC 2 Type II", grade: "A", pct: 91, color: "#10b981" },
  { framework: "ISO 27001", grade: "A+", pct: 96, color: "#22d3ee" },
  { framework: "PCI DSS v4", grade: "B", pct: 78, color: "#f59e0b" },
  { framework: "GDPR Art. 32", grade: "A", pct: 88, color: "#8b5cf6" },
  { framework: "OWASP ASVS L2", grade: "B", pct: 73, color: "#3b82f6" },
  { framework: "NIST CSF", grade: "A", pct: 89, color: "#ef4444" }
];

function ScoreRing({ pct, color }: { pct: number; color: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 1600;
    let raf: number;
    const step = (ts: number) => {
      const t = Math.min(1, (ts - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(pct * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  const r = 28;
  const circ = 2 * Math.PI * r;
  return (
    <svg viewBox="-36 -36 72 72" className="h-16 w-16">
      <circle r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
      <circle
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - v / 100)}
        transform="rotate(-90)"
      />
    </svg>
  );
}

export function ComplianceScorecard() {
  return (
    <section className="rounded-xl border border-border/80 bg-panel/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-300">Compliance Pass-rate</div>
          <div className="mt-1 text-lg font-semibold">Frameworks · evidence-aligned</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl text-glow text-emerald-300">85.8</div>
          <div className="text-[10px] uppercase tracking-widest text-muted">composite score</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {CARDS.map((c) => (
          <div key={c.framework} className="flex items-center gap-3 rounded-lg border border-border/60 bg-bg/40 p-3">
            <div className="relative shrink-0">
              <ScoreRing pct={c.pct} color={c.color} />
              <div className="absolute inset-0 grid place-items-center">
                <div className="font-mono text-sm font-bold" style={{ color: c.color }}>
                  {c.grade}
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-medium">{c.framework}</div>
              <div className="font-mono text-[11px] text-muted">{c.pct}% pass</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
