---
name: shieldclaw-hackathon
description: Project-specific skill for shipping the ShieldClaw demo within a 48h hackathon window. Apply when working in this repo — biases decisions toward demo-path completeness over architectural elegance.
---

# Skill: ship-the-shieldclaw-demo

A guide for agents and humans on what to prioritize while building ShieldClaw. Apply this lens whenever picking between two reasonable approaches.

## The single judging moment we optimize for

A judge:
1. Asks the agent what it does (usability / self-disclosure test).
2. Watches the agent scan a planted-vuln target and post a finding to Telegram/Slack.
3. Sees the agent's identity on https://8004scan.io/agents?chain=2345 (ERC-8004 mainnet submission gate).
4. Triggers a machine payment in-chat and sees x402 / USDC fire on https://explorer.goat.network/ (402-integrity test).
5. Attempts a high-risk action (out-of-scope scan, raised spending limit) and sees the agent refuse (human-in-the-loop guardrail test).

**Every decision should be evaluated against: "does this make those five moments work, or risk one?"**

ClawUp is down. We are not deploying on it. The agent runs locally (laptop or VPS). If ClawUp returns near demo time, porting is a bonus, not a goal.

## Priority order when trade-offs appear

1. **Submission gates pass** — agent registered on ERC-8004 mainnet AND x402 payment provably fires. Without these, the submission is rejected on the form.
2. **Live demo works** — the agent visibly does the thing in 2 minutes, no slides.
3. **Authorization-refusal story is airtight** — judges actively test high-risk commands. Refusing an out-of-scope scan is as impressive as a finding.
4. **Per-finding billing is visible on the explorer** — judges click the tx hash.
5. **Code quality** — only after 1–4 are solid.
6. **Generalization / extensibility / ClawUp port** — bonus only. Don't build it on the critical path.

## Heuristics

- **Prefer subprocess over framework integration** for invoking nuclei / nmap unless OpenClaw ships a first-class wrapper. We don't have time to debug toolchain glue.
- **Hardcode the demo target in config**, with a clear `# TODO: parameterize` comment. Parameterization is a post-hackathon concern.
- **Plant vulns that nuclei will reliably catch** — exposed `.env`, known-CVE jQuery version, default admin creds. Don't plant something subtle that might miss on stage.
- **Record a fallback video** of the full flow by Phase 5 (hour ~30). If live demo fails, switch to the video without losing the room.
- **Two `.env` files**: one for local dev, one matched to the live demo box. The demo box's env is sacred — don't touch it after rehearsal.

## When to push back on the user

- If the user wants to add a feature outside the five deliverables in [CLAUDE.md](CLAUDE.md), name the trade-off explicitly: *"this costs ~X hours from Phase Y. Cut what?"*
- If the user wants to rebuild something a sponsor template already provides, say so before writing code.
- If the user wants to skip the authorization-refusal demo to save time, push back hard — that's the novel piece.

## When to escalate to the team

- The ERC-8004 scope-grant schema changes (everyone depends on it).
- A scanner choice changes (affects what vulns to plant in the demo target).
- The deploy target changes (whoever owns the box needs to know).

## What "done" feels like

If you can `git pull main` on a fresh laptop, run one script, and watch a finding land in the demo Slack within 10 minutes — we're done. Anything past that is polish.
