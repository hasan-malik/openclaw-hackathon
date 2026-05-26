import "dotenv/config";
import { signScopeGrant } from "@onchain/scope-grant";
import { upsertGrant } from "@agent/store";
import type { ScopeGrant } from "@shared/types";

async function main() {
  const pk = process.env.AGENT_PRIVATE_KEY as `0x${string}` | undefined;
  const target = process.env.DEMO_TARGET_URL || "http://localhost:3000";
  const agentId = process.env.AGENT_ID || "shieldclaw_demo";
  const customer = (process.env.AGENT_ADDRESS as `0x${string}` | undefined) ?? null;

  if (!pk || !customer) {
    console.error("AGENT_PRIVATE_KEY and AGENT_ADDRESS required in .env.");
    process.exit(1);
  }

  const now = Math.floor(Date.now() / 1000);
  const host = (() => {
    try {
      return new URL(target).hostname;
    } catch {
      return target;
    }
  })();

  const draft = {
    agentId,
    customer,
    targets: [{ kind: "domain" as const, value: host }],
    ports: [80, 443, 3000],
    scanTypes: ["nuclei" as const, "credscan" as const],
    exclusions: [],
    intensity: "passive" as const,
    notBefore: now,
    notAfter: now + 7 * 24 * 3600,
    revocable: true
  };

  const { signature, grantId } = await signScopeGrant(pk, draft);

  const grant: ScopeGrant = {
    version: "1",
    grantId,
    ...draft,
    signature
  };

  upsertGrant(grant);

  console.log("\n────────────────────────────────────────");
  console.log(" Scope grant signed and stored");
  console.log("────────────────────────────────────────");
  console.log(" Grant ID :", grant.grantId);
  console.log(" Target   :", host);
  console.log(" Window   :", new Date(now * 1000).toISOString(), "→", new Date((now + 7 * 86400) * 1000).toISOString());
  console.log(" Intensity:", grant.intensity);
  console.log("────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("[sign-scope] failed:", err);
  process.exit(1);
});
