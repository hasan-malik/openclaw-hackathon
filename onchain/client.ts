import { createPublicClient, createWalletClient, http, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { goatNetwork, GOAT_RPC_URL } from "./constants";

export function publicClient() {
  return createPublicClient({
    chain: goatNetwork,
    transport: http(GOAT_RPC_URL)
  });
}

export function walletClient(privateKey: `0x${string}`) {
  const account = privateKeyToAccount(privateKey);
  return {
    account,
    client: createWalletClient({
      account,
      chain: goatNetwork,
      transport: http(GOAT_RPC_URL)
    })
  };
}

export function explorerTx(hash: string) {
  return `https://explorer.goat.network/tx/${hash}`;
}

export function explorerAddr(addr: Address | string) {
  return `https://explorer.goat.network/address/${addr}`;
}

export function agentScanUrl(agentId: string | number) {
  return `https://8004scan.io/agents/${agentId}?chain=2345`;
}
