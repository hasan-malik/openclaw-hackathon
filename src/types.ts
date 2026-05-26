// Shared types — every other file imports from here.
// Change here first, then update callers.

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export type AttackType = 'SQL_INJECTION' | 'PORT_SCAN' | 'SSL_CHECK' | 'CREDENTIAL_EXPOSURE'

export interface AttackResult {
  success: boolean
  attackType: AttackType
  vulnerability: string  // human readable: "SQL injection in login form"
  location: string       // which endpoint/host: "/api/login username field"
  severity: Severity
  payload?: string       // what was sent: "' OR '1'='1"
  evidence?: string      // proof: "server returned admin role + user table"
  timestamp: number
}

export interface ScanReport {
  agentId: string        // ERC-8004 wallet address
  target: string
  scanStarted: number
  scanCompleted: number
  results: AttackResult[]
  totalFound: number
  paymentTriggered: boolean
  paymentAmountUsdc: number
  onChainLogTx?: string  // GOAT transaction hash
}

export interface ActionLog {
  action: string
  target?: string
  result?: string
  timestamp: number
  txHash?: string
}
