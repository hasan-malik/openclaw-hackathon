# scripts/

Operational scripts: setup, deploy, end-to-end rehearsal.

**Owner:** _TBD_ (typically whoever owns the live demo box)

## Likely contents

- `setup.sh` — install nuclei, nmap, language deps; pull nuclei templates
- `register-agent.sh` — one-shot ERC-8004 registration on GOAT testnet
- `sign-scope-grant.sh` — produce a `ScopeGrant` for the demo target
- `run-demo.sh` — start agent + demo target + tail Slack-bound webhook
- `record-fallback.sh` — capture the full demo flow as video (Phase 5)
