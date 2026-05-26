import { createHash } from "node:crypto";
import type { Finding, ScopeGrant } from "@shared/types";

const NOW = Math.floor(Date.now() / 1000);
const HOUR = 3600;

function h(s: string): string {
  return "0x" + createHash("sha256").update(s).digest("hex");
}

export const mockGrant: ScopeGrant = {
  version: "1",
  grantId: h("demo-grant-1"),
  agentId: "shieldclaw-demo-001",
  customer: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
  targets: [{ kind: "domain", value: "juice-shop.demo.local" }],
  ports: [80, 443, 3000],
  scanTypes: ["nuclei", "credscan"],
  exclusions: [],
  intensity: "passive",
  notBefore: NOW - HOUR,
  notAfter: NOW + 30 * 24 * HOUR,
  revocable: true,
  signature: "0x" + "ab".repeat(32) + "cd".repeat(32) + "01"
};

export const mockFindings: Finding[] = [
  {
    version: "1",
    findingId: h("finding-1"),
    scopeGrantId: mockGrant.grantId,
    agentId: mockGrant.agentId,
    discoveredAt: NOW - 12 * 60,
    target: { kind: "url", value: "http://juice-shop.demo.local/.env" },
    cve: null,
    category: "exposed-secret",
    severity: "critical",
    title: "Exposed .env file with database credentials",
    description:
      "The application's .env file is reachable from the public web root and discloses DB_PASSWORD, JWT_SECRET, and STRIPE_API_KEY.",
    evidence: {
      type: "http-response",
      artifactHash: h("evidence-1"),
      snippet: "HTTP/1.1 200 OK\nContent-Type: text/plain\n\nDB_HOST=db.internal\nDB_PASSWORD=hunter2\nJWT_SECRET=..."
    },
    remediation:
      "Move .env outside the web root, rotate every disclosed credential immediately, and add a deny rule for dot-prefixed files at the reverse proxy.",
    billing: {
      amountUsdc: "20.00",
      x402PaymentId: null,
      disputeWindowEnds: NOW - 12 * 60 + 7 * 24 * HOUR,
      status: "pending"
    }
  },
  {
    version: "1",
    findingId: h("finding-2"),
    scopeGrantId: mockGrant.grantId,
    agentId: mockGrant.agentId,
    discoveredAt: NOW - 45 * 60,
    target: { kind: "url", value: "http://juice-shop.demo.local/assets/vendor/jquery-1.6.4.min.js" },
    cve: "CVE-2020-11023",
    category: "outdated-library",
    severity: "high",
    title: "jQuery 1.6.4 — known XSS via untrusted HTML",
    description:
      "Site loads jQuery 1.6.4, which is vulnerable to XSS when passing untrusted HTML to .html(), .append(), and similar.",
    evidence: {
      type: "scanner-output",
      artifactHash: h("evidence-2"),
      snippet: "matched-at: /assets/vendor/jquery-1.6.4.min.js — template: technologies/jquery-detect.yaml"
    },
    remediation: "Upgrade jQuery to ≥ 3.5.0, or sanitize all HTML before insertion.",
    billing: {
      amountUsdc: "5.00",
      x402PaymentId: "mock-pay-2",
      disputeWindowEnds: NOW - 45 * 60 + 7 * 24 * HOUR,
      status: "confirmed"
    }
  },
  {
    version: "1",
    findingId: h("finding-3"),
    scopeGrantId: mockGrant.grantId,
    agentId: mockGrant.agentId,
    discoveredAt: NOW - 3 * HOUR,
    target: { kind: "url", value: "http://juice-shop.demo.local/api" },
    cve: null,
    category: "misconfig",
    severity: "medium",
    title: "CORS allows arbitrary origin with credentials",
    description:
      "Server responds with Access-Control-Allow-Origin reflecting the request Origin and Access-Control-Allow-Credentials: true.",
    evidence: {
      type: "http-response",
      artifactHash: h("evidence-3"),
      snippet: "Access-Control-Allow-Origin: https://evil.example\nAccess-Control-Allow-Credentials: true"
    },
    remediation:
      "Restrict Allow-Origin to a known allow-list. Never combine wildcard or reflected origins with Allow-Credentials.",
    billing: {
      amountUsdc: "1.00",
      x402PaymentId: "0xpaid-3",
      disputeWindowEnds: NOW - 3 * HOUR + 7 * 24 * HOUR,
      status: "paid"
    }
  },
  {
    version: "1",
    findingId: h("finding-4"),
    scopeGrantId: mockGrant.grantId,
    agentId: mockGrant.agentId,
    discoveredAt: NOW - 6 * HOUR,
    target: { kind: "url", value: "http://juice-shop.demo.local/index.html" },
    cve: null,
    category: "exposed-secret",
    severity: "high",
    title: "Hardcoded Stripe API key in HTML comment",
    description: "An HTML comment in the served index page contains what appears to be a live Stripe restricted API key.",
    evidence: {
      type: "file-contents",
      artifactHash: h("evidence-4"),
      snippet: "<!-- TODO remove before prod: rk_test_51M…X9 -->"
    },
    remediation:
      "Rotate the key in Stripe immediately. Add a pre-commit hook for secret detection (gitleaks / trufflehog).",
    billing: {
      amountUsdc: "5.00",
      x402PaymentId: null,
      disputeWindowEnds: NOW - 6 * HOUR + 7 * 24 * HOUR,
      status: "disputed"
    }
  }
];
