# demo-target/

The deliberately vulnerable target that ShieldClaw scans on stage. The showmanship piece.

**Owner:** _TBD_

## Plan

Base: **OWASP Juice Shop** (or DVWA) running in Docker on the demo box.

Planted vulns the agent must reliably catch on stage:

1. **Exposed `.env`** at a guessable path — `/static/.env` or similar.
2. **Known-vulnerable library** referenced in the page source (e.g. jQuery 1.x with CVE-2020-11023).
3. **Leaked API key** in a public file or HTML comment — pattern the credential scanner will flag.

Add a 4th only if Phase 4 has time left.

## Rules

- Vulns must be **reliably triggered by nuclei templates** we control. No subtle bugs that might miss on stage.
- The target's URL goes in `.env` as `DEMO_TARGET_URL`. The matching `ScopeGrant` for that URL gets pre-signed and stored as `DEMO_SCOPE_GRANT_ID`.
- **Never expose this target to the internet on a real domain.** Keep it on the demo box only, behind ngrok if needed.

## Before writing code

Read [shared/SCHEMA.md](../shared/SCHEMA.md) so the planted vulns map cleanly to `Finding` shapes.
