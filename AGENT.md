# AGENT.md

Universal guidance for any AI coding agent (Claude Code, Cursor, Codex, Aider, Continue, etc.) working in this repo.

**Canonical context lives in [CLAUDE.md](CLAUDE.md).** Read it first — it has the project pitch, design moves, deliverables, scope cuts, and phase plan.

## Quick orientation for agents

1. This is a **hackathon project** (~48h). Prefer shipping the demo path over architectural perfection.
2. This is an **OpenClaw application**, *not a fork* of OpenClaw. OpenClaw is a dependency.
3. The two pieces judges look hardest at:
   - **ERC-8004 scope-grant schema** (in `onchain/` and `shared/SCHEMA.md`)
   - **x402 per-finding billing with dispute window**
4. Implementation language is **not yet pinned** — check the latest commit on `main` or ask the user before generating code in a specific stack.

## House rules

- **Never read or echo `.env` files or anything in `secrets/`.** The user loads secrets themselves.
- **Don't push to `main` directly.** PR through a feature branch.
- **Don't invent sponsor APIs.** If you don't know how OpenClaw / ClawUp / x402 / ERC-8004 / GOAT actually work, say so and ask for docs or starter templates rather than hallucinating.
- **Don't expand scope.** The explicit cuts in CLAUDE.md (no manual exploit pivoting, no social engineering, no DoS, no compliance certification) are deliberate — judges will be told about them.
- **Confirm before destructive ops** (force push, rebase shared branches, dropping anything in `demo-target/` once it's wired).

## What "done" looks like for each PR

- Touches one slice (agent, onchain, demo-target, scripts, shared).
- Updates `shared/SCHEMA.md` if it changes a data shape.
- Includes a one-line note in the PR description about what the demo path looks like with this change merged.

## When in doubt

Ask the user. Hackathon time budget is small — better to lose 90 seconds clarifying than 4 hours rebuilding.
