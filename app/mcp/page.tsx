import { LegalPage } from "@/components/marketing-shell";

export const metadata = { title: "MCP — Tradeintra" };

export default function McpPage() {
  return (
    <LegalPage
      eyebrow="MCP / READ-ONLY OPERATIONS"
      title="A narrow, auditable operations surface."
      intro="The Tradeintra MCP server exposes read-only support and operations tools. It is authenticated, scoped, rate-limited, and audited. It cannot execute payouts, change pricing, expose secrets, or bypass account ownership."
    >
      <h2>Scopes</h2>
      <ul>
        <li>
          <strong>support</strong> — read masked account/site/ticket context and
          manage tickets.
        </li>
        <li>
          <strong>operations</strong> — read job, publish, release, domain, and
          incident status.
        </li>
      </ul>
      <h2>Prohibited</h2>
      <ul>
        <li>Payout execution or payment-provider writes.</li>
        <li>Reading plaintext tokens, passwords, or registrar contacts.</li>
        <li>Cross-tenant reads without an explicit support authorization.</li>
        <li>Price, markup, plan, or entitlement changes.</li>
      </ul>
      <h2>Transport</h2>
      <p>
        Streamable HTTP with a bearer token issued server-side. Every call is
        audited with scope, actor, resource, and outcome. Live access is gated
        until the production MCP host and token policy are approved.
      </p>
    </LegalPage>
  );
}
