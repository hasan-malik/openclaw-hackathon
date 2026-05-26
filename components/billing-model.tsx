"use client";

import { AnimatedCounter } from "./animated-counter";
import { Coins, Zap, AlertTriangle, ShieldCheck } from "lucide-react";

const TIERS = [
  { label: "Info",     price: "0.00",  color: "text-slate-400",  border: "border-slate-400/20", bg: "bg-slate-400/5" },
  { label: "Low",      price: "0.001", color: "text-cyan-300",   border: "border-cyan-400/25",  bg: "bg-cyan-400/5"  },
  { label: "Medium",   price: "0.002", color: "text-amber-300",  border: "border-amber-400/25", bg: "bg-amber-400/5" },
  { label: "High",     price: "0.003", color: "text-orange-300", border: "border-orange-400/25",bg: "bg-orange-400/5"},
  { label: "Critical", price: "0.005", color: "text-red-300",    border: "border-red-400/25",   bg: "bg-red-400/5"  },
];

export function BillingModel() {
  return (
    <section className="rounded-xl border border-border/80 bg-panel/60 p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-300">Billing Model</div>
          <div className="mt-1 text-lg font-semibold">Pay per finding. Nothing if we find nothing.</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl text-glow text-emerald-300">
            <AnimatedCounter target={0} prefix="$" decimals={2} />
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted">scan fee · always</div>
        </div>
      </div>

      {/* Guarantee banner */}
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-emerald-400/30 bg-emerald-400/5 px-4 py-3">
        <ShieldCheck size={18} className="shrink-0 text-emerald-300" />
        <div>
          <div className="text-sm font-medium text-emerald-200">Zero-cost guarantee</div>
          <div className="text-[11px] text-emerald-300/70">
            If ShieldClaw finds no vulnerabilities, you pay nothing. No scan fee, no monitoring fee, no invoice. Ever.
          </div>
        </div>
      </div>

      {/* Per-severity pricing */}
      <div className="mb-4">
        <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted">Per-finding price · paid via x402 on confirmation</div>
        <div className="grid grid-cols-5 gap-2">
          {TIERS.map((t) => (
            <div key={t.label} className={`rounded-lg border ${t.border} ${t.bg} p-3 text-center`}>
              <div className={`text-[10px] uppercase tracking-widest ${t.color}`}>{t.label}</div>
              <div className={`mt-1 font-mono text-xl font-semibold ${t.color}`}>
                {t.price === "0.000" ? <span className="text-base text-muted">free</span> : `$${t.price}`}
              </div>
              <div className="mt-0.5 text-[9px] text-muted">USDC</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-md border border-cyan-400/15 bg-cyan-400/5 px-4 py-3 md:grid-cols-4">
        <Footer label="Payment method" value="x402 · instant USDC" icon={<Zap size={12} className="text-cyan-300" />} />
        <Footer label="Dispute window" value="7 days · on-chain" icon={<AlertTriangle size={12} className="text-cyan-300" />} />
        <Footer label="False positive" value="0 charge · rep slashed" icon={<ShieldCheck size={12} className="text-cyan-300" />} />
        <Footer label="Scan fee" value="$0.00 · always" icon={<Coins size={12} className="text-cyan-300" />} />
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  prefix,
  suffix,
  decimals,
  accent
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  accent: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted">{label}</div>
      <div className={`mt-0.5 font-mono text-xl ${accent}`}>
        <AnimatedCounter target={value} prefix={prefix} suffix={suffix} decimals={decimals ?? 0} />
      </div>
    </div>
  );
}

function Footer({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      {icon}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted">{label}</div>
        <div className="text-fg/80">{value}</div>
      </div>
    </div>
  );
}
