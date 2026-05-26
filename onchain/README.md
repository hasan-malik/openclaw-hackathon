# onchain/

ERC-8004 agent identity + scope-grant signing + x402 billing. The most novel piece — judges weigh this hardest.

**Owner:** _TBD_

## Files

- `constants.ts` — GOAT mainnet config (chain ID 2345, RPC, registry address, USDC address), ABIs, viem chain definition.
- `client.ts` — `publicClient()` / `walletClient()` / explorer URL helpers.
- `erc8004.ts` — `registerAgent()` + metadata builder. Calls `register(string)` on `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`.
- `scope-grant.ts` — EIP-712 typed-data signer + verifier. Off-chain signing, on-chain hash anchoring.
- `x402.ts` — fetch-based x402 client. Stubs when merchant env missing. Swap for `goatx402-sdk-server` once installed.
- `register-agent.ts` — CLI: `npm run register`. Calls `register(name)` on the live registry, prints the agent ID, suggests Gist metadata JSON.

## Scope-grant design (the novel piece)

ERC-8004 itself is *just an identity registry* (`register(string name)` + a metadata URI). It doesn't carry scope grants natively. We build scope grants on top:

1. **Off-chain**: customer signs an EIP-712 typed-data message declaring `{agentId, customer, targets, ports, scanTypes, intensity, notBefore, notAfter, revocable}`.
2. **Hash anchored on-chain**: optional — the grant hash can be written to a small on-chain contract for verifiable provenance. For the demo, the signature alone is enough.
3. **Agent verifies locally** before every probe. `isTargetInScope()` in `scope-grant.ts` is the gate.
4. **Revocation** is a customer-signed counter-message; current code treats revocation as a TODO.

## End-to-end happy path

```
npm run wallet       # generate agent wallet
# request gas + USDC via the GOAT forms in CLAUDE.md
npm run register     # ERC-8004 mainnet registration
npm run sign-scope   # customer signs a grant for the demo target
npm run agent        # the loop starts scanning + billing
```
