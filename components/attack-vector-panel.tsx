"use client";

import { AnimatedCounter } from "./animated-counter";

const VECTORS = [
  { name: "SQL Injection", code: "SQLi", load: 0.78, accent: "text-red-300", bar: "bg-red-400/70" },
  { name: "Credential Exposure", code: "CRED", load: 0.64, accent: "text-orange-300", bar: "bg-orange-400/70" },
  { name: "Port Surface", code: "PORT", load: 0.42, accent: "text-amber-300", bar: "bg-amber-400/70" },
  { name: "SSL / TLS Posture", code: "TLS", load: 0.31, accent: "text-yellow-300", bar: "bg-yellow-400/70" },
  { name: "CVE Templates (nuclei)", code: "CVE", load: 0.88, accent: "text-cyan-300", bar: "bg-cyan-400/70" },
  { name: "Smart Contract Surface", code: "EVM", load: 0.56, accent: "text-violet-300", bar: "bg-violet-400/70" }
];

export function AttackVectorPanel() {
  return (
    <div className="aurora-border rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-300">Attack Surface · Live</div>
          <div className="mt-1 text-lg font-semibold">Detection coverage by vector</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl text-glow text-cyan-300">
            <AnimatedCounter target={87.4} decimals={1} suffix="%" liveIncrement={0.02} />
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted">composite load</div>
        </div>
      </div>

      <div className="space-y-2.5">
        {VECTORS.map((v) => (
          <div key={v.code} className="grid grid-cols-[80px_1fr_50px] items-center gap-3">
            <span className={`font-mono text-[10px] uppercase tracking-widest ${v.accent}`}>{v.code}</span>
            <div className="h-2 overflow-hidden rounded-full bg-bg/80 ring-1 ring-border/60">
              <div
                className={`h-full ${v.bar} transition-all duration-1000`}
                style={{ width: `${Math.round(v.load * 100)}%` }}
              />
            </div>
            <span className="text-right font-mono text-xs text-muted">{Math.round(v.load * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
