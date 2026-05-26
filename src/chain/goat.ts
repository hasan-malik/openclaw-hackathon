import { createPublicClient, createWalletClient, http, defineChain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { config } from '../utils/config.js'

// GOAT Network chain definition (Bitcoin-secured L2)
export const goatNetwork = defineChain({
  id: config.goatChainId,
  name: 'GOAT Network',
  nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 18 },
  rpcUrls: {
    default: { http: [config.goatRpcUrl] },
  },
  blockExplorers: {
    default: { name: 'GOAT Explorer', url: config.goatExplorerUrl },
  },
})

export const account = privateKeyToAccount(config.agentPrivateKey)

export const publicClient = createPublicClient({
  chain: goatNetwork,
  transport: http(config.goatRpcUrl),
})

export const walletClient = createWalletClient({
  account,
  chain: goatNetwork,
  transport: http(config.goatRpcUrl),
})

export async function isConnected(): Promise<boolean> {
  try {
    await publicClient.getBlockNumber()
    return true
  } catch {
    return false
  }
}

export function getExplorerUrl(txHash: string): string {
  return `${config.goatExplorerUrl}/tx/${txHash}`
}
