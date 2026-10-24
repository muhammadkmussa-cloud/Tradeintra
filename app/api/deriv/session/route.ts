import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import {
  DERIV_SESSION_COOKIE,
  corsHeaders,
  publicTraderSession,
  traderSession,
} from "@/lib/server/deriv";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const headers = {
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex",
    ...corsHeaders(request),
  };
  if (studioMode() === "disabled")
    return NextResponse.json({ authenticated: false }, { headers });
  try {
    const row = await traderSession(
      await getStudioDb(),
      request.cookies.get(DERIV_SESSION_COOKIE)?.value,
    );
    return NextResponse.json(publicTraderSession(row), { headers });
  } catch {
    return NextResponse.json({ authenticated: false }, { headers });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}
