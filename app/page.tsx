import { AgentHeader } from "@/components/agent-header";
import { FindingCard } from "@/components/finding-card";
import { ScopeGrantCard } from "@/components/scope-grant-card";
import { StatsRow } from "@/components/stats-row";
import { listFindings, listGrants, upsertFinding, upsertGrant } from "@agent/store";
import { mockFindings, mockGrant } from "@agent/mock-data";
import { getAgentStatus } from "@/lib/agent-status";
import Link from "next/link";
import { Activity, FileSignature } from "lucide-react";

export const dynamic = "force-dynamic";

function seedIfEmpty() {
  if (listGrants().length === 0) upsertGrant(mockGrant);
  if (listFindings().length === 0) {
    for (const f of mockFindings) upsertFinding(f);
  }
}

export default async function DashboardPage() {
  seedIfEmpty();

  const findings = listFindings();
  const grants = listGrants();
  const status = await getAgentStatus();

  return (
    <>
      <AgentHeader
        agentName={status.agentName}
        agentId={status.agentId}
        walletAddress={status.walletAddress}
        usdcBalance={status.usdcBalance}
        registered={status.registered}
      />

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Live audit</h2>
              <p className="text-sm text-muted">
                Continuously scanning authorised targets. Each verified finding is hashed, anchored on GOAT, and
                billed per-item via x402.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="live-dot inline-block h-2 w-2 rounded-full bg-emerald-400" />
              Worker idle · next scan in 5m
            </div>
          </div>

          <StatsRow findings={findings} />
        </section>

        <section className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <SectionHeader title="Findings feed" icon={<Activity size={14} />} count={findings.length}>
              <Link
                href="/findings"
                className="text-xs text-muted hover:text-accent"
              >
                View all →
              </Link>
            </SectionHeader>
            <div className="space-y-3">
              {findings.length === 0 ? (
                <EmptyState text="No findings yet. The worker will populate this once it scans." />
              ) : (
                findings.slice(0, 10).map((f) => <FindingCard key={f.findingId} finding={f} />)
              )}
            </div>
          </div>

          <div className="space-y-3">
            <SectionHeader title="Authorisation" icon={<FileSignature size={14} />} count={grants.length}>
              <Link href="/scope-grants" className="text-xs text-muted hover:text-accent">
                Sign new →
              </Link>
            </SectionHeader>
            <div className="space-y-3">
              {grants.length === 0 ? (
                <EmptyState text="No active scope grants." />
              ) : (
                grants.map((g) => <ScopeGrantCard key={g.grantId} grant={g} />)
              )}
            </div>

            <div className="rounded-lg border border-border bg-panel/40 p-4 text-xs leading-relaxed text-muted">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-fg">Why on-chain consent?</div>
              Unauthorised scanning is a CFAA violation. Every probe ShieldClaw fires must point at a signed grant. No
              grant, no packet.
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function SectionHeader({
  title,
  icon,
  count,
  children
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
        <span className="rounded bg-bg/60 px-1.5 py-0.5 font-mono text-[10px] text-muted">{count}</span>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-panel/30 p-8 text-center text-sm text-muted">
      {text}
    </div>
  );
}
