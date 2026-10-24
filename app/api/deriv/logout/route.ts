import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import {
  DERIV_OAUTH_COOKIE,
  DERIV_SESSION_COOKIE,
  allowedCorsOrigin,
  cookieSettings,
  corsHeaders,
  oauthCookieSettings,
  requestOrigin,
  revokeTraderSession,
  traderSession,
} from "@/lib/server/deriv";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const headers = {
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex",
    ...corsHeaders(request),
  };
  if (!allowedCorsOrigin(request))
    return NextResponse.json(
      { error: "Origin is not allowed." },
      { status: 403, headers },
    );
  try {
    if (studioMode() !== "disabled") {
      const db = await getStudioDb();
      const token = request.cookies.get(DERIV_SESSION_COOKIE)?.value;
      const row = await traderSession(db, token);
      if (row) await revokeTraderSession(db, row.id);
    }
  } catch {
    console.error("Deriv logout unavailable; details omitted.");
  }
  const response = NextResponse.json({ ok: true }, { headers });
  response.cookies.set({
    ...cookieSettings(request, requestOrigin(request)),
    name: DERIV_SESSION_COOKIE,
    value: "",
    maxAge: 0,
  });
  response.cookies.set({
    ...oauthCookieSettings(request, requestOrigin(request)),
    name: DERIV_OAUTH_COOKIE,
    value: "",
    maxAge: 0,
  });
  return response;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}
