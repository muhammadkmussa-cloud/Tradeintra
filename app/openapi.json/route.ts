const ok = { responses: { "200": { description: "Success" } } };
const authed = { security: [{ sessionCookie: [] }], ...ok };
const open = { security: [], ...ok };

const document = {
  openapi: "3.1.0",
  info: {
    title: "Tradeintra API",
    version: "0.1.0",
    description:
      "Development contract for account, site, domain, bot preset, signals, marketplace, support, and health workflows. Provider secrets and payout execution are never exposed.",
  },
  servers: [{ url: "/" }],
  paths: {
    "/api/health": { get: { summary: "Liveness", ...open } },
    "/api/health/ready": { get: { summary: "Readiness", ...open } },
    "/api/health/providers": {
      get: { summary: "Provider modes", ...open },
    },
    "/api/mcp": {
      get: { summary: "MCP metadata is not a transport GET", ...open },
      post: { summary: "Public read-only MCP JSON-RPC endpoint", ...open },
    },
    "/api/studio/session": {
      get: { summary: "Current account and studio state", ...authed },
    },
    "/api/studio/register": {
      post: { summary: "Create an account", ...open },
    },
    "/api/studio/login": {
      post: { summary: "Sign in with email and password", ...open },
    },
    "/api/studio/logout": {
      post: { summary: "Sign out", ...authed },
    },
    "/api/studio/verify-email": {
      post: { summary: "Verify an email token", ...open },
    },
    "/api/studio/verify-email/resend": {
      post: { summary: "Resend email verification", ...authed },
    },
    "/api/studio/action": {
      post: { summary: "Mutate site state", ...authed },
    },
    "/api/studio/account": {
      get: { summary: "Export the signed-in account", ...authed },
      post: { summary: "Request or cancel account deletion", ...authed },
    },
    "/api/studio/commissions": {
      get: { summary: "Commission entries and totals", ...authed },
      post: { summary: "Upload a monthly CSV commission statement", ...authed },
    },
    "/api/studio/domains": {
      get: { summary: "List domains", ...authed },
      post: {
        summary: "Search, quote, purchase, renew, attach, or verify a domain",
        ...authed,
      },
    },
    "/api/studio/signals": {
      get: { summary: "List signal orders", ...authed },
      post: {
        summary: "Create, subscribe, resume, pause, deliver, or cancel",
        ...authed,
      },
    },
    "/api/studio/marketplace": {
      get: { summary: "List marketplace listings and purchases", ...authed },
      post: {
        summary: "Apply, list, buy, refund, or release earnings",
        ...authed,
      },
    },
    "/api/studio/marketplace/delivery": {
      get: { summary: "Download a paid delivery", ...authed },
    },
    "/api/studio/marketplace/upload": {
      post: { summary: "Upload a private listing asset", ...authed },
    },
    "/api/studio/support": {
      get: { summary: "List support tickets", ...authed },
      post: { summary: "Create, reply, or close a ticket", ...authed },
    },
    "/api/studio/announcements": {
      get: { summary: "List announcements", ...authed },
      post: { summary: "Create or publish an announcement", ...authed },
    },
    "/api/studio/bots": {
      get: { summary: "List saved bots", ...authed },
      post: {
        summary: "Create, verify, validate, assign, or delete a bot",
        ...authed,
      },
    },
    "/api/studio/telegram": {
      get: { summary: "Read Telegram connection state", ...authed },
      post: { summary: "Connect, test, or remove Telegram", ...authed },
    },
    "/api/studio/password-reset/request": {
      post: { summary: "Request a password reset", ...open },
    },
    "/api/studio/password-reset/confirm": {
      post: { summary: "Confirm a password reset", ...open },
    },
    "/api/studio/payouts": {
      get: { summary: "List payouts and earnings", ...authed },
      post: { summary: "Request a payout", ...authed },
    },
    "/api/studio/admin/commerce": {
      get: { summary: "Admin commerce overview", ...authed },
      post: {
        summary: "Admin seller, payout, or commission action",
        ...authed,
      },
    },
    "/api/studio/admin/payouts": {
      post: { summary: "Finance payout status transition", ...authed },
    },
    "/api/studio/admin/commissions": {
      get: { summary: "Commission summary", ...authed },
      post: { summary: "Import a commission", ...authed },
    },
    "/api/auth/google/start": {
      get: { summary: "Start Google OAuth", ...open },
    },
    "/api/auth/google/callback": {
      get: { summary: "Google OAuth callback", ...open },
    },
    "/api/webhooks/paystack": {
      post: { summary: "Paystack webhook", ...open },
    },
    "/api/webhooks/mpesa": {
      post: { summary: "M-Pesa callback", ...open },
    },
  },
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "tradeintra_session",
      },
      mcpBearer: { type: "http", scheme: "bearer" },
    },
  },
  "x-boundaries": [
    "No provider secrets in responses",
    "No arbitrary trade execution",
    "No payout transfer from this API",
    "Payouts are status transitions pending Finance review",
  ],
} as const;

export function GET() {
  return Response.json(document, {
    headers: {
      "Cache-Control": "public, max-age=60, must-revalidate",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
