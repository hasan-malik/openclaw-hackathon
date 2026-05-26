import type { AttackResult } from '../types.js'

const EXPOSED_PATHS = ['/.env', '/api/config', '/api/settings', '/config.json', '/.git/config']
const CREDENTIAL_KEYWORDS = ['password', 'secret', 'key', 'token', 'credential', 'database', 'DB_']

export async function credentialExposureAttack(targetUrl: string): Promise<AttackResult> {
  const exposed: string[] = []

  for (const path of EXPOSED_PATHS) {
    try {
      const res = await fetch(`${targetUrl}${path}`, {
        signal: AbortSignal.timeout(4000),
      })

      if (!res.ok) continue

      const body = await res.text()
      const hasCredential = CREDENTIAL_KEYWORDS.some((kw) =>
        body.toLowerCase().includes(kw.toLowerCase())
      )

      if (hasCredential) {
        exposed.push(`${path} — contains credential data (${body.slice(0, 80)}...)`)
      }
    } catch {
      continue
    }
  }

  if (exposed.length > 0) {
    return {
      success: true,
      attackType: 'CREDENTIAL_EXPOSURE',
      vulnerability: `${exposed.length} endpoint(s) expose credentials publicly`,
      location: targetUrl,
      severity: 'CRITICAL',
      evidence: exposed.join(' | '),
      timestamp: Date.now(),
    }
  }

  return {
    success: false,
    attackType: 'CREDENTIAL_EXPOSURE',
    vulnerability: 'No exposed credentials found',
    location: targetUrl,
    severity: 'LOW',
    timestamp: Date.now(),
  }
}

export const credentialExposureSkill = {
  name: 'credential_exposure',
  description:
    'Checks if a target exposes credentials or secrets at common paths: /.env, /api/config, /config.json, /.git/config.',
  input_schema: {
    type: 'object' as const,
    properties: {
      targetUrl: { type: 'string', description: 'The base URL to check' },
    },
    required: ['targetUrl'],
  },
  execute: async ({ targetUrl }: { targetUrl: string }) => credentialExposureAttack(targetUrl),
}
