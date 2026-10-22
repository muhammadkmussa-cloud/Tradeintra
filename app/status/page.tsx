import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { Reveal } from "@/components/reveal";
import { studioMode } from "@/lib/server/studio/database";
import { aiMode } from "@/lib/server/providers/ai";
import { emailMode } from "@/lib/server/providers/email";
import { domainMode } from "@/lib/server/providers/domain";
import { paymentMode } from "@/lib/server/providers/payments";
import { telegramMode } from "@/lib/server/providers/telegram";

export const metadata = { title: "Status — Tradeintra" };
export const dynamic = "force-dynamic";

function safeMode(read: () => string) {
  try {
    return read();
  } catch {
    return "unavailable";
  }
}

export default function StatusPage() {
  const providers = [
    ["Studio persistence", safeMode(studioMode)],
    ["AI", safeMode(aiMode)],
    ["Email", safeMode(emailMode)],
    ["Domains", safeMode(domainMode)],
    ["Payments", safeMode(paymentMode)],
    ["Telegram", safeMode(telegramMode)],
  ];

  return (
    <MarketingShell>
      <section className="info-hero status-hero">
        <Reveal immediate>
          <span className="marketing-eyebrow">
            STATUS / DEVELOPMENT PREVIEW
          </span>
          <h1>
            The surface is up.
            <br />
            <em>The providers are honest.</em>
          </h1>
          <p>
            This page reports the current application state and provider modes.
            A mode tells you how an adapter is configured; it is not a claim
            that a paid production integration has been approved. No secrets or
            account data are exposed.
          </p>
          <div className="marketing-cta">
            <Link className="btn primary" href="/api/health/ready">
              Read readiness
            </Link>
            <Link className="btn" href="/contact">
              Report an issue
            </Link>
          </div>
        </Reveal>
        <Reveal immediate className="status-summary" delay={100}>
          <span className="status-pulse" aria-hidden="true" />
          <strong>Application responding</strong>
          <p>
            The web surface rendered this page. Live checks are linked below;
            each endpoint reports its own result.
          </p>
          <div className="status-summary-row">
            <span>Environment</span>
            <code>
              {process.env.STUDIO_ENV ?? process.env.NODE_ENV ?? "unknown"}
            </code>
          </div>
          <div className="status-summary-row">
            <span>Data boundary</span>
            <code>no live trading</code>
          </div>
        </Reveal>
      </section>

      <section className="marketing-section info-section">
        <Reveal className="marketing-section-heading">
          <span className="marketing-eyebrow">LIVE CHECKS</span>
          <h2>What can be verified right now.</h2>
          <p>
            These are the public endpoints used by monitoring. They return
            status and configuration mode only; no customer data or provider
            secrets are included.
          </p>
        </Reveal>
        <div className="status-check-grid">
          {[
            ["/api/health", "Liveness", "Application process"],
            [
              "/api/health/ready",
              "Readiness",
              "Database, schema, RLS, storage",
            ],
            [
              "/api/health/providers",
              "Providers",
              "Adapter modes and configuration",
            ],
            ["/openapi.json", "Contract", "Current public API document"],
          ].map(([path, label, detail], index) => (
            <Reveal key={path} delay={index * 60}>
              <a className="status-check" href={path}>
                <span className="badge neutral">{label}</span>
                <code>{path}</code>
                <p>{detail}</p>
                <small>Open check →</small>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="marketing-section info-section">
        <Reveal className="marketing-section-heading">
          <span className="marketing-eyebrow">PROVIDER MODES</span>
          <h2>Configured modes, not guarantees.</h2>
          <p>
            A live provider mode still requires credentials, host acceptance,
            and an approved release. This page does not turn a configuration
            value into a production guarantee.
          </p>
        </Reveal>
        <div className="status-mode-grid">
          {providers.map(([label, mode], index) => (
            <Reveal key={label} delay={index * 40}>
              <div className="status-mode">
                <span>{label}</span>
                <strong>{mode}</strong>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="marketing-section info-split info-boundary">
        <Reveal>
          <span className="marketing-eyebrow">INCIDENTS</span>
          <h2>No public incident history yet.</h2>
          <p>
            Production monitoring, alert routing, and a public incident log are
            part of host acceptance. Until then, use the health endpoints for
            live checks and contact the operator team for a suspected outage.
          </p>
          <Link className="text-link" href="/contact">
            Contact the operator team →
          </Link>
        </Reveal>
        <Reveal delay={100}>
          <div className="status-note">
            <strong>What this page does not claim</strong>
            <p>
              No uptime percentage, no response-time SLA, and no provider
              availability guarantee is asserted by this preview. Those require
              measured production evidence.
            </p>
          </div>
        </Reveal>
      </section>
    </MarketingShell>
  );
}
