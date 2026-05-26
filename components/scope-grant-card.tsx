import type { ScopeGrant } from "@shared/types";
import { shortHash } from "@/lib/cn";
import { ShieldCheck, Clock } from "lucide-react";

function fmtDate(unix: number) {
  return new Date(unix * 1000).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function ScopeGrantCard({ grant }: { grant: ScopeGrant }) {
  const now = Math.floor(Date.now() / 1000);
  const active = now >= grant.notBefore && now <= grant.notAfter;

  return (
    <div className="rounded-lg border border-border bg-panel/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className={active ? "text-emerald-400" : "text-muted"} />
          <span className="text-sm font-medium">{active ? "Active grant" : "Expired"}</span>
        </div>
        <span className="rounded border border-border bg-bg/40 px-2 py-0.5 font-mono text-[10px] text-muted">
          {grant.intensity}
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        {grant.targets.map((t, i) => (
          <div key={i} className="flex items-center gap-2 font-mono text-sm">
            <span className="rounded bg-bg/60 px-1.5 py-0.5 text-[10px] uppercase text-muted">{t.kind}</span>
            <span>{t.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {grant.scanTypes.map((s) => (
          <span key={s} className="rounded border border-border bg-bg/40 px-1.5 py-0.5 font-mono text-[10px]">
            {s}
          </span>
        ))}
        {grant.ports.map((p) => (
          <span key={p} className="rounded border border-border bg-bg/40 px-1.5 py-0.5 font-mono text-[10px] text-muted">
            :{p}
          </span>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border/60 pt-3 text-[11px] text-muted">
        <div>
          <div className="text-[10px] uppercase tracking-widest">Customer</div>
          <div className="mt-0.5 font-mono">{shortHash(grant.customer)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest">Grant ID</div>
          <div className="mt-0.5 font-mono">{shortHash(grant.grantId)}</div>
        </div>
        <div className="col-span-2 flex items-center gap-1">
          <Clock size={11} />
          {fmtDate(grant.notBefore)} → {fmtDate(grant.notAfter)}
        </div>
      </div>
    </div>
  );
}
