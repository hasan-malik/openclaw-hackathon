import https from 'https'
import type { AttackResult } from '../types.js'

interface CertInfo {
  validTo: Date | null
  selfSigned: boolean
  hostnameMismatch: boolean
}

function checkCert(targetUrl: string): Promise<CertInfo> {
  return new Promise((resolve) => {
    const url = new URL(targetUrl)
    const req = https.request(
      { host: url.hostname, port: url.port || 443, method: 'HEAD', rejectUnauthorized: false },
      (res) => {
        const cert = (res.socket as import('tls').TLSSocket).getPeerCertificate()
        if (!cert || !cert.valid_to) {
          resolve({ validTo: null, selfSigned: false, hostnameMismatch: false })
          return
        }
        const validTo = new Date(cert.valid_to)
        const selfSigned = cert.issuer?.CN === cert.subject?.CN
        const hostnameMismatch =
          cert.subject?.CN !== url.hostname &&
          !cert.subjectaltname?.includes(url.hostname)

        resolve({ validTo, selfSigned, hostnameMismatch })
      }
    )
    req.on('error', () => resolve({ validTo: null, selfSigned: false, hostnameMismatch: false }))
    req.setTimeout(5000, () => { req.destroy(); resolve({ validTo: null, selfSigned: false, hostnameMismatch: false }) })
    req.end()
  })
}

export async function sslCheckAttack(targetUrl: string): Promise<AttackResult> {
  // Only meaningful for HTTPS targets
  if (!targetUrl.startsWith('https://')) {
    return {
      success: true,
      attackType: 'SSL_CHECK',
      vulnerability: 'No HTTPS — all traffic transmitted in plaintext',
      location: targetUrl,
      severity: 'HIGH',
      evidence: 'Target is HTTP only. Credentials and session tokens are exposed.',
      timestamp: Date.now(),
    }
  }

  const { validTo, selfSigned, hostnameMismatch } = await checkCert(targetUrl)
  const findings: string[] = []

  if (validTo === null) {
    findings.push('Certificate could not be retrieved')
  } else {
    const daysLeft = Math.floor((validTo.getTime() - Date.now()) / 86_400_000)
    if (daysLeft < 0) findings.push(`Certificate EXPIRED ${Math.abs(daysLeft)} days ago`)
    else if (daysLeft < 30) findings.push(`Certificate expires in ${daysLeft} days`)
  }

  if (selfSigned) findings.push('Self-signed certificate — not trusted by browsers')
  if (hostnameMismatch) findings.push('Certificate hostname mismatch')

  if (findings.length > 0) {
    return {
      success: true,
      attackType: 'SSL_CHECK',
      vulnerability: 'SSL/TLS misconfiguration',
      location: targetUrl,
      severity: hostnameMismatch || (validTo && validTo < new Date()) ? 'CRITICAL' : 'HIGH',
      evidence: findings.join('; '),
      timestamp: Date.now(),
    }
  }

  return {
    success: false,
    attackType: 'SSL_CHECK',
    vulnerability: 'No SSL/TLS issues found',
    location: targetUrl,
    severity: 'LOW',
    timestamp: Date.now(),
  }
}

export const sslCheckerSkill = {
  name: 'ssl_checker',
  description:
    'Checks a target URL for SSL/TLS vulnerabilities: expired certificates, self-signed certs, HTTP-only endpoints.',
  input_schema: {
    type: 'object' as const,
    properties: {
      targetUrl: { type: 'string', description: 'The URL to check SSL/TLS for' },
    },
    required: ['targetUrl'],
  },
  execute: async ({ targetUrl }: { targetUrl: string }) => sslCheckAttack(targetUrl),
}
