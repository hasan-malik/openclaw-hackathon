import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import type Anthropic from "@anthropic-ai/sdk";
import { runChatTurn } from "./llm/loop";
import { runOrchestratedScan } from "./orchestrator";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("[bot] TELEGRAM_BOT_TOKEN missing in .env");
  process.exit(1);
}

const DASHBOARD_URL = (process.env.DASHBOARD_URL || "http://localhost:3000").replace(/\/$/, "");
const EXPLORER = "https://explorer.goat.network";
const SCAN8004 = "https://8004scan.io/agents/35?chain=2345";

const bot = new TelegramBot(token, { polling: true });
const histories = new Map<number, Anthropic.MessageParam[]>();

const DEMO_TARGET = process.env.DEMO_TARGET_URL ?? "http://localhost:4000";

// Pulls finding IDs / tx hashes mentioned in a reply so we can attach
// matching inline buttons that deep-link into the dashboard + explorer.
function deepLinkButtons(text: string): { text: string; url: string }[] {
  const buttons: { text: string; url: string }[] = [];
  const findingId = text.match(/0x[a-fA-F0-9]{40,64}/g)?.find((h) => h.length >= 60);
  const txHash = text.match(/0x[a-fA-F0-9]{64}/g)?.find((h) => h !== findingId);
  const orderId = text.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/)?.[0];

  if (findingId) buttons.push({ text: "📊 View Report", url: `${DASHBOARD_URL}/findings/${findingId}` });
  if (txHash) buttons.push({ text: "🔗 GOAT Explorer", url: `${EXPLORER}/tx/${txHash}` });
  if (orderId) buttons.push({ text: "💳 x402 Order", url: `https://x402-merchant.goat.network/orders/${orderId}` });

  if (buttons.length === 0) {
    buttons.push({ text: "📊 Dashboard", url: DASHBOARD_URL });
    buttons.push({ text: "🆔 Agent #35", url: SCAN8004 });
  }
  return buttons;
}

const WELCOME =
  "I'm *ShieldClaw* — an autonomous security auditing agent on GOAT Network mainnet (Agent ID #35).\n\n" +
  "I scan customer-authorised targets, hash findings on-chain, and bill per verified finding via x402.\n\n" +
  "Try:\n" +
  "• `What do you do?`\n" +
  "• `Show me the latest findings`\n" +
  "• `Authorise a scan of juice-shop.demo.local for 24 hours`\n" +
  "• `Scan example.com` _(I'll refuse — it's not in scope)_\n\n" +
  `Commands: /start /reset /id /scan [url]\n` +
  `Demo: /scan ${DEMO_TARGET}`;

async function sendSafe(chatId: number, text: string, opts?: TelegramBot.SendMessageOptions) {
  try {
    return await bot.sendMessage(chatId, text, opts);
  } catch (err) {
    // Markdown parse failures fall back to plain text.
    return bot.sendMessage(chatId, text);
  }
}

function chunk(text: string, n = 3800): string[] {
  if (text.length <= n) return [text];
  const out: string[] = [];
  for (let i = 0; i < text.length; i += n) out.push(text.slice(i, i + n));
  return out;
}

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  if (text === "/start") {
    histories.set(chatId, []);
    await sendSafe(chatId, WELCOME, { parse_mode: "Markdown" });
    return;
  }
  if (text === "/reset") {
    histories.set(chatId, []);
    await sendSafe(chatId, "Cleared. Fresh conversation.");
    return;
  }
  if (text === "/id") {
    await sendSafe(
      chatId,
      `chat_id: \`${chatId}\`\nuser: \`${msg.from?.username ?? msg.from?.first_name ?? "?"}\``,
      { parse_mode: "Markdown" }
    );
    return;
  }

  // /scan [optional-url] — dispatch all 6 specialist agents via orchestrator
  if (text.startsWith("/scan")) {
    const parts = text.split(/\s+/);
    const targetUrl = parts[1] ?? DEMO_TARGET;
    await sendSafe(chatId, `🔴 Dispatching 6 specialist agents against \`${targetUrl}\`…`, { parse_mode: "Markdown" });
    runOrchestratedScan(targetUrl).catch((err) => {
      sendSafe(chatId, `⚠️ Orchestrator error: ${(err as Error).message}`);
    });
    return;
  }

  const history = histories.get(chatId) ?? [];

  await bot.sendChatAction(chatId, "typing").catch(() => {});
  const typingTimer = setInterval(() => {
    bot.sendChatAction(chatId, "typing").catch(() => {});
  }, 4500);

  try {
    const result = await runChatTurn(text, history);
    histories.set(chatId, result.history);

    if (result.traces.length > 0) {
      const tracesText = result.traces
        .map((t) => {
          const argStr = JSON.stringify(t.input);
          const short = argStr.length > 80 ? argStr.slice(0, 77) + "..." : argStr;
          return `🔧 \`${t.name}\` ${short}`;
        })
        .join("\n");
      await sendSafe(chatId, tracesText, { parse_mode: "Markdown" });
    }

    const reply = result.reply || "_(no reply)_";
    const pieces = chunk(reply);
    for (let i = 0; i < pieces.length; i++) {
      const isLast = i === pieces.length - 1;
      const opts: TelegramBot.SendMessageOptions = { parse_mode: "Markdown" };
      if (isLast) {
        // Attach deep-link buttons to the final chunk only
        const buttons = deepLinkButtons(reply);
        if (buttons.length > 0) {
          opts.reply_markup = {
            inline_keyboard: [buttons.slice(0, 3).map((b) => ({ text: b.text, url: b.url }))]
          };
        }
      }
      await sendSafe(chatId, pieces[i], opts);
    }
  } catch (err) {
    await sendSafe(chatId, `⚠️ ${(err as Error).message ?? "unknown error"}`);
  } finally {
    clearInterval(typingTimer);
  }
});

bot.on("polling_error", (err) => {
  console.error("[bot] polling error:", (err as Error).message);
});

console.log("[bot] ShieldClaw Telegram bot started. Long-polling for messages...");
console.log(`[bot] Open https://t.me/shieldclaw_agent_bot and send any message.`);
