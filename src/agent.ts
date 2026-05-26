// Agent loop — Claude API tool use.
// Each skill is a Claude tool. Claude decides which to call and in what order.
// This is the same pattern OpenClaw uses internally.
// If ClawUp wiring is needed, the mentor will plug this into ClawUp at the event.

import Anthropic from '@anthropic-ai/sdk'
import { config } from './utils/config.js'
import { log } from './utils/logger.js'
import { sendAlert } from './utils/telegram.js'
import { triggerPayment } from './chain/payments.js'
import { logActionOnChain } from './chain/identity.js'
import { sendReport } from './utils/telegram.js'
import {
  sqlInjectionSkill,
  portScannerSkill,
  sslCheckerSkill,
  credentialExposureSkill,
} from './skills/index.js'
import type { AttackResult, ScanReport } from './types.js'

const client = new Anthropic({ apiKey: config.anthropicApiKey })

const SKILLS = [sqlInjectionSkill, portScannerSkill, sslCheckerSkill, credentialExposureSkill]

// Claude tool definitions (one per skill)
const tools: Anthropic.Tool[] = SKILLS.map((s) => ({
  name: s.name,
  description: s.description,
  input_schema: s.input_schema,
}))

// Dispatch a tool call to the matching skill
async function dispatchTool(
  name: string,
  input: Record<string, unknown>
): Promise<AttackResult> {
  const skill = SKILLS.find((s) => s.name === name)
  if (!skill) throw new Error(`Unknown skill: ${name}`)
  return skill.execute(input as { targetUrl: string })
}

export async function runScan(agentId: string, targetUrl: string): Promise<void> {
  const scanStarted = Date.now()
  const results: AttackResult[] = []

  await sendAlert(`🔴 RED MODE: ShieldClaw scanning ${targetUrl}`)
  log('SCAN_STARTED', { target: targetUrl })

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `Run a full security scan on ${targetUrl}. Use all available attack skills. Return results for each.`,
    },
  ]

  const systemPrompt = `
You are ShieldClaw, an autonomous cybersecurity agent (ERC-8004 ID: ${agentId}).

You are in RED MODE. Your job is to find real, exploitable vulnerabilities — not just
scan for known CVEs. Use every available skill against the target.

Run each skill in this order:
1. sql_injection_attack
2. credential_exposure
3. port_scanner
4. ssl_checker

Call each skill with the provided target URL. After all skills complete, stop — the
orchestrator handles reporting and payment.
  `.trim()

  // Agentic loop: Claude calls tools until it's done
  while (true) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages,
    })

    // Append Claude's response to message history
    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'end_turn') break

    if (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue

        let result: AttackResult
        try {
          result = await dispatchTool(block.name, block.input as Record<string, unknown>)
        } catch (err) {
          result = {
            success: false,
            attackType: 'SQL_INJECTION', // fallback type
            vulnerability: `Skill error: ${err}`,
            location: targetUrl,
            severity: 'LOW',
            timestamp: Date.now(),
          }
        }

        results.push(result)

        if (result.success) {
          await sendAlert(
            `🔥 ${result.attackType.replace('_', ' ')} — ${result.severity}\n` +
              `📍 ${result.location}\n` +
              (result.payload ? `💥 ${result.payload}\n` : '') +
              (result.evidence ? `📋 ${result.evidence.slice(0, 120)}` : '')
          )
          log('ATTACK_SUCCEEDED', { target: result.location, result: result.vulnerability })
          await logActionOnChain({ action: 'ATTACK_SUCCEEDED', target: result.location, result: result.vulnerability, timestamp: Date.now() })
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        })
      }

      messages.push({ role: 'user', content: toolResults })
    }
  }

  // Tally and pay
  const found = results.filter((r) => r.success)
  const payment = await triggerPayment(found.length)

  // Compile and send final report
  const report: ScanReport = {
    agentId,
    target: targetUrl,
    scanStarted,
    scanCompleted: Date.now(),
    results,
    totalFound: found.length,
    paymentTriggered: payment.success,
    paymentAmountUsdc: payment.amountUsdc,
    onChainLogTx: payment.txHash,
  }

  await sendReport(report)
  log('SCAN_COMPLETED', { target: targetUrl, result: `${found.length} vulnerabilities found` })
}
