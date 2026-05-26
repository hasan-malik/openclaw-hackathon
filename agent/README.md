# agent/

The ShieldClaw agent loop. Owns scanning, finding pipeline, and notification delivery.

**Owner:** _TBD_

## Files

- `worker.ts` — main scan loop. `npm run agent` runs it.
- `scanner.ts` — nuclei subprocess wrapper + `nucleiResultToFinding` mapper.
- `notify.ts` — Telegram + Slack senders, gracefully no-op if env vars are missing.
- `store.ts` — JSON-file-backed in-memory store for findings + scope grants. Lives in `.shieldclaw/`.
- `mock-data.ts` — seed data for the dashboard while the real scanner isn't wired.

## How the loop works

1. Read scope grants from store. If none, seed mock data so the dashboard isn't empty.
2. For each grant + each in-scope target: invoke nuclei via subprocess, capture JSONL output.
3. Each raw result → structured `Finding` (matches [shared/SCHEMA.md](../shared/SCHEMA.md)).
4. Persist to store; fire Telegram/Slack; trigger x402 charge if `GOATX402_*` env vars are set.
5. Sleep `SCAN_INTERVAL_SECONDS` (default 300) and repeat.

## Requirements at runtime

- `nuclei` binary on PATH (`brew install nuclei` on macOS).
- For real scans: a signed scope grant in `.shieldclaw/scope-grants.json`. Run `npm run sign-scope` to create one.
- For real billing: full `GOATX402_*` env block (see `.env.example`).

## Bypass switches (for dev)

- Worker runs with mock data if no scope grants exist.
- x402 trigger is a stub if merchant env is missing — returns a `mock-…` payment ID so the pipeline still flows.
- Notification senders no-op silently if their env is missing.
