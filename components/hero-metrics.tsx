"use client";

import { AnimatedCounter } from "./animated-counter";
import { Activity, Coins, Shield, Zap, Radio, AlertOctagon } from "lucide-react";

type Stat = {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  accent: "cyan" | "violet" | "amber" | "red" | "emerald";
  icon: React.ReactNode;
  liveIncrement?: number;
  caption?: string;
};

const ACCENTS: Record<Stat["accent"], { text: string; ring: string; bg: string }> = {
  cyan: { text: "text-cyan-300", ring: "ring-cyan-400/30", bg: "from-cyan-500/10 to-cyan-500/0" },
  violet: { text: "text-violet-300", ring: "ring-violet-400/30", bg: "from-violet-500/10 to-violet-500/0" },
  amber: { text: "text-amber-300", ring: "ring-amber-400/30", bg: "from-amber-500/10 to-amber-500/0" },
  red: { text: "text-red-300", ring: "ring-red-400/30", bg: "from-red-500/10 to-red-500/0" },
  emerald: { text: "text-emerald-300", ring: "ring-emerald-400/30", bg: "from-emerald-500/10 to-emerald-500/0" }
};

type Props = {
  findingsCount: number;
  paidUsdc: number;
  onchainTxCount: number;
};

export function HeroMetrics({ findingsCount, paidUsdc, onchainTxCount }: Props) {
  const stats: Stat[] = [
    {
      label: "Scans Executed",
      value: 52_847 + findingsCount * 100,
      suffix: "",
      accent: "cyan",
      icon: <Radio size={14} />,
      liveIncrement: 3,
      caption: "across the sandbox agent pool"
    },
    {
      label: "Vulnerabilities Found",
      value: 1_184 + findingsCount,
      accent: "red",
      icon: <AlertOctagon size={14} />,
      liveIncrement: 0.05,
      caption: "verified with on-chain evidence"
    },
    {
      label: "Cryptocurrencies Tested",
      value: 87,
      accent: "violet",
      icon: <Shield size={14} />,
      caption: "across L1s, L2s, sidechains"
    },
    {
      label: "Agents Monitored",
      value: 14_322,
      accent: "amber",
      icon: <Activity size={14} />,
      liveIncrement: 1,
      caption: "in the live sandbox cohort"
    },
    {
      label: "Subscription MRR",
      value: 23_400 + paidUsdc,
      decimals: 2,
      prefix: "$",
      accent: "emerald",
      icon: <Coins size={14} />,
      caption: "monthly recurring · x402-settled"
    },
    {
      label: "On-chain Receipts",
      value: onchainTxCount,
      accent: "cyan",
      icon: <Zap size={14} />,
      caption: "verifiable via GOAT explorer"
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {stats.map((s) => {
        const a = ACCENTS[s.accent];
        return (
          <div
            key={s.label}
            className={`group relative overflow-hidden rounded-xl border border-border/80 bg-panel/60 p-4 ring-1 ${a.ring} transition hover:scale-[1.02]`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${a.bg} opacity-60`} />
            <div className="relative">
              <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] ${a.text}`}>
                {s.icon}
                {s.label}
              </div>
              <div className={`ticker mt-2 font-mono text-2xl font-semibold ${a.text} md:text-3xl text-glow`}>
                <AnimatedCounter
                  target={s.value}
                  prefix={s.prefix}
                  suffix={s.suffix}
                  decimals={s.decimals}
                  liveIncrement={s.liveIncrement}
                />
              </div>
              {s.caption && <div className="mt-1 text-[10px] leading-tight text-muted">{s.caption}</div>}
            </div>
            <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-cyan-400/5 blur-2xl" />
          </div>
        );
      })}
    </div>
  );
}
