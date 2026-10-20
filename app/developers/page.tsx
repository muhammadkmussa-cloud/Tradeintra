import Link from "next/link";
import { LegalPage } from "@/components/marketing-shell";

export const metadata = { title: "Developers — Tradeintra" };

export default function DevelopersPage() {
  return (
    <LegalPage
      eyebrow="DEVELOPERS / PUBLIC CONTRACT"
      title="Build against a bounded operator platform."
      intro="Tradeintra exposes a versioned public API and a read-only MCP surface. The API is designed for account, site, domain, publishing, credit, and marketplace workflows. It never exposes provider secrets or executes payouts."
    >
      <h2>API principles</h2>
      <ul>
        <li>
          Versioned routes under <code>/api/v1</code>.
        </li>
        <li>Server-side validation and account-scoped authorization.</li>
        <li>
          Idempotency keys for purchases, publishing, domains, jobs, and
          releases.
        </li>
        <li>Safe error envelopes with correlation IDs.</li>
        <li>
          No tokens, registrar contacts, payment data, or provider secrets in
          responses.
        </li>
      </ul>
      <h2>Core resources</h2>
      <p>
        Auth, accounts, Deriv links, templates, modules, sites, configurations,
        subdomains, domains, publishing, jobs, bots, signals, plans, credits,
        commissions, earnings, announcements, support, and admin.
      </p>
      <h2>MCP</h2>
      <p>
        The MCP server is read-only in this release. See the{" "}
        <Link href="/mcp">MCP boundary</Link> for scopes and prohibited actions.
      </p>
      <h2>Status</h2>
      <p>
        OpenAPI generation, public sandbox credentials, and the full developer
        portal are tracked as release work. This page describes the intended
        contract; it does not claim that every provider is live.
      </p>
    </LegalPage>
  );
}
