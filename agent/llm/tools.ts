import { createHash } from "node:crypto";
import { listFindings, listGrants, getFinding, upsertFinding, upsertGrant } from "@agent/store";
import { pricingForSeverity } from "@agent/scanner";
import { getAgentStatus } from "@/lib/agent-status";
import { isTargetInScope, signScopeGrant } from "@onchain/scope-grant";
import { triggerPayment, hasX402Configured } from "@onchain/x402";
import type { Finding, Severity, ScopeGrant } from "@shared/types";

export type ToolSchema = {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
};

export const TOOL_SCHEMAS: ToolSchema[] = [
  {
    name: "get_agent_identity",
    description:
      "Return the agent's ERC-8004 identity (agent ID, name), wallet address, USDC balance, and whether it's registered on the GOAT mainnet registry.",
    input_schema: { type: "object", properties: {} }
  },
  {
    name: "get_pricing",
    description: "Return ShieldClaw's per-finding pricing schedule.",
    input_schema: { type: "object", properties: {} }
  },
  {
    name: "list_scope_grants",
    description:
      "List active customer-signed scope grants. Each grant defines which target(s) the agent may scan, with what intensity, until when.",
    input_schema: { type: "object", properties: {} }
  },
  {
    name: "check_scope",
    description:
      "Check whether a given target URL or domain is covered by an active scope grant. Use this BEFORE proposing or running a scan, so you can be transparent with the user.",
    input_schema: {
      type: "object",
      properties: {
        target: { type: "string", description: "URL, domain, or IP to check, e.g. 'example.com' or 'http://target/api'" }
      },
      required: ["target"]
    }
  },
  {
    name: "sign_scope_grant",
    description:
      "Sign a new EIP-712 scope grant authorising the agent to scan a target. The agent's wallet acts as the signer (demo mode). Requires AGENT_PRIVATE_KEY in env.",
    input_schema: {
      type: "object",
      properties: {
        target: { type: "string", description: "Domain or hostname to authorise" },
        durationHours: { type: "number", description: "How long the grant is valid (1–720)" },
        scanTypes: {
          type: "array",
          items: { type: "string", enum: ["nuclei", "nmap", "credscan"] },
          description: "Scan types allowed under this grant. Default ['nuclei','credscan']."
        },
        intensity: {
          type: "string",
          enum: ["passive", "active", "intrusive"],
          description: "Default 'passive'. 'active'/'intrusive' require user confirmation in chat."
        }
      },
      required: ["target", "durationHours"]
    }
  },
  {
    name: "list_findings",
    description: "List the most recent findings the agent has discovered, optionally filtered by severity.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max findings (default 10)" },
        severity: { type: "string", enum: ["info", "low", "medium", "high", "critical"] }
      }
    }
  },
  {
    name: "request_scan",
    description:
      "Request a scan of a target. This tool MUST refuse if the target is not covered by an active scope grant. Returns the scope-check result; the actual scan is enqueued for the worker.",
    input_schema: {
      type: "object",
      properties: { target: { type: "string" } },
      required: ["target"]
    }
  },
  {
    name: "pay_finding",
    description:
      "Trigger an x402 USDC micropayment for a confirmed finding. Returns the payment ID and tx hash if available. Stubs cleanly if merchant credentials aren't configured.",
    input_schema: {
      type: "object",
      properties: { findingId: { type: "string" } },
      required: ["findingId"]
    }
  },
  {
    name: "dispute_finding",
    description: "Mark a finding as disputed by the customer. Disputed findings won't be billed and slash agent reputation.",
    input_schema: {
      type: "object",
      properties: {
        findingId: { type: "string" },
        reason: { type: "string" }
      },
      required: ["findingId", "reason"]
    }
  }
];

type ToolHandler = (input: any) => Promise<unknown>;

