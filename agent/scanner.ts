import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import type { Finding, FindingCategory, Severity } from "@shared/types";

type RawNucleiResult = {
  "template-id"?: string;
  info?: {
    name?: string;
    severity?: string;
    description?: string;
    classification?: { "cve-id"?: string[] };
    remediation?: string;
    tags?: string[];
  };
  "matched-at"?: string;
  matcher_status?: boolean;
  request?: string;
  response?: string;
};

const SEVERITY_MAP: Record<string, Severity> = {
  unknown: "info",
  info: "info",
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical"
};

function categorize(tags: string[] = []): FindingCategory {
  if (tags.includes("rce")) return "rce";
  if (tags.includes("xss")) return "xss";
  if (tags.includes("ssrf")) return "ssrf";
  if (tags.includes("exposure") || tags.includes("secret")) return "exposed-secret";
  if (tags.includes("tech") || tags.includes("outdated")) return "outdated-library";
  if (tags.includes("misconfig")) return "misconfig";
  return "other";
}

function hashEvidence(raw: string) {
  return "0x" + createHash("sha256").update(raw).digest("hex");
}

export async function runNuclei(target: string, opts?: { timeoutMs?: number }): Promise<RawNucleiResult[]> {
  return new Promise((resolve, reject) => {
    const child = spawn("nuclei", ["-u", target, "-jsonl", "-silent", "-no-color"], {
      stdio: ["ignore", "pipe", "pipe"]
    });

    const results: RawNucleiResult[] = [];
    let stderr = "";
    let buffer = "";

    child.stdout.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          results.push(JSON.parse(trimmed));
        } catch {
          // skip non-JSON output
        }
      }
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`nuclei timeout after ${opts?.timeoutMs ?? 60000}ms`));
    }, opts?.timeoutMs ?? 60_000);

    child.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0 && results.length === 0) {
        reject(new Error(`nuclei exited ${code}: ${stderr}`));
      } else {
        resolve(results);
      }
    });
  });
}

export function nucleiResultToFinding(
  raw: RawNucleiResult,
  ctx: { scopeGrantId: string; agentId: string }
): Finding {
  const severity = SEVERITY_MAP[(raw.info?.severity ?? "info").toLowerCase()] ?? "info";
  const cve = raw.info?.classification?.["cve-id"]?.[0] ?? null;
  const matched = raw["matched-at"] ?? "";
  const rawBlob = JSON.stringify(raw);
  const evidenceHash = hashEvidence(rawBlob);
  const now = Math.floor(Date.now() / 1000);
  const findingId =
    "0x" + createHash("sha256").update(`${ctx.scopeGrantId}|${matched}|${raw["template-id"]}|${evidenceHash}`).digest("hex");

  return {
    version: "1",
    findingId,
    scopeGrantId: ctx.scopeGrantId,
    agentId: ctx.agentId,
    discoveredAt: now,
    target: { kind: "url", value: matched },
    cve,
    category: categorize(raw.info?.tags),
    severity,
    title: raw.info?.name ?? raw["template-id"] ?? "Untitled finding",
    description: raw.info?.description ?? "No description supplied by template.",
    evidence: {
      type: "scanner-output",
      artifactHash: evidenceHash,
      snippet: rawBlob.slice(0, 200)
    },
    remediation: raw.info?.remediation ?? "Refer to vendor advisory.",
    billing: {
      amountUsdc: pricingForSeverity(severity),
      x402PaymentId: null,
      disputeWindowEnds: now + 7 * 24 * 3600,
      status: "pending"
    }
  };
}

export function pricingForSeverity(severity: Severity): string {
  // Pay-per-finding: $0 if no vuln found, price scales with severity.
  return (
    {
      info: "0.000",
      low: "0.001",
      medium: "0.002",
      high: "0.003",
      critical: "0.005"
    } satisfies Record<Severity, string>
  )[severity];
}
