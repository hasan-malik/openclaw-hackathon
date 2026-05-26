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

## Joining now? Read these in order

1. [CLAUDE.md](CLAUDE.md) — project context, build strategy (we are **not** using ClawUp), GOAT mainnet constants, design moves, phase plan.
2. [SKILL.md](SKILL.md) — priority lens for trade-offs. The five judging moments we optimize for.
3. [shared/SCHEMA.md](shared/SCHEMA.md) — `Finding` and `ScopeGrant` data shapes. The contract every slice depends on.
4. The slice you'll own: [agent/](agent/), [onchain/](onchain/), [demo-target/](demo-target/), or [scripts/](scripts/) — each has a README explaining what goes inside.

Then copy `.env.example` → `.env` (constants are pre-filled for GOAT mainnet; you only fill secrets), pick a slice, and open a feature branch.

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
