import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import {
  googleSignIn,
  SESSION_COOKIE,
  SESSION_SECONDS,
} from "@/lib/server/studio/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const mode = studioMode();
  const url = new URL(request.url);
  const origin =
    (process.env.APP_URL ? new URL(process.env.APP_URL).origin : null) ??
    `${
      request.headers.get("x-forwarded-proto") === "https"
        ? "https"
        : url.protocol.replace(":", "")
    }://${request.headers.get("host") ?? url.host}`;
  if (mode === "disabled")
    return NextResponse.redirect(
      new URL("/login?error=google-unavailable", origin),
    );
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const expectedState = request.cookies.get("google_state")?.value;
  const verifier = request.cookies.get("google_verifier")?.value;
  if (!state || !code || !expectedState || state !== expectedState || !verifier)
    return NextResponse.redirect(new URL("/login?error=google-state", origin));
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
    return NextResponse.redirect(
      new URL("/login?error=google-unavailable", origin),
    );
  const redirectUri = new URL("/api/auth/google/callback", origin).toString();
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
    });
    if (!tokenResponse.ok)
      return NextResponse.redirect(
        new URL("/login?error=google-token", origin),
      );
    const tokens = (await tokenResponse.json()) as { access_token?: string };
    if (!tokens.access_token)
      return NextResponse.redirect(
        new URL("/login?error=google-token", origin),
      );
    const profileResponse = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    );
    if (!profileResponse.ok)
      return NextResponse.redirect(
        new URL("/login?error=google-profile", origin),
      );
    const profile = (await profileResponse.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
    };
    if (!profile.sub || !profile.email)
      return NextResponse.redirect(
        new URL("/login?error=google-profile", origin),
      );
    const { token } = await googleSignIn(await getStudioDb(), {
      providerAccountId: profile.sub,
      email: profile.email,
      fullName: profile.name ?? profile.email.split("@")[0],
      emailVerified: Boolean(profile.email_verified),
    });
    const response = NextResponse.redirect(new URL("/studio", origin));
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: origin.startsWith("https:"),
      path: "/",
      maxAge: SESSION_SECONDS,
    });
    response.cookies.set("google_state", "", { path: "/", maxAge: 0 });
    response.cookies.set("google_verifier", "", { path: "/", maxAge: 0 });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/login?error=google-failed", origin));
  }
}
