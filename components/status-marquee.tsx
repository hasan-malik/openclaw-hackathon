"use client";

const ITEMS = [
  "AGENT #35 — LIVE",
  "GOAT MAINNET · CHAIN 2345",
  "x402 SETTLEMENT ENABLED",
  "ERC-8004 IDENTITY VERIFIED",
  "SCOPE-GRANT GATE ACTIVE",
  "14,322 AGENTS UNDER SURVEILLANCE",
  "USDC.e RAILS ONLINE",
  "DISPUTE WINDOW: 7d",
  "SLA: SUB-SECOND PER FINDING",
  "REPUTATION STAKE: ACTIVE"
];

export function StatusMarquee() {
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <div className="relative overflow-hidden border-y border-cyan-400/15 bg-bg/60">
      <div className="flex whitespace-nowrap marquee">
        {doubled.map((item, i) => (
          <span key={i} className="mx-6 my-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-300/70">
            <span className="mr-2 inline-block h-1.5 w-1.5 -translate-y-0.5 rounded-full bg-cyan-400 live-dot align-middle" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
