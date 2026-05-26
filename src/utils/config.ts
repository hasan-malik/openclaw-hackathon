import 'dotenv/config'

function require_env(key: string, hint?: string): string {
  const val = process.env[key]
  if (!val) {
    const msg = hint
      ? `Missing ${key} — ${hint}`
      : `Missing ${key} — check .env (copy from .env.example)`
    throw new Error(msg)
  }
  return val
}

function optional_env(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

export const config = {
  // LLM
  anthropicApiKey: require_env('ANTHROPIC_API_KEY'),

  // GOAT Network
  goatRpcUrl: optional_env('GOAT_RPC_URL', 'https://rpc.goat.network'),
  goatChainId: parseInt(optional_env('GOAT_CHAIN_ID', '2345')),
  goatExplorerUrl: optional_env('GOAT_EXPLORER_URL', 'https://explorer.goat.network'),
  erc8004RegistryAddress: optional_env(
    'ERC8004_REGISTRY_ADDRESS',
    '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432'
  ) as `0x${string}`,
  usdcAddress: optional_env(
    'USDC_ADDRESS',
    '0x3022b87ac063DE95b1570F46f5e470F8B53112D8'
  ) as `0x${string}`,

  // Agent wallet
  agentPrivateKey: require_env(
    'AGENT_PRIVATE_KEY',
    'get from GOAT mentor or generate via AgentKit'
  ) as `0x${string}`,
  agentWalletAddress: require_env('AGENT_WALLET_ADDRESS') as `0x${string}`,
  agentName: optional_env('AGENT_NAME', 'ShieldClaw Security Agent'),
  agentVersion: optional_env('AGENT_VERSION', '1.0.0'),
  agentCapabilities: optional_env(
    'AGENT_CAPABILITIES',
    'sql_injection_testing,port_scanning,ssl_analysis'
  ).split(','),
  agentUri: optional_env('AGENT_URI', ''), // public Gist URL for ERC-8004 metadata

  // x402 payments
  x402ApiUrl: optional_env('GOATX402_API_URL', ''),
  x402ApiKey: optional_env('GOATX402_API_KEY', ''),
  x402ApiSecret: optional_env('GOATX402_API_SECRET', ''),
  x402MerchantId: optional_env('GOATX402_MERCHANT_ID', ''),
  x402ReceivingWallet: optional_env('GOATX402_RECEIVING_WALLET', ''),
  pricePerVulnerabilityUsdc: parseFloat(
    optional_env('X402_PRICE_PER_VULNERABILITY_USDC', '10')
  ),

  // Telegram
  telegramBotToken: require_env('TELEGRAM_BOT_TOKEN'),
  telegramChannelId: require_env('TELEGRAM_CHANNEL_ID'),

  // Demo
  targetUrl: optional_env('TARGET_URL', 'http://localhost:3000'),
  demoMode: optional_env('DEMO_MODE', 'true') === 'true',
} as const
