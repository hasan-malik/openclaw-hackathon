import { AgentHeader } from "@/components/agent-header";
import { ScopeGrantCard } from "@/components/scope-grant-card";
import { listGrants } from "@agent/store";
import { getAgentStatus } from "@/lib/agent-status";
import Link from "next/link";
import { ArrowLeft, FileSignature } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ScopeGrantsPage() {
  const grants = listGrants();
  const status = await getAgentStatus();

  return (
    <>
      <AgentHeader {...status} />
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent">
          <ArrowLeft size={12} /> Back to dashboard
        </Link>

        <header className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Scope grants</h1>
            <p className="mt-1 text-sm text-muted">
              EIP-712 signed authorisations from customers. The agent will refuse any scan that doesn't map to an
              active grant.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs text-accent">
            <FileSignature size={12} />
            Sign new grant (coming)
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {grants.map((g) => (
            <ScopeGrantCard key={g.grantId} grant={g} />
          ))}
        </div>

        <section className="rounded-lg border border-border bg-panel/40 p-5 text-sm leading-relaxed text-muted">
          <h3 className="mb-2 text-sm font-medium text-fg">How scope grants work</h3>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>Customer signs a typed-data message (EIP-712) declaring what may be scanned, when, and how.</li>
            <li>The signature + grant hash is anchored on GOAT for verifiable provenance.</li>
            <li>Before any packet leaves the agent, it checks the request against the active grant locally.</li>
            <li>Grants are revocable by the customer at any time; revocation is reflected on-chain.</li>
          </ol>
        </section>
      </main>
    </>
  );
}
