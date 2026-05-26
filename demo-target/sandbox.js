// ⚠️  DELIBERATELY VULNERABLE — DEMO ONLY. Never deploy this.
// CryptoSandbox: simulates a crypto trading platform with 6 planted vulnerabilities.
// Each vulnerability is found by exactly one ShieldClaw specialist agent.

const express = require("express");
const app = express();
app.use(express.json());

// ── VULNERABILITY 1: SQL Injection ────────────────────────────────────────────
// Found by: SQLInjectionAgent
// Simulates: unsanitized string concat in login query
app.post("/api/login", (req, res) => {
  const { username } = req.body ?? {};
  if (
    username &&
    (username.includes("'") ||
      username.toLowerCase().includes(" or ") ||
      username.toLowerCase().includes("--") ||
      username.toLowerCase().includes("union"))
  ) {
    return res.json({
      success: true,
      message: "Welcome admin",
      role: "administrator",
      wallets: ["0xAbc...111", "0xDef...222"],
      data: "LEAKED: users table — alice@corp.com, bob@corp.com, carol@corp.com",
    });
  }
  res.status(401).json({ success: false, message: "Invalid credentials" });
});

// ── VULNERABILITY 2: Exposed API Keys ─────────────────────────────────────────
// Found by: APIKeyAgent
// Simulates: config endpoint returning live API secrets
app.get("/api/config", (req, res) => {
  res.json({
    ALCHEMY_API_KEY: "alch_live_aBcDeFgHiJkLmNoP",
    COINGECKO_API_KEY: "CG-xK9mP2nQrStUvWx",
    INFURA_PROJECT_ID: "3f8a2b1c0d4e5f6a",
    PRIVATE_RPC_URL: "https://eth-mainnet.g.alchemy.com/v2/alch_live_aBcDeFgHiJkLmNoP",
    DATABASE_URL: "postgres://admin:hunter2@db.internal:5432/crypto_prod",
  });
});

// ── VULNERABILITY 3: Wallet Authorization Bypass ──────────────────────────────
// Found by: WalletAuthAgent
// Simulates: IDOR — any wallet ID returns balance without auth check
app.get("/api/wallet/:id", (req, res) => {
  // BAD: no authentication check — any caller can read any wallet
  res.json({
    walletId: req.params.id,
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    balanceUsdc: "847293.50",
    balanceBtc: "12.4891",
    transactions: [
      { id: "tx_001", amount: "50000.00", to: "0xAttacker...", timestamp: 1716750000 },
    ],
    privateNote: "EXPOSED: this endpoint has no auth — any caller can read any wallet",
  });
});

// ── VULNERABILITY 4: Exposed Credentials ─────────────────────────────────────
// Found by: CredentialAgent
app.get("/.env", (req, res) => {
  res.type("text/plain").send(
    [
      "DATABASE_URL=postgres://admin:hunter2@db.internal:5432/crypto_prod",
      "JWT_SECRET=super-secret-jwt-key-do-not-share",
      "WALLET_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      "STRIPE_SECRET_KEY=sk_live_51MxYzA2eZvKYlo2C...",
      "ALCHEMY_API_KEY=alch_live_aBcDeFgHiJkLmNoP",
    ].join("\n")
  );
});

// ── VULNERABILITY 5: Exposed User List ───────────────────────────────────────
// Found by: CredentialAgent (secondary check) / UserEnumAgent
app.get("/api/users", (req, res) => {
  res.json({
    warning: "EXPOSED: full user list accessible without authentication",
    users: [
      { id: 1, email: "alice@corp.com", role: "admin", walletAddress: "0xAlice..." },
      { id: 2, email: "bob@corp.com", role: "trader", walletAddress: "0xBob..." },
      { id: 3, email: "carol@corp.com", role: "trader", walletAddress: "0xCarol..." },
    ],
  });
});

// ── VULNERABILITY 6: Exposed Agent Config ─────────────────────────────────────
// Found by: APIKeyAgent (secondary check)
app.get("/api/agent-config", (req, res) => {
  res.json({
    agentPrivateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    agentWallet: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    x402MerchantId: "merch_live_abc123",
    x402ApiKey: "x402_live_secret_key",
    registryAddress: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    note: "EXPOSED: agent credentials — attacker can impersonate this agent on-chain",
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "running", note: "CryptoSandbox — deliberately vulnerable demo target" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`⚠️  CryptoSandbox running on http://localhost:${PORT}`);
  console.log("⚠️  FOR DEMO PURPOSES ONLY — never deploy this");
  console.log("");
  console.log("Vulnerabilities planted:");
  console.log("  POST /api/login        → SQL injection");
  console.log("  GET  /api/config       → Exposed API keys");
  console.log("  GET  /api/wallet/:id   → Wallet auth bypass (IDOR)");
  console.log("  GET  /.env             → Exposed credentials");
  console.log("  GET  /api/users        → Exposed user list");
  console.log("  GET  /api/agent-config → Exposed agent credentials");
});
