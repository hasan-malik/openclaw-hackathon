# CLAUDE.md — ShieldClaw

Project context for Claude Code (and any AI coding agent) working in this repo. Read this before suggesting changes.

## What we're building

**ShieldClaw** — autonomous security auditing agent for the OpenClaw / Bitcoin / GOAT Network hackathon (May 2026).

Continuously scans target infrastructure, carries an ERC-8004 verified identity, proves on-chain it had authorization to scan, and bills per verified finding in USDC via x402.

**One-line pitch:** The dominant strategy for security auditing today is wait six months and hope. ShieldClaw replaces it with a continuously-running agent that carries cryptographic proof of consent, bills per verified finding, and stakes its reputation on every report it files.

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

1. **~6h** — Scaffold OpenClaw agent; nuclei scans a target; structured findings out.
2. **~8h** — ERC-8004 scope-grant verification; agent hard-refuses unauthorized scans.
3. **~8h** — x402 per-finding billing + dispute window.
4. **~8h** — Demo target with planted vulns + Slack webhook.
5. **~8h** — End-to-end rehearsal + fallback video (in case live demo dies on stage).
6. **~10h** — Pitch deck, README polish, sleep ~4h.

## Open decisions to resolve before writing code

- **ERC-8004 scope-grant schema.** Fields, signature format, revocation semantics. Novel piece — get it right first. See `shared/SCHEMA.md`.
- **Dispute window mechanics.** How the customer disputes a finding. Slashing curve.
- **Scanner orchestration boundary.** Subprocess vs. container vs. sandbox. Pick the simplest that doesn't blow up the host.
- **Sponsor starter templates.** Check what OpenClaw / x402 / GOAT teams ship — don't rebuild what they give free.
- **Implementation language.** Not yet decided. Pin once the sponsor templates are reviewed.

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
