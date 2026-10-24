import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { serviceScope } from "./studio/database";
import type { StudioDb } from "./studio/types";
import { StudioError } from "./studio/types";
import { decryptSecret, encryptSecret } from "./secrets";
import { digest } from "./studio/auth";
import { publishedConfig } from "./studio/service";

export const DERIV_SESSION_COOKIE = "tradeintra_deriv_session";
export const DERIV_OAUTH_COOKIE = "tradeintra_deriv_oauth";
export const DERIV_SESSION_SECONDS = 60 * 60;
const STATE_SECONDS = 10 * 60;

export type DerivMode = "mock" | "demo" | "real";

export function derivMode(): DerivMode {
  const mode = (process.env.DERIV_MODE ?? "mock").toLowerCase();
  if (mode === "live") return "real";
  return mode === "demo" || mode === "real" ? mode : "mock";
}

export function derivConfigured() {
  return Boolean(
    process.env.DERIV_CLIENT_ID &&
    process.env.DERIV_REDIRECT_URI &&
    process.env.DERIV_API_BASE,
  );
}

export function assertDerivStartAllowed() {
  if (derivMode() !== "mock" && process.env.FEATURE_LIVE_DERIV !== "true")
    throw new StudioError(
      503,
      "Live Deriv access is not enabled on this deployment.",
      "DERIV_DISABLED",
    );
}

export function requestOrigin(request: NextRequest) {
  const configured = process.env.APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  const proto =
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(":", "");
  const host = (request.headers.get("host") ?? request.nextUrl.host).replace(
    /^0\.0\.0\.0(?::(\d+))?$/,
    (_, port) => `localhost${port ? `:${port}` : ""}`,
  );
  return `${proto}://${host}`;
}

export function traderAppBase(origin: string) {
  const configured = process.env.TRADER_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  return origin.includes("localhost") || origin.includes("127.0.0.1")
    ? origin
    : "https://trade.tradeintra.com";
}

export function apiOrigin(origin: string) {
  const configured = process.env.TRADER_API_URL;
  if (configured) return configured.replace(/\/$/, "");
  return origin.includes("localhost") || origin.includes("127.0.0.1")
    ? origin
    : "https://tradeintra.com";
}

export function allowedCorsOrigin(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  if (!origin) return false;
  const configured = new Set(
    [process.env.APP_URL, process.env.TRADER_APP_URL]
      .filter(Boolean)
      .map((value) => new URL(value!).origin),
  );
  return (
    origin === requestOrigin(request) ||
    origin === "https://trade.tradeintra.com" ||
    configured.has(origin) ||
    ((process.env.NODE_ENV === "development" ||
      process.env.STUDIO_DB_MODE === "local") &&
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
  );
}

export function corsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const allowed = allowedCorsOrigin(request);
  const headers: Record<string, string> = { Vary: "Origin" };
  if (allowed) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
    headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  }
  return headers;
}

export function oauthCookieSettings(
  request: NextRequest,
  origin = requestOrigin(request),
) {
  const { domain: _domain, ...settings } = cookieSettings(request, origin);
  return {
    ...settings,
    name: DERIV_OAUTH_COOKIE,
    maxAge: STATE_SECONDS,
  };
}

export function cookieSettings(
  request: NextRequest,
  origin = requestOrigin(request),
) {
  const configured = process.env.DERIV_COOKIE_DOMAIN;
  const host = request.nextUrl.hostname;
  const domain =
    configured ??
    (host === "tradeintra.com" || host.endsWith(".tradeintra.com")
      ? ".tradeintra.com"
      : undefined);
  return {
    name: DERIV_SESSION_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: origin.startsWith("https://"),
    path: "/",
    maxAge: DERIV_SESSION_SECONDS,
    ...(domain ? { domain } : {}),
  };
}

function base64url(value: Buffer) {
  return value.toString("base64url");
}

