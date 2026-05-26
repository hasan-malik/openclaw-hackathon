// x402 per-finding payment trigger.
// Uses goatx402-sdk-server — get merchant credentials from https://x402-merchant.goat.network/
//
// TODO (with GOAT mentor): confirm exact SDK import and method names from goatx402-sdk-server.
// Function signatures and logic below are correct — only the SDK call needs wiring.

import { config } from '../utils/config.js'
import { log } from '../utils/logger.js'

export interface PaymentResult {
  success: boolean
  amountUsdc: number
  txHash?: string
  error?: string
}

export async function triggerPayment(vulnerabilitiesFound: number): Promise<PaymentResult> {
  const amount = vulnerabilitiesFound * config.pricePerVulnerabilityUsdc

  if (amount === 0) {
    return { success: false, amountUsdc: 0 }
  }

  try {
    // TODO (with mentor): replace with actual goatx402-sdk-server call
    // Something like:
    //   import { createMerchant } from 'goatx402-sdk-server'
    //   const merchant = createMerchant({ apiKey, apiSecret, merchantId, receivingWallet })
    //   const result = await merchant.charge({ amountUsdc: amount, reason: `${vulnerabilitiesFound} vulnerabilities found` })
    //   return { success: true, amountUsdc: amount, txHash: result.txHash }

    // DEMO FALLBACK: simulate a successful payment for demo reliability
    // Remove this block once real x402 is wired
    console.log(`💰 x402 payment triggered: ${amount} USDC (${vulnerabilitiesFound} vulnerabilities)`)
    log('PAYMENT_TRIGGERED', { result: `${amount} USDC for ${vulnerabilitiesFound} findings` })

    return {
      success: true,
      amountUsdc: amount,
      txHash: undefined, // will be real tx hash once SDK is wired
    }
  } catch (err) {
    console.error('⚠️  x402 payment failed:', err)
    log('PAYMENT_FAILED', { result: String(err) })
    return { success: false, amountUsdc: amount, error: String(err) }
  }
}
