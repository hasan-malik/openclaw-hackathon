import { FindingCard } from "@/components/finding-card";
import { ScopeGrantCard } from "@/components/scope-grant-card";
import { HeroBanner } from "@/components/hero-banner";
import { HeroMetrics } from "@/components/hero-metrics";
import { StatusMarquee } from "@/components/status-marquee";
import { AttackVectorPanel } from "@/components/attack-vector-panel";
import { UptimeTimeline } from "@/components/uptime-timeline";
import { SeverityDonut } from "@/components/severity-donut";
import { NetworkMap } from "@/components/network-map";
import { AnimatedGauges } from "@/components/animated-gauges";
import { ActivityTerminal } from "@/components/activity-terminal";
import { TopThreatsBars } from "@/components/top-threats-bars";
import { ComplianceScorecard } from "@/components/compliance-scorecard";
import { ThreatHeatmap } from "@/components/threat-heatmap";
import { GeoAttackFeed } from "@/components/geo-attack-feed";
import { LatencySparkline } from "@/components/latency-sparkline";
import { TokenCoverage } from "@/components/token-coverage";
import { ChatWidget } from "@/components/chat-widget";
import { listFindings, listGrants, upsertFinding, upsertGrant } from "@agent/store";
import { mockFindings, mockGrant } from "@agent/mock-data";
import { getAgentStatus } from "@/lib/agent-status";
import Link from "next/link";
import { Activity, FileSignature, ShieldCheck } from "lucide-react";

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

  const paidUsdc = findings
    .filter((f) => f.billing.status === "paid")
    .reduce((s, f) => s + Number(f.billing.amountUsdc), 0);
  const onchainTxCount = findings.filter((f) => f.billing.status === "paid").length + 1;

  return (
    <>
      <StatusMarquee />

      <main className="relative mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        <HeroBanner agentId={status.agentId} walletAddress={status.walletAddress} />

        <HeroMetrics findingsCount={findings.length} paidUsdc={paidUsdc} onchainTxCount={onchainTxCount} />

        <AnimatedGauges />

        <UptimeTimeline />

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AttackVectorPanel />
          </div>
          <SeverityDonut findings={findings} />
        </section>

        <LatencySparkline />

        <TokenCoverage />

        <section className="grid gap-6 lg:grid-cols-2">
          <TopThreatsBars />
          <GeoAttackFeed />
        </section>

        <ComplianceScorecard />

        <ThreatHeatmap />

        <section className="grid gap-6 lg:grid-cols-2">
          <NetworkMap />
          <ActivityTerminal />
        </section>

        {/* Live findings + scope grants */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <SectionHeader title="Live findings feed" icon={<Activity size={14} />} count={findings.length}>
              <Link href="/findings" className="text-xs text-muted hover:text-cyan-300">
                View all →
              </Link>
            </SectionHeader>
            <div className="space-y-3">
              {findings.length === 0 ? (
                <EmptyState text="No findings yet. The worker will populate this once it scans." />
              ) : (
                findings.slice(0, 10).map((f, i) => (
                  <div key={f.findingId} className="slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <FindingCard finding={f} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3">
            <SectionHeader title="Signed scope grants" icon={<FileSignature size={14} />} count={grants.length}>
              <Link href="/scope-grants" className="text-xs text-muted hover:text-cyan-300">
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

            <div className="rounded-xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/5 to-violet-400/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-cyan-300">
                <ShieldCheck size={12} />
                Why on-chain consent?
              </div>
              <p className="text-xs leading-relaxed text-fg/80">
                Unauthorised scanning is a CFAA violation. Every probe ShieldClaw fires must point at a signed scope grant. No grant — no packet. Verifiable, revocable, machine-readable.
              </p>
            </div>
          </div>
        </section>
      </main>

      <ChatWidget />
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
    <div className="flex items-center justify-between border-b border-cyan-400/15 pb-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="text-cyan-300">{icon}</span>
        <span className="uppercase tracking-[0.15em] text-fg/90">{title}</span>
        <span className="rounded bg-cyan-400/10 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">{count}</span>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-panel/30 p-8 text-center text-sm text-muted">
      {text}
    </div>
  );
}
