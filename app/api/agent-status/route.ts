import { NextResponse } from "next/server";
import { getAgentStatus } from "@/lib/agent-status";

export async function GET() {
  return NextResponse.json(await getAgentStatus());
}
