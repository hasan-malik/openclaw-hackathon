# Deploy setup

The dashboard deploys to Vercel via GitHub Actions on every push to `main` or `hasan-basic`, and creates preview URLs for every PR.

## Two paths, pick one

### Path A — One-click (no Actions, simplest)
1. Go to https://vercel.com/new
2. Import `hasan-malik/openclaw-hackathon`
3. Click Deploy. Vercel handles the rest, auto-deploys on every push.
4. **Delete `.github/workflows/deploy.yml`** — you don't need it.

### Path B — Via GitHub Actions (gives CI gating + PR preview comments)
This is what's currently wired. Setup:

1. **Get a Vercel token**: https://vercel.com/account/tokens → "Create" → name it `shieldclaw-ci`, scope to your account, copy the token.

2. **Link the project locally** (one-time):
   ```bash
   npm i -g vercel
   vercel login
   vercel link   # creates a Vercel project named after this repo
   ```
   This creates `.vercel/project.json` containing `orgId` and `projectId`. **Don't commit that file** — it's already gitignored.

3. **Add three secrets** to the GitHub repo (Settings → Secrets and variables → Actions → New repository secret):
   - `VERCEL_TOKEN` — from step 1
   - `VERCEL_ORG_ID` — copy from `.vercel/project.json` → `orgId`
   - `VERCEL_PROJECT_ID` — copy from `.vercel/project.json` → `projectId`

4. **Push something** → Actions tab → watch the deploy run → URL is printed in the "Deploy" step and posted as a PR comment if it's a PR.

## What gets deployed

The Next.js app (dashboard + API routes). The agent **worker** (`npm run agent`) does **not** deploy — it needs `nuclei` on the host and runs as a long-lived process. Run it on the demo box or your laptop.

## What does *not* work in deploy

- **The JSON file store** (`.shieldclaw/findings.json`) doesn't persist across Vercel serverless cold starts. Mock data re-seeds on every cold start — fine for the demo, not for production. If we need real persistence, swap `agent/store.ts` for Vercel KV (3 lines) or a Postgres on Neon (15 lines).
- **Subprocess scanning** (the `nuclei` shell-out in `agent/scanner.ts`) isn't supported on serverless. Scanning has to happen on a real host. The dashboard only displays findings.
