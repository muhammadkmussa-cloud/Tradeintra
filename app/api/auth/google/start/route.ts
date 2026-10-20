import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import {
  googleMockSignIn,
  SESSION_COOKIE,
  SESSION_SECONDS,
} from "@/lib/server/studio/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const mode = studioMode();
  if (mode === "disabled")
    return NextResponse.json(
      { error: "Google sign-in is not configured in this runtime." },
      { status: 503 },
    );
  const url = new URL(request.url);
  const origin =
    (process.env.APP_URL ? new URL(process.env.APP_URL).origin : null) ??
    `${
      request.headers.get("x-forwarded-proto") === "https"
        ? "https"
        : url.protocol.replace(":", "")
    }://${request.headers.get("host") ?? url.host}`;
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    if (mode !== "local")
      return NextResponse.json(
        { error: "Google OAuth credentials are not configured." },
        { status: 503 },
      );
    const { token } = await googleMockSignIn(await getStudioDb());
    const response = NextResponse.redirect(new URL("/studio", origin));
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: SESSION_SECONDS,
    });
    return response;
  }
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const redirectUri = new URL(
    "/api/auth/google/callback",
    url.origin,
  ).toString();
  const authorization = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorization.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
  authorization.searchParams.set("redirect_uri", redirectUri);
  authorization.searchParams.set("response_type", "code");
  authorization.searchParams.set("scope", "openid email profile");
  authorization.searchParams.set("state", state);
  authorization.searchParams.set("code_challenge", challenge);
  authorization.searchParams.set("code_challenge_method", "S256");
  authorization.searchParams.set("prompt", "select_account");
  const response = NextResponse.redirect(authorization);
  response.cookies.set("google_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https:"),
    path: "/",
    maxAge: 600,
  });
  response.cookies.set("google_verifier", verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https:"),
    path: "/",
    maxAge: 600,
  });
  return response;
}
