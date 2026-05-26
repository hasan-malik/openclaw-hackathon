"use client";

import { useEffect, useRef, useState } from "react";

const SEED = [
  "POST /api/v1/orders → 402 order_id=3dc3315b-e4ba-4a36",
  "TRANSFER 5.000000 USDC.e tx 0x7cccfeafdf27f069…",
  "SCAN target=eth-vault-3 modules=[nuclei,credscan]",
  "GUARDRAIL refuse target=example.com reason=no_grant",
  "SCOPE_VERIFY pass grant=0xa1f9…ab12",
  "SIGNAL nuclei.template=exposed-env severity=critical",
  "ANCHOR sha256=0x91be3ea7c64a0b… → goat:9182374",
  "CHARGE finding=0xa40e98… amount=20.00 USDC status=pending",
  "DISPUTE-WINDOW finding=0xd8eb6f07… expires_in=6d 11h",
  "ROTATE wallet-balance=14.27 USDC.e gas=0.000079 BTC",
  "WATCH 14,322 agents · sandbox throughput=2.1k tx/s",
  "MATCH cve.CVE-2024-2812 → finding pending review",
  "TLS WARN cipher=TLS_RSA_WITH_AES_128_CBC_SHA target=arb-idx-7",
  "PORT 5432 OPEN host=10.0.34.91 service=postgres (denied)",
  "SCAN-ITERATION batch=17283 took=412ms findings=4 new=2",
  "STATE clean=42d incident-free uptime=99.74%",
  "AGENT_RESPONSE check_scope target=http://juice-shop authorised=true"
];

function ts() {
  const d = new Date();
  return d.toISOString().slice(11, 19);
}

export function ActivityTerminal() {
  const [lines, setLines] = useState<string[]>(() => SEED.slice(0, 8).map((s) => `[${ts()}] ${s}`));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setLines((curr) => {
        const next = SEED[Math.floor(Math.random() * SEED.length)];
        const out = [...curr, `[${ts()}] ${next}`];
        return out.slice(-40);
      });
    }, 850);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  return (
    <div className="rounded-xl border border-border/80 bg-bg/80 p-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 font-mono text-[11px] uppercase tracking-widest text-muted">
            shieldclaw://agent-35 · tail -f
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-emerald-300">
          <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
          STREAMING
        </span>
      </div>
      <div ref={ref} className="h-64 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed">
        {lines.map((line, i) => (
          <div key={i} className="slide-up text-fg/70 hover:text-fg">
            <span className="text-cyan-400/60">›</span> {line}
          </div>
        ))}
      </div>
    </div>
  );
}
