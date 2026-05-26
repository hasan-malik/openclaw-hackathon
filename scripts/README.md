# scripts/

Operational CLIs. Run via `npm run <script>`.

| Command | What it does |
|---|---|
| `npm run wallet` | Generates a new private key + address. Prints to stdout — paste into `.env`. |
| `npm run sign-scope` | Signs an EIP-712 scope grant for `DEMO_TARGET_URL`. Stores it in `.shieldclaw/scope-grants.json`. |
| `npm run register` | Registers the agent on ERC-8004 (GOAT mainnet). Requires gas in the agent wallet. |
| `npm run agent` | Boots the scan loop. |
| `npm run dev` | Boots the Next.js dashboard on `:3000` (or 3001 if Juice Shop is on 3000). |

## Add later

- `register-x402.ts` — full x402 merchant onboarding flow once we have credentials.
- `record-fallback.sh` — capture the demo flow as a video for the live-failure fallback.
- `deploy.sh` — rsync to the demo box + restart the worker.
