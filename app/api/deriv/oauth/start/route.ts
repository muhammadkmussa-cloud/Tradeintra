import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import { StudioError } from "@/lib/server/studio/types";
import {
  DERIV_OAUTH_COOKIE,
  beginOAuth,
  oauthCookieSettings,
  requestOrigin,
} from "@/lib/server/deriv";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    if (studioMode() === "disabled")
      throw new StudioError(503, "Deriv login is not configured.");
    const site = request.nextUrl.searchParams.get("site") ?? "";
    const url = await beginOAuth(
      await getStudioDb(),
      site,
      requestOrigin(request),
    );
    const state = new URL(url).searchParams.get("state") ?? "";
    const response = NextResponse.redirect(url);
    response.cookies.set({
      ...oauthCookieSettings(request, requestOrigin(request)),
      name: DERIV_OAUTH_COOKIE,
      value: state,
    });
    return response;
  } catch (error) {
    if (error instanceof StudioError)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    console.error("Deriv OAuth start unavailable; details omitted.");
    return NextResponse.json(
      { error: "Deriv login is unavailable." },
      { status: 503 },
    );
  }
}
