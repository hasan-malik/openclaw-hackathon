// ⚠️  DELIBERATELY VULNERABLE — DEMO ONLY. Never deploy this.
// Simulates a company's web server with planted vulnerabilities for the ShieldClaw demo.

const express = require('express')
const app = express()
app.use(express.json())

// VULNERABILITY 1: SQL Injection at /api/login
// Simulates unsanitized string concatenation in a query.
// Real query would be: `SELECT * FROM users WHERE username='${username}'`
app.post('/api/login', (req, res) => {
  const { username } = req.body ?? {}

  if (
    username &&
    (username.includes("'") ||
      username.toLowerCase().includes(' or ') ||
      username.toLowerCase().includes('--') ||
      username.toLowerCase().includes('union'))
  ) {
    // Injection succeeded — simulate leaking the users table
    return res.json({
      success: true,
      message: 'Welcome admin',
      role: 'administrator',
      data: 'EXPOSED: users table — alice@corp.com, bob@corp.com, carol@corp.com',
    })
  }

  res.status(401).json({ success: false, message: 'Invalid credentials' })
})

// PATCHED version — injection no longer works (used by heal verification)
app.post('/api/login-secure', (req, res) => {
  res.status(401).json({ success: false, message: 'Invalid credentials' })
})

// VULNERABILITY 2: Exposed config endpoint (simulates leaked env/credentials)
app.get('/api/config', (req, res) => {
  return res.json({
    DB_PASSWORD: 'hunter2',
    API_KEY: 'sk-prod-abc123xyz',
    SECRET: 'do-not-share',
    DATABASE_URL: 'postgres://admin:hunter2@db.internal:5432/prod',
  })
})

// VULNERABILITY 3: Exposed .env simulation
app.get('/.env', (req, res) => {
  res.type('text/plain').send(
    'DB_PASSWORD=hunter2\nAPI_KEY=sk-prod-abc123xyz\nSECRET=do-not-share\n'
  )
})

app.get('/health', (req, res) => {
  res.json({ status: 'running', note: 'DEMO TARGET — deliberately vulnerable' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`⚠️  Vulnerable demo target running on http://localhost:${PORT}`)
  console.log('⚠️  FOR DEMO PURPOSES ONLY — never deploy this')
  console.log('')
  console.log('Test SQL injection:')
  console.log(`  curl -X POST http://localhost:${PORT}/api/login \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"username": "admin\\' OR \\'1\\'=\\'1", "password": "x"}'`)
})
