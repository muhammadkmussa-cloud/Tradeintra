import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import {
  DERIV_OAUTH_COOKIE,
  DERIV_SESSION_COOKIE,
  completeOAuth,
  cookieSettings,
  oauthCookieSettings,
  requestOrigin,
  traderAppBase,
} from "@/lib/server/deriv";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const oauthCookie = request.cookies.get(DERIV_OAUTH_COOKIE)?.value ?? "";
  const origin = requestOrigin(request);
  const base = traderAppBase(origin);
  try {
    if (
      studioMode() === "disabled" ||
      !code ||
      !state ||
      !oauthCookie ||
      oauthCookie !== state
    )
      throw new Error("Invalid callback.");
    const result = await completeOAuth(await getStudioDb(), code, state);
    const response = NextResponse.redirect(
      `${base}${result.returnPath.startsWith("/trade") ? result.returnPath : `/trade?site=${encodeURIComponent(result.site)}`}`,
    );
    response.cookies.set({
      ...cookieSettings(request, origin),
      value: result.sessionToken,
    });
    response.cookies.set({
      ...oauthCookieSettings(request, origin),
      name: DERIV_OAUTH_COOKIE,
      value: "",
      maxAge: 0,
    });
    return response;
  } catch {
    return NextResponse.redirect(`${base}/trade?error=deriv-login`);
  }
}
