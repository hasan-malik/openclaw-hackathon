"use client";

import { useEffect, useState } from "react";

type Attack = {
  origin: string;
  region: string;
  vector: string;
  blocked: boolean;
  time: string;
};

const ORIGINS = [
  { o: "185.220.101.45", r: "Frankfurt · DE", flag: "🇩🇪" },
  { o: "104.244.74.211", r: "Ashburn · US", flag: "🇺🇸" },
  { o: "172.247.183.30", r: "Seoul · KR", flag: "🇰🇷" },
  { o: "45.142.214.89", r: "Amsterdam · NL", flag: "🇳🇱" },
  { o: "194.31.0.18", r: "Moscow · RU", flag: "🇷🇺" },
  { o: "159.65.140.119", r: "Singapore · SG", flag: "🇸🇬" },
  { o: "203.0.113.7", r: "São Paulo · BR", flag: "🇧🇷" },
  { o: "51.81.32.4", r: "Sydney · AU", flag: "🇦🇺" },
  { o: "210.45.117.20", r: "Beijing · CN", flag: "🇨🇳" },
  { o: "62.210.198.149", r: "Paris · FR", flag: "🇫🇷" }
];

const VECTORS = ["SQLi probe", "credential stuffing", "TLS downgrade", "JWT none-alg", "SSRF callback", "port-scan TCP/22", "CVE-2024-2812", "git/.env scan"];

function nowStr() {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function GeoAttackFeed() {
  const [attacks, setAttacks] = useState<Attack[]>(() =>
    Array.from({ length: 8 }, (_, i) => {
      const o = ORIGINS[i % ORIGINS.length];
      return {
        origin: o.o,
        region: `${o.flag} ${o.r}`,
        vector: VECTORS[Math.floor(rand(0, VECTORS.length))],
        blocked: Math.random() > 0.15,
        time: nowStr()
      };
    })
  );

  useEffect(() => {
    const id = setInterval(() => {
      setAttacks((curr) => {
        const o = ORIGINS[Math.floor(Math.random() * ORIGINS.length)];
        const next: Attack = {
          origin: o.o,
          region: `${o.flag} ${o.r}`,
          vector: VECTORS[Math.floor(Math.random() * VECTORS.length)],
          blocked: Math.random() > 0.1,
          time: nowStr()
        };
        return [next, ...curr].slice(0, 12);
      });
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="rounded-xl border border-border/80 bg-panel/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-300">Global Attack Feed</div>
          <div className="mt-1 text-lg font-semibold">Incoming probes · live</div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted">
          <span className="live-dot inline-block h-2 w-2 rounded-full bg-red-400" />
          12,847 blocked · 24h
        </div>
      </div>

      <div className="space-y-1.5">
        {attacks.map((a, i) => (
          <div
            key={`${a.origin}-${a.time}-${i}`}
            className="slide-up grid grid-cols-[60px_140px_1fr_70px] items-center gap-2 rounded-md border border-border/40 bg-bg/40 px-2.5 py-1.5 font-mono text-[11px] hover:border-cyan-400/30"
          >
            <span className="text-muted">{a.time}</span>
            <span className="truncate text-fg/70">{a.region}</span>
            <span className="truncate text-fg">
              <span className="text-cyan-300/60">{a.origin}</span> <span className="text-muted/60">→</span> {a.vector}
            </span>
            <span
              className={`justify-self-end rounded px-1.5 py-0.5 text-[9px] uppercase tracking-widest ${
                a.blocked
                  ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                  : "bg-red-500/20 text-red-300 ring-1 ring-red-500/40"
              }`}
            >
              {a.blocked ? "blocked" : "alert"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