export async function beginOAuth(db: StudioDb, site: string, origin: string) {
  const config = await publishedConfig(db, site);
  if (!config)
    throw new StudioError(404, "Published site not found.", "SITE_NOT_FOUND");
  assertDerivStartAllowed();
  if (derivMode() !== "mock" && !derivConfigured())
    throw new StudioError(
      503,
      "Deriv OAuth is not configured.",
      "DERIV_DISABLED",
    );

  const state = base64url(randomBytes(32));
  const verifier = base64url(randomBytes(48));
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  const stateHash = digest(state);
  const returnPath = `/trade?${new URLSearchParams({
    site,
    name: config.name,
    accent: config.color.replace("#", ""),
    theme: config.theme ?? "dark",
    auth: "1",
  })}`;
  await serviceScope(db, (tx) =>
    tx
      .insertInto("deriv_oauth_states")
      .values({
        state_hash: stateHash,
        site,
        code_verifier: encryptSecret(verifier),
        return_path: returnPath,
        expires_at: new Date(Date.now() + STATE_SECONDS * 1000),
        used_at: null,
      })
      .execute(),
  );

  if (derivMode() === "mock")
    return `${origin}/api/deriv/oauth/callback?code=mock-${randomBytes(12).toString("hex")}&state=${encodeURIComponent(state)}`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.DERIV_CLIENT_ID!,
    redirect_uri: process.env.DERIV_REDIRECT_URI!,
    scope: "trade",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return `${process.env.DERIV_AUTH_URL ?? "https://auth.deriv.com/oauth2/auth"}?${params}`;
}

async function takeState(db: StudioDb, state: string) {
  return serviceScope(db, async (tx) => {
    const row = await tx
      .selectFrom("deriv_oauth_states")
      .selectAll()
      .where("state_hash", "=", digest(state))
      .where("used_at", "is", null)
      .where("expires_at", ">", new Date())
      .forUpdate()
      .executeTakeFirst();
    if (!row)
      throw new StudioError(
        400,
        "This login link is invalid or has expired.",
        "INVALID_OAUTH_STATE",
      );
    await tx
      .updateTable("deriv_oauth_states")
      .set({ used_at: new Date() })
      .where("state_hash", "=", row.state_hash)
      .execute();
    return row;
  });
}

async function exchangeCode(code: string, verifier: string) {
  const response = await fetch(
    process.env.DERIV_TOKEN_URL ?? "https://auth.deriv.com/oauth2/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.DERIV_CLIENT_ID!,
        code,
        code_verifier: verifier,
        redirect_uri: process.env.DERIV_REDIRECT_URI!,
      }),
    },
  );
  const body = (await response.json()) as Record<string, unknown>;
  if (!response.ok || typeof body.access_token !== "string")
    throw new StudioError(
      502,
      "Deriv sign-in could not be completed.",
      "DERIV_TOKEN_FAILED",
    );
  return body.access_token;
}

async function loadAccounts(token: string) {
  const response = await fetch(
    `${process.env.DERIV_API_BASE ?? "https://api.derivws.com"}/trading/v1/options/accounts`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Deriv-App-ID":
          process.env.DERIV_APP_ID ?? process.env.DERIV_CLIENT_ID ?? "",
      },
    },
  );
  if (!response.ok)
    throw new StudioError(
      502,
      "Deriv accounts could not be loaded.",
      "DERIV_ACCOUNTS_FAILED",
    );
  const body = (await response.json()) as {
    data?: {
      account_id?: string;
      loginid?: string;
      currency?: string;
      is_virtual?: boolean;
    }[];
  };
  return body.data ?? [];
}

export async function completeOAuth(db: StudioDb, code: string, state: string) {
  const stateRow = await takeState(db, state);
  const verifier = decryptSecret(stateRow.code_verifier);
  let accessToken = "mock-deriv-token";
  let email = "demo@deriv.mock";
  let accounts: {
    account_id?: string;
    loginid?: string;
    currency?: string;
    is_virtual?: boolean;
  }[] = [{ account_id: "MOCK-DEMO", loginid: "VRTC-MOCK", currency: "USD" }];
  let mode: DerivMode = "mock";
  if (derivMode() !== "mock") {
    assertDerivStartAllowed();
    accessToken = await exchangeCode(code, verifier);
    accounts = await loadAccounts(accessToken);
    mode = derivMode();
  }
  const account =
    mode === "demo"
      ? accounts.find((item) => item.is_virtual === true)
      : mode === "real"
        ? accounts.find((item) => item.is_virtual === false)
        : accounts[0];
  if (mode !== "mock" && !account)
    throw new StudioError(
      403,
      mode === "demo"
        ? "No Deriv demo account was found."
        : "No Deriv real account was found.",
      "DERIV_ACCOUNT_MISMATCH",
    );
  const sessionToken = base64url(randomBytes(32));
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + DERIV_SESSION_SECONDS * 1000);
  await serviceScope(db, (tx) =>
    tx
      .insertInto("deriv_trader_sessions")
      .values({
        id: sessionId,
        token_hash: digest(sessionToken),
        site: stateRow.site,
        mode,
        encrypted_token: mode === "mock" ? null : encryptSecret(accessToken),
        email: mode === "mock" ? email : null,
        account_id: account?.account_id ?? account?.loginid ?? null,
        account_login: account?.loginid ?? account?.account_id ?? null,
        account_currency: account?.currency ?? (mode === "mock" ? "USD" : null),
        expires_at: expiresAt,
        revoked_at: null,
      })
      .execute(),
  );
  return {
    sessionToken,
    site: stateRow.site,
    returnPath: stateRow.return_path,
  };
}

