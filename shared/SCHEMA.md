# shared/SCHEMA.md

The cross-cutting data shapes every part of ShieldClaw agrees on. **Define these before writing implementations.** This file is the contract.

Format is language-neutral (JSON-shaped). Pin to TypeScript types or Pydantic models once the language is chosen.

---

## ScopeGrant

The on-chain authorization that gates every scan. Signed by the target (the customer), verified by the agent before any probe.

```jsonc
{
  "version": "1",
  "grantId": "0x…",                  // unique, on-chain anchor
  "agentId": "0x…",                  // ERC-8004 agent identity
  "customer": "0x…",                 // signer / customer address
  "targets": [                       // assets the agent may probe
    {
      "kind": "domain" | "ip" | "cidr",
      "value": "example.com" | "203.0.113.0/24"
    }
  ],
  "ports": [80, 443, 8080],          // explicit allow-list
  "scanTypes": ["nuclei", "nmap", "credscan"],
  "exclusions": [                    // optional — explicit deny
    { "kind": "path", "value": "/admin" }
  ],
  "intensity": "passive" | "active" | "intrusive",
  "notBefore": 1716700000,           // unix seconds
  "notAfter":  1716800000,
  "revocable": true,
  "signature": "0x…"                 // customer's signature over the canonical hash
}
```

**Rules:**
- Default `intensity` is `passive`. Anything that could degrade production (`active`+) requires explicit opt-in.
- A scan request that doesn't match `targets ∩ ports ∩ scanTypes` MUST be refused locally before any network packet leaves.
- Revocation is checked on-chain at scan start. Cache for ≤ 60s.

---

## Finding

The structured output of every detection. Hashed, anchored on GOAT, delivered via Slack/Telegram, billed via x402.

```jsonc
{
  "version": "1",
  "findingId": "0x…",                // hash anchored on GOAT
  "scopeGrantId": "0x…",             // ties back to authorization
  "agentId": "0x…",
  "discoveredAt": 1716750000,
  "target": {
    "kind": "domain" | "ip" | "url",
    "value": "example.com:8080/api"
  },
  "cve": "CVE-2024-12345" | null,    // null for non-CVE findings (e.g. exposed secret)
  "category": "rce" | "xss" | "ssrf" | "exposed-secret" | "outdated-library" | "misconfig" | "other",
  "severity": "info" | "low" | "medium" | "high" | "critical",
  "title": "Short human-readable title",
  "description": "What it is + why it matters, 1–3 sentences",
  "evidence": {
    "type": "http-response" | "file-contents" | "scanner-output",
    "artifactHash": "0x…",           // hash of the raw evidence blob
    "snippet": "first ~200 chars for the Slack post"
  },
  "remediation": "1–3 sentence fix snippet",
  "billing": {
    "amountUsdc": "0.50",
    "x402PaymentId": "0x…" | null,
    "disputeWindowEnds": 1717354800,
    "status": "pending" | "confirmed" | "disputed" | "paid" | "slashed"
  }
}
```

**Rules:**
- `findingId` MUST be deterministic over `{scopeGrantId, target, category, evidenceHash}` so re-finding the same issue doesn't double-bill.
- A finding is only billable once `disputeWindowEnds < now()` AND `status != disputed`.
- Disputed findings flow to slashing — see `onchain/` for the curve.

---

## ScanRequest (internal)

Not on-chain. The internal message that flows from scheduler → agent loop → scanner subprocess.

```jsonc
{
  "scopeGrantId": "0x…",
  "scanType": "nuclei" | "nmap" | "credscan",
  "target": { "kind": "...", "value": "..." },
  "requestedAt": 1716750000,
  "requestedBy": "scheduler" | "user-trigger"
}
```

---

## When you change this file

- Bump the affected `version` field.
- Post in the team channel before merging — every slice depends on this.
- Update both the agent's verifier and the on-chain schema in `onchain/` in the same PR.
