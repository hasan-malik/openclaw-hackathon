# ShieldClaw

Autonomous security auditing agent. Carries cryptographic proof of consent (ERC-8004), bills per verified finding (x402 / USDC), anchors findings on GOAT Network.

> The dominant strategy for security auditing today is wait six months and hope. ShieldClaw replaces it with a continuously-running agent that carries cryptographic proof of consent, bills per verified finding, and stakes its reputation on every report it files.

OpenClaw + Bitcoin + GOAT Network hackathon — May 2026.

## Repo layout

```
agent/         OpenClaw agent app (loop config, tool defs, finding pipeline)
onchain/       ERC-8004 scope-grant schema, registration scripts, x402 hooks
shared/        Cross-cutting data shapes (Finding, ScopeGrant) — read first
demo-target/   Deliberately vulnerable target + planted vulns for the demo
scripts/       Setup, deploy, run-end-to-end
```

## Quick start

1. Read [shared/SCHEMA.md](shared/SCHEMA.md) — the data shapes everything agrees on.
2. Read [CLAUDE.md](CLAUDE.md) — project context, scope, design moves.
3. Copy `.env.example` → `.env`, fill in your testnet keys + Slack webhook.
4. Pick a slice from [Phases](CLAUDE.md#phases) and open a branch.

## Team workflow

- `main` is protected. Short-lived feature branches → PR → merge.
- One owner per deliverable (agent, onchain, demo-target, slack, deploy).
- Define interfaces in `shared/` *before* writing implementations.
- Secrets in pinned team chat, never the repo.
- One person owns the live demo box.

## The five deliverables (what we ship)

1. Agent app (this repo) running on OpenClaw
2. Deployed live instance (VPS or laptop+ngrok)
3. On-chain agent identity (ERC-8004 on GOAT testnet)
4. Vulnerable demo target (Juice Shop + planted vulns)
5. Slack/Telegram findings channel

See [CLAUDE.md](CLAUDE.md) for full context.
