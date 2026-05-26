# clawup/ — ClawUp port materials

If ClawUp is stable enough to bet on at demo time, port the standalone agent into a ClawUp skill using the files in this folder.

## When to do this

- After the standalone build is rehearsed and works end-to-end (dashboard chat + demo target findings + scope refusal).
- After ClawUp has been **verified stable for at least 30 minutes** in the OpenClaw-in-Toronto Telegram channel.
- Never as a foundational dependency — this is a bonus surface.

## Files

- [SKILL.md](SKILL.md) — the skill definition. ClawUp's `/skill_creator` will use this as the basis; you can also paste it into the clawbot directly.
- [PROMPTS.md](PROMPTS.md) — copy-paste-ready prompts to drive the clawbot through skill creation, sanity checks, and wiring.

## Sequence

1. **Pre-flight** — confirm ClawUp is up:
   - Log in at https://app.clawup.org/ (or your existing clawbot Telegram chat)
   - Send `/help` to the clawbot, confirm a response within 5 seconds
2. **Skill creation** — paste Prompt 1 from PROMPTS.md into the clawbot. Wait for the skill folder confirmation.
3. **Sanity / tool / guardrail tests** — Prompts 2–4. All three must pass.
4. **Wire identity + x402** — Prompts 5–6 only if the gate work hasn't already been done from the repo (`npm run register` and the x402 portal). Don't double-execute.

## Acceptance criteria

The ClawUp port is "good enough" if:
- The clawbot replies to "what do you do?" with the ShieldClaw self-disclosure
- The clawbot refuses an out-of-scope scan request
- The clawbot calls *at least one* tool (e.g. `list_findings`) successfully

You don't need the full tool surface working in ClawUp — the standalone build is the source of truth for that. The ClawUp port is for *judge appeal*, not for end-to-end functionality.

## If ClawUp breaks mid-port

Stop. The standalone is what wins the demo. Don't spend more than **1 hour total** on the ClawUp port.
