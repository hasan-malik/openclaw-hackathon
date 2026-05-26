"use client";

import { useEffect, useState } from "react";

type Token = { symbol: string; pct: number; color: string };

const TOKENS: Token[] = [
  { symbol: "ETH", pct: 96, color: "#627eea" },
  { symbol: "BTC", pct: 91, color: "#f7931a" },
  { symbol: "USDC", pct: 99, color: "#22d3ee" },
  { symbol: "USDT", pct: 88, color: "#26a17b" },
  { symbol: "SOL", pct: 79, color: "#9945ff" },
  { symbol: "MATIC", pct: 72, color: "#8247e5" },
  { symbol: "ARB", pct: 81, color: "#28a0f0" },
  { symbol: "OP", pct: 75, color: "#ff0420" },
  { symbol: "AVAX", pct: 67, color: "#e84142" },
  { symbol: "GOAT", pct: 100, color: "#fbbf24" },
  { symbol: "SUI", pct: 54, color: "#4da2ff" },
  { symbol: "TIA", pct: 47, color: "#7b2bf9" }
];

function Tile({ token, animated }: { token: Token; animated: boolean }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = animated ? circ * (1 - token.pct / 100) : circ;
  return (
    <div className="flex flex-col items-center rounded-lg border border-border/60 bg-bg/40 p-3 transition hover:scale-105">
      <div className="relative h-14 w-14">
        <svg viewBox="-28 -28 56 56" className="h-14 w-14 -rotate-90">
          <circle r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
          <circle
            r={r}
            fill="none"
            stroke={token.color}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(0.16,1,0.3,1)" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-[10px] font-bold" style={{ color: token.color }}>
            {token.symbol}
          </span>
        </div>
      </div>
      <div className="mt-1 font-mono text-[11px] text-muted">{token.pct}%</div>
    </div>
  );
}

export function TokenCoverage() {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="rounded-xl border border-border/80 bg-panel/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-300">Token Coverage · 87 ecosystems</div>
          <div className="mt-1 text-lg font-semibold">Detection across cryptocurrencies</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl text-glow text-cyan-300">12 / 87</div>
          <div className="text-[10px] uppercase tracking-widest text-muted">top by volume</div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-12">
        {TOKENS.map((t) => (
          <Tile key={t.symbol} token={t} animated={animated} />
        ))}
      </div>
    </section>
  );
}
