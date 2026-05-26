import { createHash } from "node:crypto";
import { listFindings, listGrants, getFinding, upsertFinding, upsertGrant } from "@agent/store";
import { pricingForSeverity } from "@agent/scanner";
import { getAgentStatus } from "@/lib/agent-status";
import { isTargetInScope, signScopeGrant } from "@onchain/scope-grant";
import { triggerPayment, hasX402Configured } from "@onchain/x402";
import type { Finding, Severity, ScopeGrant } from "@shared/types";
import { SKILL_TOOL_SCHEMAS, runSkill } from "./skill-adapter";

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
  },
  ...SKILL_TOOL_SCHEMAS,
  {
    name: "wallet_auth_bypass",
    description:
      "Test wallet/portfolio endpoints for authorization bypass (IDOR) — probes without auth and checks if sensitive balance/transaction data is returned. REFUSES if out-of-scope.",
    input_schema: {
      type: "object" as const,
      properties: { targetUrl: { type: "string" as const } },
      required: ["targetUrl"]
    }
  },
  {
    name: "get_dashboard_metrics",
    description:
      "Return live aggregate metrics from the agent store: finding counts by severity/category/attack-vector, USDC paid vs pending, patch rate, active scope grants, and per-skill breakdowns. Use this to answer questions about posture, coverage, top threats, or billing summary.",
    input_schema: { type: "object" as const, properties: {} }
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
    model: "pay-per-finding",
    guarantee: "You pay nothing if no vulnerability is found. Zero scan fee. Zero monitoring fee.",
    perFinding: {
      info:     "0.000",
      low:      "0.001",
      medium:   "0.002",
      high:     "0.003",
      critical: "0.005"
    },
    disputeWindowDays: 7,
    slashing: "Disputed findings are not billed and slash agent on-chain reputation.",
    explanation:
      "Pure pay-per-finding via x402. If the agent finds nothing, you owe nothing. When a vulnerability is confirmed, an x402 USDC micropayment fires automatically — no invoice, no human approval. Pricing scales with severity so the cost always reflects the risk."
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

    const noteMap: Record<string, string> = {
      succeeded: "x402 order created AND on-chain USDC transfer submitted. Tx visible on the GOAT explorer link.",
      pending: "x402 order created but on-chain transfer hasn't fired yet — check raw for diagnostics.",
      failed: "x402 flow failed — see raw for the phase that broke."
    };
    return {
      ok: result.status !== "failed",
      paymentId: result.paymentId,
      status: result.status,
      txHash: result.txHash,
      explorerUrl: result.explorerUrl,
      orderUrl: (result as { orderUrl?: string }).orderUrl ?? null,
      configured: hasX402Configured(),
      note: hasX402Configured() ? noteMap[result.status] ?? "" : "x402 merchant credentials not configured.",
      diagnostics: (result as { raw?: unknown }).raw
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
  },

  sql_injection_attack: async ({ targetUrl }: { targetUrl: string }) => runSkill("sql_injection_attack", targetUrl),
  port_scan: async ({ targetUrl }: { targetUrl: string }) => runSkill("port_scan", targetUrl),
  ssl_check: async ({ targetUrl }: { targetUrl: string }) => runSkill("ssl_check", targetUrl),
  credential_exposure: async ({ targetUrl }: { targetUrl: string }) => runSkill("credential_exposure", targetUrl),
  wallet_auth_bypass: async ({ targetUrl }: { targetUrl: string }) => runSkill("wallet_auth_bypass", targetUrl),

  get_dashboard_metrics: async () => {
    const findings = listFindings();
    const grants = listGrants();

    const bySeverity = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    const byCategory: Record<string, number> = {};
    const byAttackType: Record<string, number> = { sql_injection: 0, credential_exposure: 0, port_scan: 0, ssl_check: 0, wallet_auth: 0, other: 0 };
    let paidUsdc = 0;
    let pendingUsdc = 0;
    let paidCount = 0;
    let disputedCount = 0;

    for (const f of findings) {
      bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1;
      byCategory[f.category] = (byCategory[f.category] ?? 0) + 1;

      const t = f.title.toLowerCase();
      if (t.includes("sql")) byAttackType.sql_injection++;
      else if (t.includes("credential") || t.includes("secret") || t.includes("env") || t.includes("wallet")) byAttackType.credential_exposure++;
      else if (t.includes("port")) byAttackType.port_scan++;
      else if (t.includes("tls") || t.includes("ssl") || t.includes("https")) byAttackType.ssl_check++;
      else if (t.includes("idor") || t.includes("auth bypass")) byAttackType.wallet_auth++;
      else byAttackType.other++;

      const amt = Number(f.billing.amountUsdc);
      if (f.billing.status === "paid") { paidUsdc += amt; paidCount++; }
      else if (f.billing.status === "pending") pendingUsdc += amt;
      else if (f.billing.status === "disputed") disputedCount++;
    }

    const criticalCount = bySeverity.critical;
    const totalFindings = findings.length;
    const patchRate = totalFindings > 0 ? Math.round((paidCount / totalFindings) * 100) : 0;
    const activeGrants = grants.filter(g => Date.now() / 1000 >= g.notBefore && Date.now() / 1000 <= g.notAfter).length;

    return {
      summary: {
        totalFindings,
        bySeverity,
        byCategory,
        byAttackType,
        activeGrants,
        paidUsdc: paidUsdc.toFixed(2),
        pendingUsdc: pendingUsdc.toFixed(2),
        paidCount,
        disputedCount,
        patchRate: `${patchRate}%`
      },
      posture: {
        criticalUnpatched: criticalCount - paidCount > 0 ? criticalCount - paidCount : 0,
        tlsIssues: byAttackType.ssl_check,
        secretLeaks: byAttackType.credential_exposure,
        sqlVulns: byAttackType.sql_injection,
        openPorts: byAttackType.port_scan,
        authBypasses: byAttackType.wallet_auth
      },
      attackVectors: [
        { name: "SQL Injection", count: byAttackType.sql_injection, skill: "sql_injection_attack" },
        { name: "Credential Exposure", count: byAttackType.credential_exposure, skill: "credential_exposure" },
        { name: "Port Surface", count: byAttackType.port_scan, skill: "port_scan" },
        { name: "SSL / TLS", count: byAttackType.ssl_check, skill: "ssl_check" },
        { name: "Wallet Auth Bypass", count: byAttackType.wallet_auth, skill: "wallet_auth_bypass" }
      ],
      note: "Live data from the agent store. Run scans with sql_injection_attack / port_scan / ssl_check / credential_exposure / wallet_auth_bypass to populate."
    };
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
