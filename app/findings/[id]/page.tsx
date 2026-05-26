import { AgentHeader } from "@/components/agent-header";
import { SeverityBadge } from "@/components/severity-badge";
import { getFinding } from "@agent/store";
import { getAgentStatus } from "@/lib/agent-status";
import { shortHash, timeAgo } from "@/lib/cn";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck, Coins, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FindingDetail({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const f = getFinding(id);
  if (!f) notFound();

  const status = await getAgentStatus();

  return (
    <>
      <AgentHeader {...status} />
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent">
          <ArrowLeft size={12} /> Back to dashboard
        </Link>

        <section className="rounded-lg border border-border bg-panel/60 p-6">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={f.severity} />
            {f.cve && (
              <span className="rounded border border-border bg-bg/60 px-2 py-0.5 font-mono text-xs text-muted">
                {f.cve}
              </span>
            )}
            <span className="rounded border border-border bg-bg/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
              {f.category}
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted">
              <Clock size={11} /> {timeAgo(f.discoveredAt)}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{f.title}</h1>
          <p className="mt-1 font-mono text-sm text-muted">{f.target.value}</p>

          <p className="mt-5 leading-relaxed text-fg">{f.description}</p>

          <div className="mt-5 rounded border border-border bg-bg/60 p-4">
            <div className="mb-2 text-[10px] uppercase tracking-widest text-muted">Remediation</div>
            <p className="text-sm leading-relaxed">{f.remediation}</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Card title="Evidence" icon={<ShieldCheck size={14} />}>
            <KV label="Type" value={f.evidence.type} />
            <KV label="Hash" value={<span className="font-mono">{shortHash(f.evidence.artifactHash, 12, 10)}</span>} />
            <pre className="mt-3 overflow-x-auto rounded border border-border bg-bg/80 p-3 font-mono text-[11px] text-muted">
              {f.evidence.snippet}
            </pre>
          </Card>

          <Card title="Billing" icon={<Coins size={14} />}>
            <KV
              label="Amount"
              value={
                <>
                  <span className="font-mono text-accent">{f.billing.amountUsdc}</span>
                  <span className="ml-1 text-muted">USDC</span>
                </>
              }
            />
            <KV label="Status" value={<span className="capitalize">{f.billing.status}</span>} />
            <KV
              label="Dispute window ends"
              value={new Date(f.billing.disputeWindowEnds * 1000).toLocaleString()}
            />
            {f.billing.x402PaymentId && <KV label="x402 payment ID" value={<span className="font-mono">{f.billing.x402PaymentId}</span>} />}
          </Card>
        </section>

        <section className="rounded-lg border border-border bg-panel/40 p-4 text-xs text-muted">
          <KV label="Finding ID" value={<span className="font-mono">{f.findingId}</span>} />
          <KV
            label="Scope grant"
            value={
              <Link href={`/scope-grants?focus=${encodeURIComponent(f.scopeGrantId)}`} className="font-mono text-accent hover:underline">
                {shortHash(f.scopeGrantId)}
              </Link>
            }
          />
          <KV label="Agent ID" value={<span className="font-mono">{f.agentId}</span>} />
          <KV
            label="GOAT explorer"
            value={
              <Link
                href={`https://explorer.goat.network/`}
                target="_blank"
                className="inline-flex items-center gap-1 text-accent hover:underline"
              >
                Open <ExternalLink size={10} />
              </Link>
            }
          />
        </section>
      </main>
    </>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-panel/60 p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-border pb-2 text-sm font-medium">
        {icon}
        {title}
      </div>
      <div className="space-y-1.5 text-sm">{children}</div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-[10px] uppercase tracking-widest text-muted">{label}</span>
      <span className="text-fg">{value}</span>
    </div>
  );
}
