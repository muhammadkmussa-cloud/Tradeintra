import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { Reveal } from "@/components/reveal";

export const metadata = { title: "MCP — Tradeintra" };

const tools = [
  {
    name: "tradeintra_pricing",
    label: "Pricing",
    text: "Read the public credit packs, bot costs, domain markup, signal price, and marketplace split. No account data.",
  },
  {
    name: "tradeintra_status",
    label: "Provider modes",
    text: "Read whether the studio, AI, email, domains, payments, and Telegram adapters are configured for mock, sandbox, or live use.",
  },
  {
    name: "tradeintra_boundaries",
    label: "Boundaries",
    text: "Read the safety rules: no trade execution, no public account data, no payout transfer, and no provider secrets in responses.",
  },
];

export default function McpPage() {
  return (
    <MarketingShell>
      <section className="info-hero">
        <Reveal immediate>
          <span className="marketing-eyebrow">MCP / READ-ONLY OPERATIONS</span>
          <h1>
            Give an agent context.
            <br />
            <em>Not the keys.</em>
          </h1>
          <p>
            The public Tradeintra MCP endpoint is intentionally narrow. It gives
            an agent the pricing, provider modes, and boundaries it needs to
            reason about the product without account data, writes, secrets, or
            payout execution.
          </p>
          <div className="marketing-cta">
            <Link className="btn primary" href="/developers">
              Read the developer contract
            </Link>
            <Link className="btn" href="/status">
              View system status
            </Link>
          </div>
        </Reveal>
        <Reveal immediate className="info-terminal" delay={100}>
          <div className="info-terminal-head">
            <span />
            <span />
            <span />
            <code>POST /api/mcp</code>
          </div>
          <pre>
            <code>{`{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "tradeintra_pricing",
    "arguments": {}
  }
}`}</code>
          </pre>
          <p>
            Read-only. No account scope. GET returns 405 with Allow: POST;
            optional bearer key on the host.
          </p>
        </Reveal>
      </section>

      <section className="marketing-section info-section">
        <Reveal className="marketing-section-heading">
          <span className="marketing-eyebrow">PUBLIC TOOLS</span>
          <h2>Three tools. No hidden reach.</h2>
          <p>
            Every public tool returns information an operator or agent can use
            to understand the product. None of them can change a price, publish
            a site, read a tenant, or move money.
          </p>
        </Reveal>
        <div className="info-grid info-grid-3">
          {tools.map((tool, index) => (
            <Reveal key={tool.name} delay={index * 70}>
              <article className="info-card info-tool-card">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{tool.label}</h3>
                <code>{tool.name}</code>
                <p>{tool.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="marketing-section info-split">
        <Reveal>
          <span className="marketing-eyebrow">TRANSPORT</span>
          <h2>Streamable HTTP, JSON-RPC, no account scope.</h2>
          <p>
            The preview exposes a public read-only endpoint over streamable
            HTTP. Account-scoped support and operations tools remain gated until
            the production MCP host, token issuance, rate limits, and audit
            policy are approved.
          </p>
          <a className="text-link" href="/llms.txt">
            Read the machine-readable summary →
          </a>
        </Reveal>
        <Reveal delay={100}>
          <div className="info-code-card info-code-compact">
            <div className="info-code-head">
              <b>POST</b>
              <code>/api/mcp</code>
              <small>initialize</small>
            </div>
            <pre>
              <code>{`// Metadata is in initialize.
// Transport is POST only.
{
  "protocolVersion": "2025-06-18",
  "serverInfo": {
    "name": "tradeintra-public"
  }
}`}</code>
            </pre>
          </div>
        </Reveal>
      </section>

      <section className="marketing-section info-split info-boundary">
        <Reveal>
          <span className="marketing-eyebrow">PROHIBITED</span>
          <h2>What the public MCP surface will never do.</h2>
          <p>
            Read-only is a product decision, not a missing feature. The endpoint
            cannot become a back door around session ownership, Finance review,
            or the separation between the brand surface and the trading account.
          </p>
        </Reveal>
        <Reveal delay={100}>
          <div className="info-rule-list">
            {[
              "Read another tenant’s account",
              "Expose tokens, passwords, or registrar contacts",
              "Execute a payout or payment write",
              "Change pricing or entitlements",
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
        <span className="marketing-eyebrow">MCP IS OPEN FOR INSPECTION</span>
        <h2>Connect to the public surface.</h2>
        <p>
          Point an MCP client at <code>/api/mcp</code>, initialize, and call the
          public tools. Account-level access remains a separate, reviewed step.
        </p>
        <div className="marketing-cta">
          <a className="btn primary" href="/llms.txt">
            Open llms.txt
          </a>
          <Link className="btn" href="/contact">
            Ask about access
          </Link>
        </div>
      </Reveal>
    </MarketingShell>
  );
}
