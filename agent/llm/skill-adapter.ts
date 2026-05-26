/**
 * Adapter: takes the AttackResult shape from src/skills/* (teammate's
 * vuln detection work) and produces our canonical Finding shape so the
 * existing notify + x402 + dashboard pipeline picks up new findings.
 */

import { createHash } from "node:crypto";
import type { AttackResult } from "../../src/types";
import {
  sqlInjectionAttack,
  portScanAttack,
  sslCheckAttack,
  credentialExposureAttack,
  walletAuthAttack
} from "../../src/skills";
import type { Finding, Severity, FindingCategory } from "@shared/types";
import { listGrants, upsertFinding } from "@agent/store";
import { pricingForSeverity } from "@agent/scanner";
import { isTargetInScope } from "@onchain/scope-grant";
import { notify } from "@agent/notify";
import { triggerPayment, hasX402Configured } from "@onchain/x402";

const SEVERITY_MAP: Record<AttackResult["severity"], Severity> = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low"
};

const CATEGORY_MAP: Record<AttackResult["attackType"], FindingCategory> = {
  SQL_INJECTION: "rce",
  PORT_SCAN: "misconfig",
  SSL_CHECK: "misconfig",
  CREDENTIAL_EXPOSURE: "exposed-secret",
};

function hashEvidence(blob: string) {
  return "0x" + createHash("sha256").update(blob).digest("hex");
}

function findingIdFor(scopeGrantId: string, result: AttackResult, evidenceHash: string) {
  return (
    "0x" +
    createHash("sha256")
      .update(`${scopeGrantId}|${result.attackType}|${result.location}|${evidenceHash}`)
      .digest("hex")
  );
}

function activeGrantFor(targetUrl: string) {
  const grants = listGrants();
  return (
    grants.find((g) => isTargetInScope(g, { kind: "url", value: targetUrl })) ?? null
  );
}

function attackToFinding(result: AttackResult, targetUrl: string, scopeGrantId: string, agentId: string): Finding {
  const severity = SEVERITY_MAP[result.severity];
  const evidenceBlob = JSON.stringify({ payload: result.payload, evidence: result.evidence });
  const evidenceHash = hashEvidence(evidenceBlob);
  const now = Math.floor(result.timestamp / 1000) || Math.floor(Date.now() / 1000);

  return {
    version: "1",
    findingId: findingIdFor(scopeGrantId, result, evidenceHash),
    scopeGrantId,
    agentId,
    discoveredAt: now,
    target: { kind: "url", value: result.location || targetUrl },
    cve: null,
    category: CATEGORY_MAP[result.attackType],
    severity,
    title: result.vulnerability,
    description: `Attack type: ${result.attackType}. ${result.vulnerability} at ${result.location}.`,
    evidence: {
      type: "scanner-output",
      artifactHash: evidenceHash,
      snippet: (result.evidence ?? evidenceBlob).slice(0, 200)
    },
    remediation: remediationFor(result.attackType),
    billing: {
      amountUsdc: pricingForSeverity(severity),
      x402PaymentId: null,
      disputeWindowEnds: now + 7 * 24 * 3600,
      status: "pending"
    }
  };
}

function remediationFor(type: AttackResult["attackType"]): string {
  return (
    {
      SQL_INJECTION:
        "Use parameterised queries / prepared statements. Never concatenate user input into SQL. Add WAF + input validation as defence-in-depth.",
      PORT_SCAN: "Close unused ports. Restrict admin services to allow-listed source IPs.",
      SSL_CHECK:
        "Upgrade to TLS 1.2+, disable weak ciphers, renew expiring certs, enforce HSTS with `includeSubDomains`.",
      CREDENTIAL_EXPOSURE:
        "Move secrets out of webroot. Rotate every disclosed key immediately. Add a deny-rule for dot-prefixed files at the reverse proxy."
    } as const
  )[type];
}

type SkillRunner = (targetUrl: string) => Promise<AttackResult>;

const RUNNERS: Record<string, SkillRunner> = {
  sql_injection_attack: sqlInjectionAttack,
  port_scan: portScanAttack,
  ssl_check: sslCheckAttack,
  credential_exposure: credentialExposureAttack,
  wallet_auth_bypass: walletAuthAttack,
};

