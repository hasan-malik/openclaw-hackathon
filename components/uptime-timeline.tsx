"use client";

import { useMemo } from "react";

function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

type Status = "ok" | "warn" | "breach";

const COLORS: Record<Status, string> = {
  ok: "bg-emerald-500/70 hover:bg-emerald-400",
  warn: "bg-amber-400/80 hover:bg-amber-300",
  breach: "bg-red-500/80 hover:bg-red-400"
};

export function UptimeTimeline() {
  const segments = useMemo(() => {
    return Array.from({ length: 90 }, (_, i) => {
      const roll = rand(i + 17);
      let status: Status = "ok";
      if (roll > 0.92) status = "breach";
      else if (roll > 0.82) status = "warn";
      const daysAgo = 89 - i;
      return { status, daysAgo };
    });
  }, []);

  const breachCount = segments.filter((s) => s.status === "breach").length;
  const warnCount = segments.filter((s) => s.status === "warn").length;
  const okCount = segments.length - breachCount - warnCount;
  const uptimePct = ((okCount / segments.length) * 100).toFixed(2);

  return (
    <div className="rounded-xl border border-border/80 bg-panel/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-300">Security Posture · 90 days</div>
          <div className="mt-1 text-lg font-semibold">
            <span className="font-mono text-emerald-300">{uptimePct}%</span>
            <span className="ml-2 text-sm text-muted">clean (no findings)</span>
          </div>
        </div>
        <div className="flex gap-3 text-xs">
          <Legend dot="bg-emerald-500" label={`${okCount}d clean`} />
          <Legend dot="bg-amber-400" label={`${warnCount}d warnings`} />
          <Legend dot="bg-red-500" label={`${breachCount}d critical`} />
        </div>
      </div>

      <div className="flex gap-[2px]">
        {segments.map((s, i) => (
          <div
            key={i}
            className={`group relative h-12 flex-1 cursor-pointer rounded-sm transition ${COLORS[s.status]}`}
            title={`${s.daysAgo}d ago — ${s.status}`}
          >
            <div className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded border border-border bg-bg px-2 py-1 text-[10px] text-fg group-hover:block">
              {s.daysAgo}d ago · {s.status}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex justify-between font-mono text-[10px] text-muted">
        <span>90d ago</span>
        <span>60d</span>
        <span>30d</span>
        <span>today →</span>
      </div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
      <span className={`h-2 w-2 rounded-sm ${dot}`} />
      {label}
    </span>
  );
}
