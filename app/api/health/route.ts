import { NextResponse } from "next/server";

/** Public liveness probe — no DB, no auth (for load balancers / Railway). */
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
