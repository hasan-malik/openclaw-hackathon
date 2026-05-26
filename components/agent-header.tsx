import Link from "next/link";
import { shortHash } from "@/lib/cn";
import { ShieldCheck, ExternalLink } from "lucide-react";

type Props = {
  agentName: string;
  agentId: string | null;
  walletAddress: string | null;
  usdcBalance: string | null;
  registered: boolean;
};

export function AgentHeader({ agentName, agentId, walletAddress, usdcBalance, registered }: Props) {
  return (
    <header className="border-b border-border bg-panel/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent/10 text-accent glow">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">ShieldClaw</h1>
            <p className="text-xs text-muted">Autonomous security auditor · GOAT mainnet</p>
          </div>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          <Stat label="Agent">
            <span className="font-mono text-sm">{agentName}</span>
            {agentId && (
              <Link
                href={`https://8004scan.io/agents/${agentId}?chain=2345`}
                target="_blank"
                className="ml-1 inline-flex items-center gap-1 text-accent hover:underline"
              >
                #{agentId}
                <ExternalLink size={11} />
              </Link>
            )}
          </Stat>
          <Stat label="Wallet">
            {walletAddress ? (
              <Link
                href={`https://explorer.goat.network/address/${walletAddress}`}
                target="_blank"
                className="font-mono text-sm text-fg hover:text-accent"
              >
                {shortHash(walletAddress)}
              </Link>
            ) : (
              <span className="text-muted">—</span>
            )}
          </Stat>
          <Stat label="USDC">
            <span className="font-mono text-sm">{usdcBalance ?? "—"}</span>
          </Stat>
          <div className="flex items-center gap-2 rounded-full border border-border bg-bg/50 px-3 py-1 text-xs">
            <span
              className={`live-dot inline-block h-2 w-2 rounded-full ${
                registered ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            {registered ? "ERC-8004 registered" : "Not yet registered"}
          </div>
        </div>
      </div>
    </header>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-widest text-muted">{label}</span>
      <span>{children}</span>
    </div>
  );
}
