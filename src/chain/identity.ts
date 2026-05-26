// ERC-8004 agent identity on GOAT Network.
// The registry contract is at config.erc8004RegistryAddress.
// register(string name) is the on-chain call — metadata lives at AGENT_URI (public Gist).
//
// TODO (with GOAT mentor): fill in the exact ABI and contract call.
// The function signatures and logic below are correct — only the ABI needs confirming.

import { config } from '../utils/config.js'
import { walletClient, publicClient, getExplorerUrl } from './goat.js'
import { log } from '../utils/logger.js'
import type { ActionLog } from '../types.js'

// Minimal ABI for ERC-8004 registry — confirm with mentor
const ERC8004_ABI = [
  {
    name: 'register',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'name', type: 'string' }],
    outputs: [],
  },
  {
    name: 'isRegistered',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

let _agentId: string | null = null

export async function registerIdentity(): Promise<string> {
  if (_agentId) return _agentId

  try {
    // Check if already registered — avoid double registration
    const already = await publicClient.readContract({
      address: config.erc8004RegistryAddress,
      abi: ERC8004_ABI,
      functionName: 'isRegistered',
      args: [config.agentWalletAddress],
    })

    if (already) {
      console.log(`✓ ERC-8004 identity already registered: ${config.agentWalletAddress}`)
      _agentId = config.agentWalletAddress
      log('IDENTITY_VERIFIED', { result: 'already_registered' })
      return _agentId
    }

    // Register with agent name — metadata at AGENT_URI (public Gist)
    const txHash = await walletClient.writeContract({
      address: config.erc8004RegistryAddress,
      abi: ERC8004_ABI,
      functionName: 'register',
      args: [config.agentName],
    })

    await publicClient.waitForTransactionReceipt({ hash: txHash })

    _agentId = config.agentWalletAddress
    log('IDENTITY_REGISTERED', { result: txHash, txHash })
    console.log(`✓ ERC-8004 identity registered: ${getExplorerUrl(txHash)}`)

    return _agentId
  } catch (err) {
    // Don't let chain errors kill the demo — log and continue with wallet address as ID
    console.error('⚠️  ERC-8004 registration failed (continuing):', err)
    log('IDENTITY_REGISTRATION_FAILED', { result: String(err) })
    _agentId = config.agentWalletAddress
    return _agentId
  }
}

export function getAgentId(): string {
  return _agentId ?? config.agentWalletAddress
}

export async function logActionOnChain(action: ActionLog): Promise<string | null> {
  // Log agent action on-chain for immutable audit trail.
  // For MVP: best-effort — failure does not break the demo.
  try {
    // TODO (with mentor): use AgentKit or direct contract call to write action log
    // For now, returns null (on-chain logging is bonus, Telegram delivery is primary)
    return null
  } catch {
    return null
  }
}