const HANDLERS: Record<string, ToolHandler> = {
  get_agent_identity: async () => {
    const status = await getAgentStatus();
    return {
      ...status,
      registryUrl: status.agentId ? `https://8004scan.io/agents/${status.agentId}?chain=2345` : null
    };
  },

  get_pricing: async () => ({
    currency: "USDC",
    perFinding: {
      info: "0.10",
      low: "0.25",
      medium: "1.00",
      high: "5.00",
      critical: "20.00"
    },
    disputeWindowDays: 7,
    note: "Customer can dispute any finding within 7 days. Disputed findings are not billed and slash agent reputation."
  }),

  list_scope_grants: async () => {
    const grants = listGrants();
    return {
      count: grants.length,
      grants: grants.map((g) => ({
        grantId: g.grantId,
        targets: g.targets,
        intensity: g.intensity,
        scanTypes: g.scanTypes,
        notBefore: g.notBefore,
        notAfter: g.notAfter,
        active: Date.now() / 1000 >= g.notBefore && Date.now() / 1000 <= g.notAfter
      }))
    };
  },

  check_scope: async ({ target }: { target: string }) => {
    const grants = listGrants();
    const normalised = target.startsWith("http") ? target : `http://${target}`;
    for (const g of grants) {
      if (isTargetInScope(g, { kind: "url", value: normalised })) {
        return {
          authorised: true,
          grantId: g.grantId,
          intensity: g.intensity,
          expiresAt: g.notAfter
        };
      }
    }
    return {
      authorised: false,
      reason: "No active scope grant covers this target. Ask the customer to sign one via sign_scope_grant."
    };
  },

  sign_scope_grant: async (input: {
    target: string;
    durationHours: number;
    scanTypes?: ("nuclei" | "nmap" | "credscan")[];
    intensity?: "passive" | "active" | "intrusive";
  }) => {
    const pk = process.env.AGENT_PRIVATE_KEY as `0x${string}` | undefined;
    const customer = process.env.AGENT_ADDRESS as `0x${string}` | undefined;
    const agentId = process.env.AGENT_ID || "shieldclaw_demo";

    if (!pk || !customer) {
      return {
        ok: false,
        error: "AGENT_PRIVATE_KEY and AGENT_ADDRESS missing in .env. Run `npm run wallet` to generate one."
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const hours = Math.min(Math.max(input.durationHours, 1), 720);
    const host = (() => {
      try {
        return new URL(input.target.startsWith("http") ? input.target : `http://${input.target}`).hostname;
      } catch {
        return input.target;
      }
    })();

    const draft = {
      agentId,
      customer,
      targets: [{ kind: "domain" as const, value: host }],
      ports: [80, 443, 3000, 8080, 8081],
      scanTypes: input.scanTypes ?? (["nuclei", "credscan"] as const),
      exclusions: [],
      intensity: input.intensity ?? ("passive" as const),
      notBefore: now,
      notAfter: now + hours * 3600,
      revocable: true
    };

    const { signature, grantId } = await signScopeGrant(pk, draft);
    const grant: ScopeGrant = { version: "1", grantId, ...draft, signature };
    upsertGrant(grant);

    return {
      ok: true,
      grantId,
      target: host,
      validUntil: new Date(grant.notAfter * 1000).toISOString(),
      intensity: grant.intensity,
      scanTypes: grant.scanTypes
    };
  },

  list_findings: async ({ limit = 10, severity }: { limit?: number; severity?: Severity }) => {
    let all = listFindings();
    if (severity) all = all.filter((f) => f.severity === severity);
    return {
      count: all.length,
      findings: all.slice(0, limit).map((f) => ({
        findingId: f.findingId,
        severity: f.severity,
        title: f.title,
        target: f.target.value,
        cve: f.cve,
        discoveredAt: f.discoveredAt,
        amountUsdc: f.billing.amountUsdc,
        status: f.billing.status
      }))
    };
  },

  request_scan: async ({ target }: { target: string }) => {
    const grants = listGrants();
    const normalised = target.startsWith("http") ? target : `http://${target}`;
    const match = grants.find((g) => isTargetInScope(g, { kind: "url", value: normalised }));
    if (!match) {
      return {
        ok: false,
        refused: true,
        reason: `No active scope grant covers '${target}'. ShieldClaw will not scan unauthorised targets.`,
        next: "Ask the customer to sign a scope grant first (sign_scope_grant)."
      };
    }
    return {
      ok: true,
      queued: true,
      target: normalised,
      grantId: match.grantId,
      note: "Scan request validated against active scope. The agent worker will pick it up on its next interval."
    };
  },

  pay_finding: async ({ findingId }: { findingId: string }) => {
    const finding = getFinding(findingId);
    if (!finding) return { ok: false, error: `No finding with id ${findingId}` };
    if (finding.billing.status === "paid") return { ok: false, error: "Finding already paid." };
    if (finding.billing.status === "disputed") return { ok: false, error: "Finding is disputed — payment blocked." };

    const result = await triggerPayment({
      findingId: finding.findingId,
      amountUsdc: finding.billing.amountUsdc,
      payerWallet: (process.env.AGENT_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
      receivingWallet: (process.env.GOATX402_RECEIVING_WALLET ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
      description: `ShieldClaw finding: ${finding.title}`
    });

    upsertFinding({
      ...finding,
      billing: {
        ...finding.billing,
        x402PaymentId: result.paymentId,
        status: result.status === "succeeded" ? "paid" : "pending"
      }
    });

    return {
      ok: true,
      paymentId: result.paymentId,
      status: result.status,
      txHash: result.txHash,
      explorerUrl: result.explorerUrl,
      configured: hasX402Configured(),
      note: hasX402Configured()
        ? "Live x402 charge submitted."
        : "x402 merchant credentials not configured — returned a stub payment ID. Add GOATX402_* env vars to fire a real charge."
    };
  },

  dispute_finding: async ({ findingId, reason }: { findingId: string; reason: string }) => {
    const finding = getFinding(findingId);
    if (!finding) return { ok: false, error: `No finding with id ${findingId}` };
    upsertFinding({
      ...finding,
      billing: { ...finding.billing, status: "disputed" }
    });
    return { ok: true, findingId, status: "disputed", reason };
  }
};

export async function callTool(name: string, input: unknown): Promise<string> {
  const handler = HANDLERS[name];
  if (!handler) return JSON.stringify({ error: `Unknown tool: ${name}` });
  try {
    const result = await handler(input);
    return JSON.stringify(result);
  } catch (err) {
    return JSON.stringify({ error: (err as Error).message });
  }
}

// Used in scanner pricing — re-export so the chat tools don't have to import twice.
export { pricingForSeverity };
