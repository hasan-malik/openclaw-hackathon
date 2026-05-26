# CLAUDE.md — ShieldClaw

Project context for Claude Code (and any AI coding agent) working in this repo. Read this before suggesting changes.

## What we're building

**ShieldClaw** — autonomous security auditing agent for the OpenClaw / Bitcoin / GOAT Network hackathon (May 2026).

Continuously scans target infrastructure, carries an ERC-8004 verified identity, proves on-chain it had authorization to scan, and bills per verified finding in USDC via x402.

**One-line pitch:** The dominant strategy for security auditing today is wait six months and hope. ShieldClaw replaces it with a continuously-running agent that carries cryptographic proof of consent, bills per verified finding, and stakes its reputation on every report it files.

## Build strategy (read this before assuming anything about ClawUp)

**ClawUp is down for everyone and unlikely to return.** Judges have confirmed flexibility — local builds are accepted. We are building ShieldClaw as a **standalone agent we run ourselves** (laptop, VPS, or sponsor cloud). If ClawUp comes back near demo time, we'll attempt a port; we are not waiting on it.

The two non-negotiable submission gates that *remain*:

1. **ERC-8004 registration on GOAT mainnet** — the agent must appear on https://8004scan.io/agents?chain=2345
2. **Visible x402 payment fires during the 2-min demo** — judges explicitly test "402 protocol integrity" by triggering a machine payment in-chat

Everything else is judged on the demo, not on whether we used a specific tool.

## GOAT mainnet constants (use these everywhere)

| Thing | Value |
|---|---|
| RPC URL | `https://rpc.goat.network` |
| Chain ID | `2345` |
| ERC-8004 registry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| ERC-8004 method | `register(string name)` — agent metadata at a public URI (e.g. Gist) |
| USDC.e on GOAT | `0x3022b87ac063DE95b1570F46f5e470F8B53112D8` |
| Block explorer | `https://explorer.goat.network/` |
| Registered-agents dashboard | `https://8004scan.io/agents?chain=2345` |
| Hackathon dashboard | `https://goat-hackathon-2026.vercel.app/` |
| x402 merchant portal | `https://x402-merchant.goat.network/` |
| x402 SDK (Node) | `goatx402-sdk-server` |
| x402 SDK (Go) | `github.com/GOATNetwork/goatx402-go` |
| Reference repos | `GOATNetwork/GOAT-Hackathon-2026`, `julies-claw/goat-agent-demo`, `GOATNetwork/agentkit` |
| Submission deadline | **5:45pm** — form: `bit.ly/openclaw-hackathon-submission` |
| Demo format | 2 minutes per team, no slides, live agent only |

## Reality check on ERC-8004

The registry contract is **just an agent identity registry** — `register(string name)` + a metadata URI. The "scope grants" in ShieldClaw's killer move #1 are **our invention on top of ERC-8004**, not a native feature. We either deploy our own scope-grant contract on GOAT, OR encode scope grants as off-chain signed messages with on-chain anchoring of the grant hash. The off-chain-signed approach is much cheaper and faster to ship — start there. See `onchain/README.md`.

## Two load-bearing design moves — do not lose these

**1. Authorization is the hard problem, not detection.** Detection is solved (nuclei, nmap, OpenVAS, CVE feeds — all open-source). What blocks autonomous security testing at scale is *legal* authorization: unauthorized scanning is a CFAA violation. ShieldClaw uses on-chain ERC-8004 scope grants — the target signs *"agent X may probe asset Y in scope Z until time T."* Verifiable, revocable, machine-readable. The agent refuses to scan outside the signed scope. This is the most novel piece and where judges will look hardest. Design this first.

**2. Pay per verified finding, not per scan.** Each finding gets structured `{target, CVE, severity, evidence}`, hashed, anchored on GOAT. Customer receives it in Slack via x402. USDC micropayment triggers only after the customer confirms the fix OR a 7-day dispute window expires. Disputed/false findings get slashed against the agent's on-chain reputation.

## The five deliverables

1. **Agent app repo (this one).** OpenClaw application (~500–2000 LOC). Agent loop config (likely via ClawUp), scanning toolkit orchestration, finding structurer, ERC-8004 auth check, x402 billing hook, Slack/Telegram webhook. **OpenClaw is a dependency, not a fork.**
2. **Deployed live instance.** VPS (DigitalOcean / Hetzner / sponsor cloud) or laptop + ngrok. Must actually run during the pitch.
3. **On-chain agent identity.** ERC-8004 registration on GOAT testnet.
4. **Deliberately vulnerable demo target.** OWASP Juice Shop or DVWA, plus 2–3 planted vulns (exposed `.env`, vulnerable jQuery, leaked API key in a public file).
5. **Slack/Telegram channel.** Where findings arrive live on stage — the moment that sells the pitch.

