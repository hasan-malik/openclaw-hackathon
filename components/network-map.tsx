"use client";

import { useMemo } from "react";

function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

type Node = { x: number; y: number; label: string; type: "agent" | "target" | "monitor"; threat: "ok" | "warn" | "crit" };

const NODE_COLOR: Record<Node["threat"], string> = {
  ok: "fill-emerald-400 stroke-emerald-300",
  warn: "fill-amber-400 stroke-amber-300",
  crit: "fill-red-500 stroke-red-300"
};

export function NetworkMap() {
  const nodes = useMemo<Node[]>(() => {
    const labels = ["ETH-VAULT", "BTC-LP", "SOL-DEX", "USDC-POOL", "MATIC-BR", "AVAX-NET", "OP-RPC", "ARB-IDX", "GOAT-RT", "SUI-OBJ", "TIA-DA", "BASE-X"];
    return labels.map((label, i) => {
      const r = rand(i);
      let threat: Node["threat"] = "ok";
      if (r > 0.85) threat = "crit";
      else if (r > 0.65) threat = "warn";
      const angle = (i / labels.length) * Math.PI * 2;
      const radius = 36 + rand(i + 5) * 8;
      return {
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius,
        label,
        type: i % 3 === 0 ? "target" : i % 3 === 1 ? "monitor" : "agent",
        threat
      };
    });
  }, []);

  return (
    <div className="rounded-xl border border-border/80 bg-panel/60 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-300">Topology · 87 ecosystems</div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted">
          <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
          synced 0.3s ago
        </div>
      </div>
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-bg/60">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          {/* Connecting lines */}
          {nodes.map((n, i) =>
            nodes.slice(i + 1).map((m, j) => {
              const dist = Math.hypot(m.x - n.x, m.y - n.y);
              if (dist > 30) return null;
              return (
                <line
                  key={`${i}-${j}`}
                  x1={n.x}
                  y1={n.y}
                  x2={m.x}
                  y2={m.y}
                  stroke="rgba(34,211,238,0.15)"
                  strokeWidth={0.2}
                />
              );
            })
          )}
          {/* Centre */}
          <circle cx={50} cy={50} r={3} className="fill-cyan-400 stroke-cyan-300" strokeWidth={0.3} />
          <text x={50} y={50} textAnchor="middle" dominantBaseline="middle" className="fill-bg text-[3px] font-bold">SC</text>
          {/* Centre rings */}
          <circle cx={50} cy={50} r={6} fill="none" stroke="rgba(34,211,238,0.25)" strokeWidth={0.2} />
          <circle cx={50} cy={50} r={10} fill="none" stroke="rgba(34,211,238,0.15)" strokeWidth={0.2} />
          {/* Spokes */}
          {nodes.map((n, i) => (
            <line key={`spoke-${i}`} x1={50} y1={50} x2={n.x} y2={n.y} stroke="rgba(34,211,238,0.08)" strokeWidth={0.2} />
          ))}
          {/* Nodes */}
          {nodes.map((n, i) => (
            <g key={i}>
              <circle
                cx={n.x}
                cy={n.y}
                r={n.threat === "crit" ? 2.4 : 1.8}
                className={NODE_COLOR[n.threat]}
                strokeWidth={0.5}
              />
              <text
                x={n.x}
                y={n.y - 3}
                textAnchor="middle"
                className="fill-fg/70 text-[2.4px] font-mono uppercase"
              >
                {n.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