// agentId is optional — specialists pass their own ID; general agent uses grant.agentId
export async function runSkill(
  name: keyof typeof RUNNERS,
  targetUrl: string,
  overrideAgentId?: string
) {
  const grant = activeGrantFor(targetUrl);
  if (!grant) {
    return {
      ok: false,
      refused: true,
      reason: `No active scope grant covers ${targetUrl}. Sign one first with sign_scope_grant.`
    };
  }

  const runner = RUNNERS[name];
  if (!runner) return { ok: false, error: `unknown skill ${name}` };

  const result = await runner(targetUrl);

  if (!result.success) {
    return {
      ok: true,
      attackType: result.attackType,
      vulnerable: false,
      note: result.vulnerability
    };
  }

  const agentId = overrideAgentId ?? grant.agentId;
  const finding = attackToFinding(result, targetUrl, grant.grantId, agentId);
  upsertFinding(finding);
  await notify(finding).catch(() => {});

  // Auto-trigger x402 payment — no user intervention required.
  let paymentId: string | null = null;
  let txHash: string | null = null;
  let explorerUrl: string | null = null;
  const amountUsdc = finding.billing.amountUsdc;

  if (hasX402Configured() && parseFloat(amountUsdc) > 0) {
    try {
      const payment = await triggerPayment({
        findingId: finding.findingId,
        amountUsdc,
        payerWallet: (process.env.AGENT_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
        receivingWallet: (process.env.GOATX402_RECEIVING_WALLET ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
        description: `ShieldClaw: ${finding.title} at ${targetUrl}`
      });
      paymentId = payment.paymentId;
      txHash = payment.txHash;
      explorerUrl = payment.explorerUrl;
      upsertFinding({
        ...finding,
        billing: {
          ...finding.billing,
          x402PaymentId: payment.paymentId,
          status: payment.status === "succeeded" ? "paid" : "pending"
        }
      });
    } catch {
      // Payment failure never blocks the finding report
    }
  }

  return {
    ok: true,
    attackType: result.attackType,
    vulnerable: true,
    findingId: finding.findingId,
    severity: finding.severity,
    title: finding.title,
    charged: amountUsdc,
    paymentId,
    txHash,
    explorerUrl,
    note: parseFloat(amountUsdc) === 0
      ? "Info-level finding — no charge."
      : paymentId
        ? `Charged ${amountUsdc} USDC automatically via x402.`
        : "x402 merchant not configured — charge will fire when credentials are set."
  };
}

export const SKILL_TOOL_SCHEMAS = [
  {
    name: "sql_injection_attack",
    description:
      "Test the target for SQL injection at common login endpoints. Returns a Finding if the target is vulnerable. REFUSES if the target is not covered by an active scope grant.",
    input_schema: {
      type: "object" as const,
      properties: {
        targetUrl: { type: "string" as const, description: "Base URL of the target, e.g. http://localhost:3001" }
      },
      required: ["targetUrl"]
    }
  },
  {
    name: "port_scan",
    description:
      "Scan the target for unexpectedly-open ports and risky services. Returns a Finding if anomalies are detected. REFUSES if out-of-scope.",
    input_schema: {
      type: "object" as const,
      properties: {
        targetUrl: { type: "string" as const }
      },
      required: ["targetUrl"]
    }
  },
  {
    name: "ssl_check",
    description:
      "Inspect the target's TLS configuration for weak ciphers, expired certs, missing HSTS. REFUSES if out-of-scope.",
    input_schema: {
      type: "object" as const,
      properties: {
        targetUrl: { type: "string" as const }
      },
      required: ["targetUrl"]
    }
  },
  {
    name: "credential_exposure",
    description:
      "Probe common paths for publicly exposed secrets (`.env`, `/api/config`, `/.git/config`). REFUSES if out-of-scope.",
    input_schema: {
      type: "object" as const,
      properties: {
        targetUrl: { type: "string" as const }
      },
      required: ["targetUrl"]
    }
  }
];
