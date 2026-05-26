import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./persona";
import { TOOL_SCHEMAS, callTool } from "./tools";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string | Anthropic.ContentBlock[] | Anthropic.MessageParam["content"];
};

export type ToolTrace = {
  name: string;
  input: unknown;
  output: string;
};

export type ChatTurnResult = {
  reply: string;
  traces: ToolTrace[];
  history: Anthropic.MessageParam[];
  stopReason: string | null;
};

const MAX_TOOL_ITERATIONS = 8;

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set in .env");
  return new Anthropic({ apiKey });
}

export async function runChatTurn(
  userMessage: string,
  history: Anthropic.MessageParam[] = []
): Promise<ChatTurnResult> {
  const client = getClient();
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

  const messages: Anthropic.MessageParam[] = [
    ...history,
    { role: "user", content: userMessage }
  ];

  const traces: ToolTrace[] = [];
  let stopReason: string | null = null;

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: TOOL_SCHEMAS,
      messages
    });

    stopReason = response.stop_reason;

    if (response.stop_reason !== "tool_use") {
      messages.push({ role: "assistant", content: response.content });
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return { reply: text, traces, history: messages, stopReason };
    }

    // Tool use — append assistant block, run tools, append tool_result block as user.
    messages.push({ role: "assistant", content: response.content });

    const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const output = await callTool(block.name, block.input);
      traces.push({ name: block.name, input: block.input, output });
      toolResultBlocks.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: output
      });
    }

    messages.push({ role: "user", content: toolResultBlocks });
  }

  return {
    reply: "Hit max tool iterations without a final answer. Try rephrasing or asking a narrower question.",
    traces,
    history: messages,
    stopReason
  };
}
