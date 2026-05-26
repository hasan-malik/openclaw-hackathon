import type { Finding } from "@shared/types";
import { explorerTx } from "@onchain/client";

function severityIcon(severity: Finding["severity"]) {
  return (
    {
      critical: "🚨",
      high: "🔴",
      medium: "🟠",
      low: "🟡",
      info: "ℹ️"
    } as const
  )[severity];
}

function formatFinding(f: Finding): string {
  const lines = [
    `${severityIcon(f.severity)} *${f.severity.toUpperCase()}* — ${f.title}`,
    `Target: \`${f.target.value}\``,
    f.cve ? `CVE: \`${f.cve}\`` : null,
    `Category: ${f.category}`,
    "",
    f.description,
    "",
    `Remediation: ${f.remediation}`,
    "",
    `Finding ID: \`${f.findingId.slice(0, 18)}…\``,
    `Billable: ${f.billing.amountUsdc} USDC`,
    f.billing.x402PaymentId ? `Payment: ${f.billing.x402PaymentId}` : null
  ].filter(Boolean);
  return lines.join("\n");
}

export async function notifyTelegram(finding: Finding) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { ok: false, reason: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing" };

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: formatFinding(finding),
      parse_mode: "Markdown"
    })
  });

  return { ok: res.ok };
}

export async function notifySlack(finding: Finding) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return { ok: false, reason: "SLACK_WEBHOOK_URL missing" };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: formatFinding(finding) })
  });

  return { ok: res.ok };
}

export async function notify(finding: Finding) {
  const results = await Promise.allSettled([notifyTelegram(finding), notifySlack(finding)]);
  return results.map((r) => (r.status === "fulfilled" ? r.value : { ok: false, reason: String(r.reason) }));
}

export function explorerLinkForPayment(txHash: string | null) {
  return txHash ? explorerTx(txHash) : null;
}
