"use client";

import { AnimatedCounter } from "./animated-counter";
import { Coins, Zap, AlertTriangle, Repeat } from "lucide-react";

export function BillingModel() {
  return (
    <section className="rounded-xl border border-border/80 bg-panel/60 p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-300">Billing Model</div>
          <div className="mt-1 text-lg font-semibold">Two x402 primitives. One protocol.</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl text-glow text-emerald-300">
            <AnimatedCounter target={29_730.5} prefix="$" decimals={2} liveIncrement={0.3} />
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted">total revenue · 30d</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Subscription column */}
        <div className="rounded-lg border border-emerald-400/25 bg-emerald-400/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-emerald-400/15 text-emerald-300">
              <Repeat size={14} />
            </div>
            <div>
              <div className="text-xs font-medium text-emerald-200">Monthly subscription</div>
              <div className="text-[10px] text-emerald-300/70">recurring · per asset under watch</div>
            </div>
            <div className="ml-auto rounded-full border border-emerald-400/30 bg-bg/40 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
              $50 / mo · asset
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Assets watched" value={468} accent="text-emerald-300" />
            <Stat label="Active customers" value={47} accent="text-emerald-300" />
            <Stat label="MRR" value={23_400} prefix="$" accent="text-emerald-300" />
            <Stat label="Renewal rate" value={94} suffix="%" decimals={0} accent="text-emerald-300" />
          </div>
          <div className="mt-3 rounded-md bg-bg/40 px-3 py-2 text-[11px] leading-relaxed text-emerald-200/80">
            Auto-settles via x402 at month boundary. Includes continuous monitoring + info/low/medium findings.
          </div>
        </div>

        {/* Urgency column */}
        <div className="rounded-lg border border-red-400/25 bg-red-400/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-red-400/15 text-red-300">
              <Zap size={14} />
            </div>
            <div>
              <div className="text-xs font-medium text-red-200">Urgency premium</div>
              <div className="text-[10px] text-red-300/70">event-driven · critical &amp; high only</div>
            </div>
            <div className="ml-auto rounded-full border border-red-400/30 bg-bg/40 px-2 py-0.5 font-mono text-[10px] text-red-300">
              $20 / $5
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Critical fires" value={117} accent="text-red-300" />
            <Stat label="High fires" value={384} accent="text-orange-300" />
            <Stat label="Premium rev" value={4_260} prefix="$" accent="text-red-300" />
            <Stat label="Avg time-to-fire" value={2.3} suffix="s" decimals={1} accent="text-red-300" />
          </div>
          <div className="mt-3 rounded-md bg-bg/40 px-3 py-2 text-[11px] leading-relaxed text-red-200/80">
            Immediate x402 micropayment when a critical or high finding lands. Aligns incentives without breaking the subscription model.
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-md border border-cyan-400/15 bg-cyan-400/5 px-4 py-3 md:grid-cols-4">
        <Footer label="Combined per-customer" value="$632 / mo · avg" icon={<Coins size={12} className="text-cyan-300" />} />
        <Footer label="Dispute rate" value="2.4% · 7d window" icon={<AlertTriangle size={12} className="text-cyan-300" />} />
        <Footer label="On-chain receipts" value="501 · 30d" icon={<Zap size={12} className="text-cyan-300" />} />
        <Footer label="Reputation stake" value="Active · 0 slashings" icon={<Repeat size={12} className="text-cyan-300" />} />
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
