import type { ActionLog } from '../types.js'

const _log: ActionLog[] = []

export function log(action: string, details?: Omit<ActionLog, 'action' | 'timestamp'>): void {
  const entry: ActionLog = { action, timestamp: Date.now(), ...details }
  _log.push(entry)
  console.log(`[${new Date(entry.timestamp).toISOString()}] ${action}`, details ?? '')
}

export function getLog(): ActionLog[] {
  return [..._log]
}

export function printLog(): void {
  console.log('\n=== ACTION LOG ===')
  _log.forEach((e, i) => {
    const ts = new Date(e.timestamp).toISOString()
    console.log(`${i + 1}. [${ts}] ${e.action}`)
    if (e.target) console.log(`   target: ${e.target}`)
    if (e.result) console.log(`   result: ${e.result}`)
    if (e.txHash) console.log(`   tx: ${e.txHash}`)
  })
  console.log('==================\n')
}
