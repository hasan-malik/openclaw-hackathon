import net from 'net'
import type { AttackResult, Severity } from '../types.js'

const DANGEROUS_PORTS: Array<{ port: number; service: string; severity: Severity }> = [
  { port: 3306, service: 'MySQL', severity: 'CRITICAL' },
  { port: 5432, service: 'PostgreSQL', severity: 'CRITICAL' },
  { port: 27017, service: 'MongoDB', severity: 'CRITICAL' },
  { port: 6379, service: 'Redis', severity: 'CRITICAL' },
  { port: 9200, service: 'Elasticsearch', severity: 'CRITICAL' },
  { port: 23, service: 'Telnet', severity: 'CRITICAL' },
  { port: 21, service: 'FTP', severity: 'HIGH' },
  { port: 5984, service: 'CouchDB', severity: 'HIGH' },
]

function checkPort(host: string, port: number, timeoutMs = 1000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    socket.setTimeout(timeoutMs)
    socket.on('connect', () => { socket.destroy(); resolve(true) })
    socket.on('timeout', () => { socket.destroy(); resolve(false) })
    socket.on('error', () => { socket.destroy(); resolve(false) })
    socket.connect(port, host)
  })
}

export async function portScanAttack(targetUrl: string): Promise<AttackResult> {
  const host = new URL(targetUrl).hostname
  const openPorts: string[] = []

  await Promise.all(
    DANGEROUS_PORTS.map(async ({ port, service, severity }) => {
      const open = await checkPort(host, port)
      if (open) openPorts.push(`${port} (${service}) — ${severity}`)
    })
  )

  if (openPorts.length > 0) {
    return {
      success: true,
      attackType: 'PORT_SCAN',
      vulnerability: `${openPorts.length} dangerous port(s) exposed externally`,
      location: host,
      severity: 'CRITICAL',
      evidence: `Open ports: ${openPorts.join(', ')}`,
      timestamp: Date.now(),
    }
  }

  return {
    success: false,
    attackType: 'PORT_SCAN',
    vulnerability: 'No dangerous open ports found',
    location: host,
    severity: 'LOW',
    timestamp: Date.now(),
  }
}

export const portScannerSkill = {
  name: 'port_scanner',
  description:
    'Scans a target host for dangerous open ports (database ports, Telnet, FTP). Returns any externally exposed services that should not be public.',
  input_schema: {
    type: 'object' as const,
    properties: {
      targetUrl: { type: 'string', description: 'The URL of the target to scan' },
    },
    required: ['targetUrl'],
  },
  execute: async ({ targetUrl }: { targetUrl: string }) => portScanAttack(targetUrl),
}
