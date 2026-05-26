import { z } from "zod";

export const Severity = z.enum(["info", "low", "medium", "high", "critical"]);
export type Severity = z.infer<typeof Severity>;

export const FindingCategory = z.enum([
  "rce",
  "xss",
  "ssrf",
  "exposed-secret",
  "outdated-library",
  "misconfig",
  "other"
]);
export type FindingCategory = z.infer<typeof FindingCategory>;

export const ScopeTarget = z.object({
  kind: z.enum(["domain", "ip", "cidr"]),
  value: z.string()
});
export type ScopeTarget = z.infer<typeof ScopeTarget>;

export const ScopeGrant = z.object({
  version: z.literal("1"),
  grantId: z.string(),
  agentId: z.string(),
  customer: z.string(),
  targets: z.array(ScopeTarget).min(1),
  ports: z.array(z.number().int().min(0).max(65535)),
  scanTypes: z.array(z.enum(["nuclei", "nmap", "credscan"])),
  exclusions: z
    .array(
      z.object({
        kind: z.enum(["path", "subdomain"]),
        value: z.string()
      })
    )
    .optional()
    .default([]),
  intensity: z.enum(["passive", "active", "intrusive"]).default("passive"),
  notBefore: z.number().int(),
  notAfter: z.number().int(),
  revocable: z.boolean().default(true),
  signature: z.string()
});
export type ScopeGrant = z.infer<typeof ScopeGrant>;

export const FindingEvidence = z.object({
  type: z.enum(["http-response", "file-contents", "scanner-output"]),
  artifactHash: z.string(),
  snippet: z.string()
});

export const FindingBilling = z.object({
  amountUsdc: z.string(),
  x402PaymentId: z.string().nullable(),
  disputeWindowEnds: z.number().int(),
  status: z.enum(["pending", "confirmed", "disputed", "paid", "slashed"])
});

export const Finding = z.object({
  version: z.literal("1"),
  findingId: z.string(),
  scopeGrantId: z.string(),
  agentId: z.string(),
  discoveredAt: z.number().int(),
  target: z.object({
    kind: z.enum(["domain", "ip", "url"]),
    value: z.string()
  }),
  cve: z.string().nullable(),
  category: FindingCategory,
  severity: Severity,
  title: z.string(),
  description: z.string(),
  evidence: FindingEvidence,
  remediation: z.string(),
  billing: FindingBilling
});
export type Finding = z.infer<typeof Finding>;

export const ScanRequest = z.object({
  scopeGrantId: z.string(),
  scanType: z.enum(["nuclei", "nmap", "credscan"]),
  target: z.object({
    kind: z.enum(["domain", "ip", "url"]),
    value: z.string()
  }),
  requestedAt: z.number().int(),
  requestedBy: z.enum(["scheduler", "user-trigger"])
});
export type ScanRequest = z.infer<typeof ScanRequest>;
