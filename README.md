# ShieldClaw

Autonomous security auditing agent. ERC-8004 identity on GOAT mainnet, per-finding x402 billing, cryptographic proof of scope authorisation, continuous scanning.

> The dominant strategy for security auditing today is wait six months and hope. ShieldClaw replaces it with a continuously-running agent that carries cryptographic proof of consent, bills per verified finding, and stakes its reputation on every report it files.

OpenClaw + Bitcoin + GOAT Network hackathon — May 2026.

## What's in here

```
app/                 Next.js dashboard (App Router, Tailwind)
components/          UI primitives (severity badge, finding card, scope-grant card)
lib/                 Frontend utilities + agent-status reader
agent/               Scan loop, scanner wrapper, store, notifiers
onchain/             GOAT mainnet config, ERC-8004 registration, EIP-712 scope grants, x402 client
shared/              SCHEMA.md + Zod TS types (the cross-cutting contract)
scripts/             CLIs — wallet, sign-scope, register
demo-target/         Juice Shop + planted vulns via docker-compose
```

## Quick start

```bash
npm install
cp .env.example .env

npm run wallet              # generate agent wallet → paste into .env
# (request gas + USDC via the forms linked in CLAUDE.md)

npm run register            # ERC-8004 mainnet registration → save AGENT_ID into .env
npm run sign-scope          # customer signs a scope grant for the demo target

cd demo-target && docker compose up -d && cd ..

npm run dev                 # dashboard at http://localhost:3000
npm run agent               # scan loop, in another terminal
```

The dashboard works **immediately** after `npm install` — it seeds mock findings so the UI is alive while the real wallet and scanner are being set up.


## Stack

| Piece | Choice | Why |
|---|---|---|
| Agent framework | **OpenClaw** (standalone today, ClawUp port if it returns) | Submission gate — but ClawUp was down at scaffold time, so the agent is built to run on its own and dock into ClawUp later. |
| Identity | **ERC-8004 on GOAT mainnet** | Submission gate. Registry `0x8004…`, chain 2345. |
| Payments | **x402 / USDC.e** on GOAT | Per-finding billing. Submission gate (visible payment during demo). |
| Chain calls | **viem** | TS-first, no provider config dance. |
| Scanner | **nuclei** via subprocess | Open-source, mature, hackathon-fast. |
| Notifier | Telegram + Slack webhook | Both supported, either is enough for the demo. |
| Frontend | **Next.js 14 (App Router) + Tailwind** | Single project, single deploy. |
| Storage | JSON file under `.shieldclaw/` | No DB to set up. Survives restart. |

