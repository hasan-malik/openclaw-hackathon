# agent/

The OpenClaw application. Owns the agent loop, scanner orchestration, finding pipeline, and webhook delivery.

**Owner:** _TBD_

## Pieces inside

- Agent loop config (ClawUp prompt + tool defs)
- Scanner adapters (nuclei, nmap, credscan) — subprocess wrappers
- Finding structurer — raw scanner output → `Finding` (see [shared/SCHEMA.md](../shared/SCHEMA.md))
- ERC-8004 scope verifier — calls into `onchain/` before any scan
- x402 billing trigger — fires on confirmed findings
- Slack / Telegram delivery

## Before writing code

1. Read [CLAUDE.md](../CLAUDE.md) and [SKILL.md](../SKILL.md) at repo root.
2. Confirm the `Finding` and `ScopeGrant` shapes in [shared/SCHEMA.md](../shared/SCHEMA.md).
3. Check sponsor starter templates — don't rebuild what OpenClaw / ClawUp ship.
