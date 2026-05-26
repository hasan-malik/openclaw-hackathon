# demo-target/

The deliberately-vulnerable target ShieldClaw scans on stage.

**Owner:** _TBD_

## Layout

- `docker-compose.yml` — boots OWASP Juice Shop on `:3000` and an Nginx serving `planted/` on `:8081`.
- `planted/` — controlled vulnerabilities the agent must reliably catch in the 2-min demo:
  - `planted/.env` — reachable secrets file (`/static/.env` on the demo Nginx).
  - `planted/index.html` — leaked Stripe-shaped key inside an HTML comment.
  - `planted/assets/jquery-1.6.4.min.js` — placeholder; replace with the real jQuery 1.6.4 source so the nuclei technology-detect template fires.

## Bring it up

```
cd demo-target
docker compose up -d
curl http://localhost:8081/.env
curl http://localhost:3000
```

Set `DEMO_TARGET_URL=http://localhost:8081` (or `:3000` for Juice Shop) in `.env`, sign a scope grant with `npm run sign-scope`, then `npm run agent`.

## Rules of the planted vulns

- Must be **reliably triggered** by stock nuclei templates. No subtle bugs.
- Must look believable enough to be a real finding on stage but **not be a real key or credential**.
- Never expose this on the public internet behind a real domain. Localhost or ngrok only.
