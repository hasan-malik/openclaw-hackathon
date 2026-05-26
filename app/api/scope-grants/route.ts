import { NextResponse } from "next/server";
import { listGrants, upsertGrant } from "@agent/store";
import { ScopeGrant } from "@shared/types";

export async function GET() {
  return NextResponse.json({ grants: listGrants() });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = ScopeGrant.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  upsertGrant(parsed.data);
  return NextResponse.json({ grant: parsed.data }, { status: 201 });
}
