import Link from "next/link";
import type { Finding } from "@shared/types";
import { SeverityBadge } from "./severity-badge";
import { shortHash, timeAgo } from "@/lib/cn";
import { ExternalLink, Coins, AlertTriangle, Check, X, Clock } from "lucide-react";

const STATUS: Record<Finding["billing"]["status"], { label: string; icon: React.ReactNode; cls: string }> = {
  pending: { label: "Pending", icon: <Clock size={11} />, cls: "text-muted border-border" },
  confirmed: { label: "Confirmed", icon: <Check size={11} />, cls: "text-emerald-300 border-emerald-700/40" },
  paid: { label: "Paid", icon: <Coins size={11} />, cls: "text-accent border-accent/40 bg-accent/5" },
  disputed: { label: "Disputed", icon: <AlertTriangle size={11} />, cls: "text-high border-high/40" },
  slashed: { label: "Slashed", icon: <X size={11} />, cls: "text-critical border-critical/40" }
};

export function FindingCard({ finding }: { finding: Finding }) {
  const status = STATUS[finding.billing.status];

  return (
    <Link
      href={`/findings/${encodeURIComponent(finding.findingId)}`}
      className="block rounded-lg border border-border bg-panel/60 p-4 transition hover:border-accent/40 hover:bg-panel"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={finding.severity} />
            {finding.cve && (
              <span className="rounded border border-border bg-bg/60 px-2 py-0.5 font-mono text-[11px] text-muted">
                {finding.cve}
              </span>
            )}
            <span className="text-xs text-muted">{timeAgo(finding.discoveredAt)}</span>
          </div>
          <h3 className="mt-2 truncate font-medium text-fg">{finding.title}</h3>
          <p className="mt-1 truncate font-mono text-xs text-muted">{finding.target.value}</p>
        </div>

        <div className="flex flex-col items-end gap-1.5 text-right">
          <span className="font-mono text-sm">
            <span className="text-accent">{finding.billing.amountUsdc}</span>
            <span className="ml-1 text-muted">USDC</span>
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${status.cls}`}
          >
            {status.icon}
            {status.label}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted">
        <span className="font-mono">{shortHash(finding.findingId)}</span>
        {finding.billing.x402PaymentId && (
          <span className="inline-flex items-center gap-1">
            x402 <span className="font-mono">{shortHash(finding.billing.x402PaymentId, 6, 4)}</span>
            <ExternalLink size={10} />
          </span>
        )}
      </div>
    </Link>
  );
}
