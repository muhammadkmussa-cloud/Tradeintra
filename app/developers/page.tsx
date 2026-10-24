import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { Reveal } from "@/components/reveal";

export const metadata = { title: "Developers — Tradeintra" };

const capabilities = [
  {
    n: "01",
    title: "Account-aware contracts",
    text: "Session-scoped routes for the studio, domains, bots, signals, marketplace, support, and account export. Tenant boundaries are enforced on the server, not in the browser.",
  },
  {
    n: "02",
    title: "Provider boundaries",
    text: "The public contract never returns registrar contacts, provider secrets, payment credentials, or encrypted tokens. Payouts remain a Finance-reviewed status transition.",
  },
  {
    n: "03",
    title: "Safe failure envelopes",
    text: "Validation errors are returned as structured field errors. Provider failures are redacted. Publishing uses operation IDs for safe retries; domain purchases use idempotency keys.",
  },
  {
    n: "04",
    title: "Readable by agents",
    text: "The public MCP endpoint exposes pricing, provider modes, and safety boundaries. OpenAPI and llms.txt describe the surface in a form both people and agents can inspect.",
  },
];

export default function DevelopersPage() {
  return (
    <MarketingShell>
      <section className="info-hero">
        <Reveal immediate>
          <span className="marketing-eyebrow">
            DEVELOPERS / PUBLIC CONTRACT
          </span>
          <h1>
            Build on the rails.
            <br />
            <em>Keep the risk visible.</em>
          </h1>
          <p>
            Tradeintra exposes a deliberately bounded surface for operators,
            support tools, and agents. The contract is designed around clear
            ownership, safe failure, and an honest line between building a brand
            surface and executing a trade.
          </p>
          <div className="marketing-cta">
            <a className="btn primary" href="/openapi.json">
              Read the OpenAPI contract
            </a>
            <Link className="btn" href="/mcp">
              Explore the MCP boundary
            </Link>
          </div>
        </Reveal>
        <Reveal immediate className="info-code-card" delay={100}>
          <div className="info-code-head">
            <b>GET</b>
            <code>/api/studio/session</code>
            <small>200</small>
          </div>
          <pre>
            <code>{`{
  "enabled": true,
  "mode": "local",
  "user": {
    "fullName": "Operator",
    "emailVerified": true
  },
  "studio": {
    "workspace": "My workspace",
    "derivLinked": false,
    "sites": []
  },
  "revision": 0
}`}</code>
          </pre>
          <p>
            Account state is scoped to the session. No provider tokens are
            returned.
          </p>
        </Reveal>
      </section>

      <section className="marketing-section info-section">
        <Reveal className="marketing-section-heading">
          <span className="marketing-eyebrow">THE DEVELOPER SURFACE</span>
          <h2>Enough control to build. Enough boundary to trust.</h2>
          <p>
            Start with the account and site model. Add domains, publishing,
            bots, signals, or marketplace workflows only where the product has a
            real contract behind them.
          </p>
        </Reveal>
        <div className="info-grid">
          {capabilities.map((item, index) => (
            <Reveal key={item.n} delay={index * 60}>
              <article className="info-card">
                <span>{item.n}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="marketing-section info-split">
        <Reveal>
          <span className="marketing-eyebrow">CORE RESOURCES</span>
          <h2>A small surface with a long memory.</h2>
          <p>
            The studio is the source of truth for the account, site, domain,
            publishing, and earnings relationship. Public health and contract
            routes make the operating state inspectable without exposing the
            private graph behind it.
          </p>
          <Link className="text-link" href="/status">
            Check current system status →
          </Link>
        </Reveal>
        <Reveal delay={100}>
          <div className="info-resource-list">
            {[
              ["/api/studio/session", "Current account and studio state"],
              ["/api/studio/domains", "Search, purchase, connect, verify"],
              ["/api/studio/signals", "Trials, subscriptions, delivery"],
              ["/api/studio/marketplace", "Listings, orders, refunds"],
              ["/api/mcp", "Public read-only MCP tools"],
            ].map(([path, label]) => (
              <div key={path}>
                <code>{path}</code>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="marketing-section info-split info-boundary">
        <Reveal>
          <span className="marketing-eyebrow">WHAT THE API WILL NOT DO</span>
          <h2>The boundary is part of the product.</h2>
          <p>
            No endpoint executes a trade, holds funds, exposes a Deriv token, or
            bypasses Finance review for a payout. The public developer surface
            is intentionally read-only, and account routes stay behind a session
            and tenant scope.
          </p>
        </Reveal>
        <Reveal delay={100}>
          <div className="info-rule-list">
            {[
              "No arbitrary trade execution",
              "No provider secrets or registrar contacts",
              "No cross-tenant reads",
              "No payout transfer without review",
            ].map((rule, index) => (
              <div key={rule}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{rule}</strong>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <Reveal className="marketing-final home-final info-final">
        <span className="marketing-eyebrow">READY TO INTEGRATE</span>
        <h2>Start with the contract. Ask before you assume.</h2>
        <p>
          Read the public surface, inspect the MCP tools, or contact the
          operator team with the workflow you want to build.
        </p>
        <div className="marketing-cta">
          <a className="btn primary" href="/openapi.json">
            Open the contract
          </a>
          <Link className="btn" href="/contact">
            Contact the team
          </Link>
        </div>
      </Reveal>
    </MarketingShell>
  );
}
