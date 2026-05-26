import 'dotenv/config'
import { config } from './utils/config.js'
import { log, printLog } from './utils/logger.js'
import { bot, sendAlert } from './utils/telegram.js'
import { isConnected } from './chain/goat.js'
import { registerIdentity, getAgentId } from './chain/identity.js'
import { runScan } from './agent.js'

async function main() {
  console.log('🛡️  ShieldClaw starting...')

  // 1. Validate GOAT Network connection
  const connected = await isConnected()
  if (!connected) throw new Error('Cannot connect to GOAT Network — check GOAT_RPC_URL')
  console.log('✓ Connected to GOAT Network')

  // 2. Register ERC-8004 identity (idempotent — safe to call every startup)
  const agentId = await registerIdentity()
  console.log(`✓ Agent ID: ${agentId}`)

  // 3. Send startup message to Telegram
  await sendAlert(
    [
      '🛡️ ShieldClaw ONLINE',
      `🤖 Agent ID: ${agentId}`,
      `🎯 Target: ${config.targetUrl}`,
      '⚡ Mode: RED TEAM (attack only)',
      '',
      'Commands:',
      '/scan — start vulnerability scan',
      '/status — agent status',
      '/log — print action log',
      '',
      'Ready. Send /scan to begin.',
    ].join('\n')
  )
  console.log('✓ Startup message sent to Telegram')

  // 4. Register Telegram command handlers
  bot.command('scan', async (ctx) => {
    await ctx.reply('🔴 Starting scan...')
    try {
      await runScan(agentId, config.targetUrl)
    } catch (err) {
      await ctx.reply(`❌ Scan failed: ${err}`)
      console.error('Scan error:', err)
    }
  })

  bot.command('status', async (ctx) => {
    const connected = await isConnected()
    await ctx.reply(
      [
        '🛡️ ShieldClaw Status',
        `Agent ID: ${getAgentId()}`,
        `GOAT Network: ${connected ? '✓ Connected' : '✗ Disconnected'}`,
        `Target: ${config.targetUrl}`,
        `Mode: RED TEAM`,
      ].join('\n')
    )
  })

  bot.command('log', async (ctx) => {
    printLog()
    await ctx.reply('Action log printed to console.')
  })

  bot.command('help', async (ctx) => {
    await ctx.reply(
      '/scan — run full vulnerability scan\n/status — check agent status\n/log — print action log'
    )
  })

  // 5. Start bot
  bot.launch()
  log('AGENT_INITIALIZED', { result: agentId })
  console.log('✓ ShieldClaw running — waiting for /scan command in Telegram')

  // Graceful shutdown
  process.once('SIGINT', () => bot.stop('SIGINT'))
  process.once('SIGTERM', () => bot.stop('SIGTERM'))
}

main().catch((err) => {
  console.error('❌ ShieldClaw failed to start:', err.message)
  process.exit(1)
})
