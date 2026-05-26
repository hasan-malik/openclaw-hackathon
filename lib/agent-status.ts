import { publicClient } from "@onchain/client";
import { USDC_ADDRESS, ERC20_ABI } from "@onchain/constants";
import { formatUnits } from "viem";

export type AgentStatus = {
  agentName: string;
  agentId: string | null;
  walletAddress: string | null;
  usdcBalance: string | null;
  registered: boolean;
  x402Configured: boolean;
};

export async function getAgentStatus(): Promise<AgentStatus> {
  const agentName = process.env.AGENT_NAME || "shieldclaw_demo";
  const walletAddress = (process.env.AGENT_ADDRESS as `0x${string}` | undefined) ?? null;
  const agentId = process.env.AGENT_ID ?? null;
  const x402Configured =
    !!process.env.GOATX402_API_KEY && !!process.env.GOATX402_MERCHANT_ID;

  let usdcBalance: string | null = null;
  if (walletAddress) {
    try {
      const client = publicClient();
      const raw = await client.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [walletAddress]
      });
      usdcBalance = Number(formatUnits(raw as bigint, 6)).toFixed(2);
    } catch {
      usdcBalance = null;
    }
  }

  return {
    agentName,
    agentId,
    walletAddress,
    usdcBalance,
    registered: !!agentId,
    x402Configured
  };
}
