const text = `# Tradeintra

Tradeintra is a template-led operator studio for building branded Deriv sites.
Trading happens on Deriv in the customer's own account. Tradeintra does not
execute trades, hold funds, or provide investment advice.

## Public contract
- OpenAPI: /openapi.json
- Status: /status
- Health: /api/health/ready
- Providers: /api/health/providers
- MCP boundary: /mcp
- Public read-only MCP: /api/mcp
- Developers: /developers

## Rules
- One active site per account.
- Email verification and Deriv linking are required before site creation.
- Free credits: 30 starter; referral reward: 30.
- Credit packs: 30/$4.99, 65/$9.99, 150/$19.99.
- Domain prices include a 15% platform markup.
- Deriv partner commission: 15% platform share.
- Marketplace and signal providers: 85% provider share after review.
- Signal subscription: $8.99/30 days after a 24-hour trial.

## Boundaries
- No arbitrary trade execution.
- No provider secrets in public responses.
- No payout transfer is executed by the public API.
- Payouts require Finance review.
- This is a development preview, not a production deployment.
`;

export function GET() {
  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
