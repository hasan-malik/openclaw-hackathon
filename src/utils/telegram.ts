import { Telegraf, type Context } from 'telegraf'
import { config } from './config.js'
import type { ScanReport } from '../types.js'

export const bot: Telegraf<Context> = new Telegraf(config.telegramBotToken)

export async function sendAlert(message: string): Promise<void> {
  await bot.telegram.sendMessage(config.telegramChannelId, message)
}

export async function sendReport(report: ScanReport): Promise<void> {
  const duration = Math.round((report.scanCompleted - report.scanStarted) / 1000)
  const found = report.results.filter((r) => r.success)

  const findings = found
    .map((r, i) => {
      const lines = [
        `[${i + 1}] ${r.attackType.replace('_', ' ')} — ${r.severity}`,
        `    📍 ${r.location}`,
      ]
      if (r.payload) lines.push(`    💥 Payload: ${r.payload}`)
      if (r.evidence) lines.push(`    📋 Evidence: ${r.evidence.slice(0, 120)}`)
      return lines.join('\n')
    })
    .join('\n\n')

  const explorerUrl = report.onChainLogTx
    ? `${config.goatExplorerUrl}/tx/${report.onChainLogTx}`
    : null

  const message = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '🛡️ SHIELDCLAW SECURITY REPORT',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `🎯 Target: ${report.target}`,
    `🤖 Agent ID: ${report.agentId}`,
    `⏱️ Scan Duration: ${duration}s`,
    '',
    `🔴 VULNERABILITIES FOUND: ${report.totalFound}`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    found.length > 0 ? findings : 'No vulnerabilities found.',
    '',
    report.paymentTriggered
      ? `💰 CHARGED: ${report.paymentAmountUsdc} USDC via x402`
      : '💰 No charge — no vulnerabilities found.',
    explorerUrl ? `🔗 On-chain log: ${explorerUrl}` : '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  ]
    .filter(Boolean)
    .join('\n')

  await bot.telegram.sendMessage(config.telegramChannelId, message)
}
