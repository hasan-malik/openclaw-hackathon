/**
 * ShieldClaw Orchestrator
 *
 * Receives a scan target, dispatches all 6 specialist agents in parallel,
 * compiles a master report, triggers x402 payment, and notifies Telegram.
 *
 * Flow:
 *   /scan [target] → orchestrator → 6 specialists simultaneously
 *                 → per-finding Telegram alerts (from skill-adapter → notify)
 *                 → master report to Telegram
 *                 → x402 payment for total findings
 */

import { ALL_SPECIALISTS } from "./specialists/agents";
import type { SpecialistResult } from "./specialists/base";
import { triggerPayment, hasX402Configured } from "@onchain/x402";
import { listFindings } from "./store";
import { pricingForSeverity } from "./scanner";

const MASTER_AGENT_ID = process.env.AGENT_ID || "shieldclaw-orchestrator-001";
const RECEIVING_WALLET = (process.env.GOATX402_RECEIVING_WALLET ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
const PAYER_WALLET = (process.env.AGENT_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;

async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  }).catch(() => {});
}

function severityIcon(s: string) {
  return ({ critical: "🚨", high: "🔴", medium: "🟠", low: "🟡", info: "ℹ️" } as Record<string, string>)[s] ?? "⚪";
}

export async function runOrchestratedScan(targetUrl: string): Promise<void> {
  const scanStart = Date.now();

  await sendTelegram(
    `🛡️ *ShieldClaw Network ACTIVATED*\n` +
    `🎯 Target: \`${targetUrl}\`\n` +
    `🤖 Orchestrator: \`${MASTER_AGENT_ID}\`\n` +
    `⚡ Dispatching 6 specialist agents simultaneously…`
  );

  console.log(`[orchestrator] dispatching ${ALL_SPECIALISTS.length} specialists against ${targetUrl}`);

  // ── Dispatch all specialists in parallel ────────────────────────────────────
  // Each specialist:
  //   1. Checks its own ERC-8004 authorization (scope grant)
  //   2. Runs its single attack skill
  //   3. If vulnerable: stores Finding + fires Telegram alert (via skill-adapter → notify)
  const results: SpecialistResult[] = await Promise.all(
    ALL_SPECIALISTS.map((agent) => agent.run(targetUrl))
  );

  // ── Compile results ─────────────────────────────────────────────────────────
  const authorized = results.filter((r) => r.authorized);
  const found = results.filter((r) => r.vulnerable && r.findingId);
  const refused = results.filter((r) => !r.authorized);

  const duration = Math.round((Date.now() - scanStart) / 1000);

  // ── x402 payment for total findings ─────────────────────────────────────────
  let paymentId: string | null = null;
  let totalUsdc = "0.00";

  if (found.length > 0) {
    // Sum per-finding prices (each specialist already stored the Finding with billing)
    const storedFindings = listFindings();
    const ourFindings = storedFindings.filter((f) =>
      found.some((r) => r.findingId === f.findingId)
    );
    totalUsdc = ourFindings
      .reduce((sum, f) => sum + parseFloat(f.billing.amountUsdc), 0)
      .toFixed(2);

    if (hasX402Configured() && parseFloat(totalUsdc) > 0) {
      try {
        const payment = await triggerPayment({
          findingId: `batch-${scanStart}`,
          amountUsdc: totalUsdc,
          payerWallet: PAYER_WALLET,
          receivingWallet: RECEIVING_WALLET,
          description: `ShieldClaw scan: ${found.length} vulnerabilities found in ${targetUrl}`
        });
        paymentId = payment.paymentId;
      } catch (err) {
        console.error("[orchestrator] x402 payment failed:", err);
      }
    }
  }

  // ── Master report to Telegram ─────────────────────────────────────────────
  const findingLines = found.map((r, i) =>
    `${i + 1}. ${severityIcon(r.severity ?? "info")} *${r.agentName}*\n` +
    `   ${r.title ?? r.skillName} — ${(r.severity ?? "").toUpperCase()}\n` +
    `   ID: \`${r.findingId?.slice(0, 16)}…\``
  );

  const refusalLines = refused.map((r) =>
    `⛔ ${r.agentName}: refused (no scope grant)`
  );

  const report = [
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🛡️ *SHIELDCLAW MASTER REPORT*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🎯 Target: \`${targetUrl}\``,
    `⏱️ Duration: ${duration}s`,
    `🤖 Agents dispatched: ${ALL_SPECIALISTS.length}`,
    ``,
    `🔴 *VULNERABILITIES FOUND: ${found.length}*`,
    ...(findingLines.length > 0 ? findingLines : ["  None"]),
    ``,
    ...(refused.length > 0 ? [`⛔ *Refused (no scope grant): ${refused.length}*`, ...refusalLines, ``] : []),
    found.length > 0
      ? `💰 *CHARGED: ${totalUsdc} USDC via x402*${paymentId ? `\n   Payment: \`${paymentId}\`` : ""}`
      : `💰 No charge — no vulnerabilities found.`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  ].join("\n");

  await sendTelegram(report);
  console.log(`[orchestrator] scan complete — ${found.length} findings, ${totalUsdc} USDC`);
}
