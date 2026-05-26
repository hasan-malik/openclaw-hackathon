"use client";

import { ThreatRadar } from "./threat-radar";
import { ShieldCheck, ExternalLink, Cpu } from "lucide-react";
import Link from "next/link";

type Props = {
  agentId: string | null;
  walletAddress: string | null;
};

export function HeroBanner({ agentId, walletAddress }: Props) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-[#0a0d14] via-[#0a0a10] to-[#0a0a14] p-6 md:p-8">
      <div className="absolute inset-0 noise" />
      <div className="absolute inset-0 scanline opacity-40" />

      <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/5 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-cyan-300">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Active · Mainnet · ERC-8004
          </div>

          <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            <span className="text-fg">Continuous defence</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-red-300 bg-clip-text text-transparent">
              for the agentic economy
            </span>
          </h1>

          <p className="max-w-xl text-sm leading-relaxed text-muted md:text-base">
            ShieldClaw audits thousands of autonomous trading agents in real time, hashes every finding on-chain, and bills per verified vulnerability via x402 USDC micropayments.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {agentId && (
              <Link
                href={`https://8004scan.io/agents/${agentId}?chain=2345`}
                target="_blank"
                className="group inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/5 px-3 py-2 text-xs text-cyan-200 transition hover:bg-cyan-400/10"
              >
                <ShieldCheck size={14} />
                <span className="font-mono">Agent #{agentId}</span>
                <ExternalLink size={11} className="opacity-60 group-hover:opacity-100" />
              </Link>
            )}
            {walletAddress && (
              <Link
                href={`https://explorer.goat.network/address/${walletAddress}`}
                target="_blank"
                className="group inline-flex items-center gap-2 rounded-lg border border-border bg-bg/40 px-3 py-2 font-mono text-xs text-muted transition hover:text-fg"
              >
                <Cpu size={14} className="text-violet-300" />
                {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                <ExternalLink size={11} className="opacity-60 group-hover:opacity-100" />
              </Link>
            )}
            <Link
              href="https://t.me/shieldclaw_agent_bot"
              target="_blank"
              className="group inline-flex items-center gap-2 rounded-lg border border-violet-400/30 bg-violet-400/5 px-3 py-2 text-xs text-violet-200 transition hover:bg-violet-400/10"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-violet-300" aria-hidden>
                <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19l-9.49 5.99-4.1-1.27c-.88-.24-.89-.86.2-1.27l16.07-6.2c.73-.27 1.43.18 1.15 1.32l-2.74 12.95c-.18.79-.66.99-1.34.61l-3.69-2.74-1.78 1.73c-.21.21-.39.39-.79.39z" />
              </svg>
              @shieldclaw_agent_bot
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center md:justify-end">
          <ThreatRadar />
        </div>
      </div>
    </section>
  );
}
