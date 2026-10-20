import { headers } from "next/headers";
import { notFound, unstable_rethrow } from "next/navigation";
import {
  getTenantForHost,
  normalizeHostname,
  safeDiagnosticError,
} from "@/lib/server/poc-config";
import { getPocDb, loadPublishedTenant } from "@/lib/server/poc-db";
import { RISK, type Config } from "@/lib/studio";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = {
  title: "Tradeintra — Staging tenant POC",
  robots: { index: false, follow: false },
};
export default async function StagingTenant({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hostname = normalizeHostname((await headers()).get("host"));
  let config: Config | null = null;
  try {
    const tenant = getTenantForHost(hostname);
    if (!tenant || tenant !== slug || !hostname) notFound();
    config = await loadPublishedTenant(getPocDb(), hostname, tenant);
  } catch (error) {
    unstable_rethrow(error);
    console.error(safeDiagnosticError(error));
    throw new Error(
      "Staging tenant unavailable. Verify the private staging configuration.",
    );
  }
  if (!config) notFound();
  return (
    <div
      className="poc-site"
      style={{ "--tenant-accent": config.color } as React.CSSProperties}
    >
      <div className="poc-ribbon">
        STAGING PROOF-OF-CONCEPT · SIMULATED DATA · NO LIVE TRADING
      </div>
      <header className="poc-nav">
        <strong>
          <span>{config.name.charAt(0)}</span>
          {config.name}
        </strong>
        <span>Published database configuration · v1</span>
      </header>
      <main className="poc-main">
        <section className="poc-hero">
          <span>YOUR MARKETS. YOUR PERSPECTIVE.</span>
          <h1>{config.headline}</h1>
          <p>{config.description}</p>
        </section>
        {config.modules.includes("markets") && (
          <section className="poc-module">
            <h2>Market watchlist</h2>
            <p>Illustrative data only — not a live feed.</p>
            <div className="poc-markets">
              {[
                "Volatility 100 Index",
                "Volatility 75 Index",
                "Volatility 50 Index",
              ].map((name, i) => (
                <article key={name}>
                  <h3>{name}</h3>
                  <strong>
                    {[1452.38, 875.21, 2341.65][i].toLocaleString("en-US")}
                  </strong>
                  <small>Simulated price</small>
                </article>
              ))}
            </div>
          </section>
        )}
        {config.modules.includes("terminal") && (
          <section className="poc-module">
            <h2>Demo terminal</h2>
            <p>
              Layout demonstration only. Orders and account access are not
              available.
            </p>
            <svg
              viewBox="0 0 600 120"
              className="poc-chart"
              role="img"
              aria-label="Illustrative chart. No market or performance data."
            >
              <path
                d="M0 100L30 90L60 95L90 75L120 82L150 60L180 73L210 55L240 60L270 45L300 55L330 30L360 40L390 20L420 35L450 22L480 25L510 15L540 28L570 10L600 20"
                stroke="var(--tenant-accent)"
                strokeWidth="3"
                fill="none"
              />
            </svg>
          </section>
        )}
        {config.modules.includes("about") && (
          <section className="poc-module">
            <h2>About {config.name}</h2>
            <p>{config.description}</p>
            <p>
              Independent mock operator site, served from an allowlisted
              hostname and a tenant-scoped published database snapshot.
            </p>
          </section>
        )}
        <section className="poc-risk">
          <h2>Risk disclosure</h2>
          <p>{RISK}</p>
        </section>
      </main>
      <footer className="poc-footer">
        Built with tradeintra · Staging only · No Deriv affiliation or
        endorsement
      </footer>
    </div>
  );
}
