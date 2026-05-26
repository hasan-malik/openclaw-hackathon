# onchain/

ERC-8004 scope-grant schema + agent registration + x402 billing hooks. The most novel piece of ShieldClaw — judges look hardest here.

**Owner:** _TBD_

## Pieces inside

- ERC-8004 agent registration script (one-shot on GOAT testnet)
- `ScopeGrant` signing helper (customer side)
- `ScopeGrant` verifier (agent side) — called before every scan
- Finding-anchoring script (hash → GOAT)
- x402 per-finding payment trigger
- Dispute window + slashing curve

## Before writing code

1. Read the `ScopeGrant` shape in [shared/SCHEMA.md](../shared/SCHEMA.md). **Pin this schema first.** Every other slice depends on it.
2. Decide signature format (EIP-712 vs. raw) and revocation semantics. Document the decision in this README.
3. Check what the GOAT / x402 sponsor templates provide before writing wallet plumbing.