## Tech stack roles

| Piece | Role |
|---|---|
| OpenClaw | agent framework (dependency, not fork) |
| ClawUp | prompt-first agent build tool |
| ERC-8004 | agent identity + scope-grant authorization on GOAT |
| x402 | per-finding USDC micropayment trigger |
| GOAT Network | Bitcoin-secured L2 for anchoring findings + identity |
| USDC (testnet) | billing currency |
| nuclei, nmap, CVE matcher, public-credential scraper | the open-source scanning toolkit |

## Explicit scope cuts — own these to judges

- ❌ Manual exploit pivoting (we detect, not red-team)
- ❌ Social engineering / phishing
- ❌ Production-impacting DoS or fuzzing (requires a separate narrower scope grant)
- ❌ Compliance certification (we generate evidence; humans certify)

## Phases (~48h critical path)

**Phase 0 (~2h, do first, in parallel)** — Pick language (Node vs. Go). Clone the three reference repos. Generate the agent wallet. Request gas + USDC from sponsor forms. Read the x402 SDK README.

1. **~6h** — Standalone agent skeleton; nuclei scans a target; structured `Finding` objects out (matching `shared/SCHEMA.md`).
2. **~6h** — Register agent on ERC-8004 mainnet (this is a submission gate). Wire scope-grant verification (off-chain signed, on-chain hash anchor). Agent hard-refuses unauthorized scans.
3. **~8h** — x402 per-finding billing using `goatx402-sdk-server`. Get a payment to fire end-to-end against the merchant portal.
4. **~8h** — Demo target (Juice Shop + planted vulns) + Telegram/Slack delivery + final wiring.
5. **~8h** — End-to-end rehearsal + fallback video (in case live demo dies on stage).
6. **~10h** — Pitch deck-replacement (since no slides allowed, this is the 2-min spoken story), README polish, sleep ~4h.

## Open decisions to resolve before writing code

- **Implementation language.** Node (TS) or Go. x402 SDK exists in both. Node is the path of least resistance for the OpenClaw agent loop and the demo target's Slack/Telegram webhooks. **Decide this in the first hour together.**
- **ERC-8004 scope-grant schema.** Fields, signature format, revocation semantics. Novel piece — get it right first. See `shared/SCHEMA.md`. Default approach: EIP-712 signed message off-chain + grant-hash anchor on-chain.
- **Dispute window mechanics.** How the customer disputes a finding. Slashing curve. Simplest acceptable: 7-day window in code, no on-chain slashing for the demo (state the design, don't ship the contract).
- **Scanner orchestration boundary.** Subprocess vs. container vs. sandbox. Default: subprocess to start, container only if the host risks pollution.
- **Reference repos to study first.** `GOATNetwork/GOAT-Hackathon-2026` (skills + examples), `julies-claw/goat-agent-demo` (full agent flow), `GOATNetwork/agentkit` (wallet + chain reads). Don't rebuild what they provide.

## How the team collaborates

- `main` protected. Short-lived feature branches → PR → merge.
- One owner per deliverable end-to-end (avoid frontend/backend slicing — causes merge conflicts).
- Interfaces in `shared/` defined and merged **before** anyone writes implementations.
- Secrets in pinned team chat. **Never** the repo.
- One person owns the deployed demo box.

## Working style (project owner: Hasan)

- Senior CS background. Comfortable with terminal. Ask probing follow-ups instead of assuming I'm on top of everything.
- **Terse responses, no fluff, no trailing summaries.**
- For multi-part explanations, output one section and pause for confirmation before continuing.
- Critical thinking over validation — if the plan is wrong, say so.
- State which terminal/environment any command runs in.
- **Don't read or echo `.env` files or secrets** — I'll load them myself.
- For this fresh hackathon repo, editing files directly is fine. Still confirm before edits to global dotfiles or `~/.ssh`.

## When the user mentions "the pitch"

The full 5-step pitch (problem → market → gap → insight → feasibility) lives in the original Notion / handoff doc. Ask before drafting deck content from scratch — quote from the existing language where it exists.
