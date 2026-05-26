import { defineChain } from "viem";

export const GOAT_CHAIN_ID = 2345;
export const GOAT_RPC_URL = process.env.GOAT_RPC_URL || "https://rpc.goat.network";
export const GOAT_EXPLORER = "https://explorer.goat.network";

export const goatNetwork = defineChain({
  id: GOAT_CHAIN_ID,
  name: "GOAT Network",
  nativeCurrency: { name: "BTC", symbol: "BTC", decimals: 18 },
  rpcUrls: {
    default: { http: [GOAT_RPC_URL] }
  },
  blockExplorers: {
    default: { name: "GOAT Explorer", url: GOAT_EXPLORER }
  }
});

export const ERC8004_REGISTRY_ADDRESS =
  "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" as const;

export const USDC_ADDRESS = "0x3022b87ac063DE95b1570F46f5e470F8B53112D8" as const;

export const ERC8004_ABI = [
  {
    type: "function",
    name: "register",
    stateMutability: "nonpayable",
    inputs: [{ name: "name", type: "string" }],
    outputs: []
  },
  {
    type: "function",
    name: "getAgentWallet",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }]
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true }
    ]
  }
] as const;

export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }]
  }
] as const;

export const AGENT_DASHBOARD = "https://8004scan.io/agents?chain=2345" as const;
