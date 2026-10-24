import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import {
  DERIV_SESSION_COOKIE,
  allowedCorsOrigin,
  corsHeaders,
  requestOtp,
} from "@/lib/server/deriv";
import { readJson } from "@/lib/server/studio/http";
import { rateLimit } from "@/lib/server/studio/auth";
import { StudioError } from "@/lib/server/studio/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const headers = {
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex",
    ...corsHeaders(request),
  };
  try {
    if (!allowedCorsOrigin(request))
      throw new StudioError(403, "Origin is not allowed.", "INVALID_ORIGIN");
    if (studioMode() === "disabled")
      throw new StudioError(503, "Deriv is not configured.");
    const token = request.cookies.get(DERIV_SESSION_COOKIE)?.value;
    if (!token)
      throw new StudioError(
        401,
        "Sign in with Deriv first.",
        "UNAUTHENTICATED",
      );
    const body = await readJson(request);
    const input =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const db = await getStudioDb();
    const row = await (
      await import("@/lib/server/deriv")
    ).traderSession(db, token);
    if (!row)
      throw new StudioError(
        401,
        "Sign in with Deriv first.",
        "UNAUTHENTICATED",
      );
    if (input.sessionId && String(input.sessionId) !== row.id)
      throw new StudioError(401, "Invalid Deriv session.", "UNAUTHENTICATED");
    await rateLimit(db, `deriv-otp:${row.id}`, 20, 60);
    return NextResponse.json(await requestOtp(db, token, row.id), { headers });
  } catch (error) {
    if (error instanceof StudioError)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status, headers },
      );
    console.error("Deriv OTP unavailable; details omitted.");
    return NextResponse.json(
      { error: "Deriv session could not be opened." },
      { status: 503, headers },
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}
