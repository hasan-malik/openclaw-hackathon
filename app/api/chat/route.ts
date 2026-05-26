import { NextResponse } from "next/server";
import { runChatTurn } from "@agent/llm/loop";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message: string = body.message;
    const history = body.history ?? [];
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }
    const result = await runChatTurn(message, history);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "chat failed" },
      { status: 500 }
    );
  }
}
