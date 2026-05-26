import "dotenv/config";
import { registerAgent, buildAgentMetadata } from "./erc8004";
import { explorerTx, agentScanUrl } from "./client";

async function main() {
  const pk = process.env.AGENT_PRIVATE_KEY as `0x${string}` | undefined;
  const name = process.env.AGENT_NAME || "shieldclaw_demo";

  if (!pk) {
    console.error("AGENT_PRIVATE_KEY missing in .env. Run `npm run wallet` first.");
    process.exit(1);
  }

  console.log(`[register] Registering "${name}" on ERC-8004 (GOAT mainnet)…`);

  const { hash, agentId, account } = await registerAgent(pk, name);

  console.log("\n────────────────────────────────────────");
  console.log(" Registration submitted");
  console.log("────────────────────────────────────────");
  console.log(" Tx hash :", hash);
  console.log(" Explorer:", explorerTx(hash));
  console.log(" Agent  :", account);
  if (agentId !== null) {
    console.log(" Agent ID:", agentId.toString());
    console.log(" Listing :", agentScanUrl(agentId.toString()));
  } else {
    console.warn(" Agent ID could not be recovered from logs — verify manually on the explorer.");
  }
  console.log("────────────────────────────────────────\n");

  if (agentId !== null) {
    console.log("Add to .env:");
    console.log(`AGENT_ID=${agentId.toString()}\n`);
  }

  console.log("Suggested agent metadata JSON (host as a public Gist, point AGENT_URI at the raw URL):");
  console.log(
    JSON.stringify(
      buildAgentMetadata({
        name,
        wallet: account,
        url: "https://github.com/hasan-malik/openclaw-hackathon"
      }),
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error("[register] failed:", err);
  process.exit(1);
});
