import { publicClient, walletClient } from "./client";
import { ERC8004_ABI, ERC8004_REGISTRY_ADDRESS } from "./constants";
import { decodeEventLog, type Hex } from "viem";

export async function registerAgent(privateKey: `0x${string}`, name: string) {
  const { account, client } = walletClient(privateKey);
  const pub = publicClient();

  const hash = await client.writeContract({
    address: ERC8004_REGISTRY_ADDRESS,
    abi: ERC8004_ABI,
    functionName: "register",
    args: [name]
  });

  const receipt = await pub.waitForTransactionReceipt({ hash });

  let agentId: bigint | null = null;
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: ERC8004_ABI,
        data: log.data,
        topics: log.topics
      });
      if (decoded.eventName === "Transfer") {
        agentId = decoded.args.tokenId;
        break;
      }
    } catch {
      // ignore non-matching logs
    }
  }

  return { hash, agentId, account: account.address };
}

export async function getAgentWallet(agentId: bigint) {
  const pub = publicClient();
  return pub.readContract({
    address: ERC8004_REGISTRY_ADDRESS,
    abi: ERC8004_ABI,
    functionName: "getAgentWallet",
    args: [agentId]
  });
}

export function buildAgentMetadata(opts: {
  name: string;
  description?: string;
  url?: string;
  wallet: Hex;
  x402?: {
    merchantId: string;
    receivingWallet: Hex;
    chainId: number;
    token: "USDC";
  };
}) {
  return {
    name: opts.name,
    description: opts.description ?? "ShieldClaw — autonomous security auditing agent (ERC-8004).",
    url: opts.url ?? "https://github.com/hasan-malik/openclaw-hackathon",
    wallet: opts.wallet,
    ...(opts.x402 ? { x402: opts.x402 } : {})
  };
}
