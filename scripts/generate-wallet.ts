import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log("\n────────────────────────────────────────");
console.log(" ShieldClaw agent wallet (KEEP PRIVATE)");
console.log("────────────────────────────────────────");
console.log(" Address     :", account.address);
console.log(" Private key :", privateKey);
console.log("────────────────────────────────────────");
console.log("\nAdd to .env:");
console.log(`AGENT_ADDRESS=${account.address}`);
console.log(`AGENT_PRIVATE_KEY=${privateKey}\n`);
console.log("Next:");
console.log(" 1. Fund via the GOAT gas form (see CLAUDE.md).");
console.log(" 2. Request testnet/mainnet USDC via the stables form.");
console.log(" 3. Run `npm run register` after gas arrives.\n");
