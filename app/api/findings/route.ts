import { NextResponse } from "next/server";
import { listFindings, upsertFinding } from "@agent/store";
import { Finding } from "@shared/types";

export async function GET() {
  return NextResponse.json({ findings: listFindings() });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = Finding.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  upsertFinding(parsed.data);
  return NextResponse.json({ finding: parsed.data }, { status: 201 });
}