export async function traderSession(db: StudioDb, token: string | undefined) {
  if (!token) return null;
  return serviceScope(db, async (tx) => {
    const row = await tx
      .selectFrom("deriv_trader_sessions")
      .selectAll()
      .where("token_hash", "=", digest(token))
      .where("revoked_at", "is", null)
      .where("expires_at", ">", new Date())
      .executeTakeFirst();
    if (!row) return null;
    await tx
      .updateTable("deriv_trader_sessions")
      .set({ last_seen_at: new Date() })
      .where("id", "=", row.id)
      .execute();
    return row;
  });
}

export function publicTraderSession(
  row: Awaited<ReturnType<typeof traderSession>>,
) {
  if (!row) return { authenticated: false as const };
  return {
    authenticated: true as const,
    site: row.site,
    mode: row.mode,
    email: row.email,
    account: row.account_login
      ? {
          login: row.account_login,
          currency: row.account_currency,
        }
      : null,
    expiresAt: row.expires_at,
  };
}

export async function revokeTraderSession(db: StudioDb, id: string) {
  await serviceScope(db, (tx) =>
    tx
      .updateTable("deriv_trader_sessions")
      .set({ revoked_at: new Date(), encrypted_token: null })
      .where("id", "=", id)
      .execute(),
  );
}

export async function requestOtp(
  db: StudioDb,
  token: string,
  sessionId: string,
) {
  const row = await serviceScope(db, (tx) =>
    tx
      .selectFrom("deriv_trader_sessions")
      .selectAll()
      .where("id", "=", sessionId)
      .where("token_hash", "=", digest(token))
      .where("revoked_at", "is", null)
      .where("expires_at", ">", new Date())
      .executeTakeFirst(),
  );
  if (!row?.account_id)
    throw new StudioError(401, "Sign in with Deriv first.", "UNAUTHENTICATED");
  if (row.mode !== derivMode()) {
    await revokeTraderSession(db, row.id);
    throw new StudioError(
      503,
      "The Deriv session mode has changed. Sign in again.",
      "DERIV_DISABLED",
    );
  }
  if (row.mode === "mock")
    return {
      mode: "mock" as const,
      wsUrl: null,
      account: { login: row.account_login, currency: row.account_currency },
    };
  if (process.env.FEATURE_LIVE_DERIV !== "true") {
    await revokeTraderSession(db, row.id);
    throw new StudioError(
      503,
      "Live Deriv access is not enabled on this deployment.",
      "DERIV_DISABLED",
    );
  }
  if (!row.encrypted_token)
    throw new StudioError(
      401,
      "Deriv session has no token.",
      "UNAUTHENTICATED",
    );
  const access = decryptSecret(row.encrypted_token);
  const accounts = await loadAccounts(access);
  const account = accounts.find(
    (item) => (item.account_id ?? item.loginid) === row.account_id,
  );
  if (
    !account ||
    (row.mode === "demo" && account.is_virtual !== true) ||
    (row.mode === "real" && account.is_virtual !== false)
  ) {
    await revokeTraderSession(db, row.id);
    throw new StudioError(
      403,
      "The Deriv account type no longer matches this session.",
      "DERIV_ACCOUNT_MISMATCH",
    );
  }
  const response = await fetch(
    `${process.env.DERIV_API_BASE ?? "https://api.derivws.com"}/trading/v1/options/accounts/${encodeURIComponent(row.account_id)}/otp`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access}`,
        "Deriv-App-ID":
          process.env.DERIV_APP_ID ?? process.env.DERIV_CLIENT_ID ?? "",
      },
    },
  );
  const body = (await response.json()) as Record<string, unknown>;
  if (!response.ok || typeof body.ws_url !== "string")
    throw new StudioError(
      502,
      "A Deriv session could not be opened.",
      "DERIV_OTP_FAILED",
    );
  return {
    mode: row.mode,
    wsUrl: body.ws_url,
    account: { login: row.account_login, currency: row.account_currency },
  };
}
