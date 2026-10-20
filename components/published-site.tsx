import type { Config } from "@/lib/studio";
import { RISK, accentInk } from "@/lib/studio";
export function PublishedSite({
  config,
  environment = "Local development",
}: {
  config: Config;
  environment?: string;
}) {
  return (
    <div
      className="poc-site"
      style={
        {
          "--tenant-accent": config.color,
          "--tenant-ink": accentInk(config.color),
        } as React.CSSProperties
      }
    >
      <div className="poc-ribbon">
        {environment.toUpperCase()} · PUBLISHED MOCK SNAPSHOT · NO LIVE TRADING
      </div>
      <header className="poc-nav">
        <strong>
          <span>{config.name.charAt(0)}</span>
          {config.name}
        </strong>
        <span>Independent operator preview · Built with tradeintra</span>
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
            <p>
              Illustrative prices only — not live data or a performance claim.
            </p>
            <div className="poc-markets">
              {[
                "Volatility 100 Index",
                "Volatility 75 Index",
                "Volatility 50 Index",
              ].map((n, i) => (
                <article key={n}>
                  <h3>{n}</h3>
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
              Illustrative layout. No trades, deposits, balances, or account
              credentials.
            </p>
            <svg
              className="poc-chart"
              viewBox="0 0 600 120"
              role="img"
              aria-label="Illustrative mock chart, not market data"
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
              This is an independent branded mock site. Tradeintra is not
              affiliated with or endorsed by Deriv.
            </p>
          </section>
        )}
        <section className="poc-risk">
          <h2>Risk disclosure</h2>
          <p>{RISK}</p>
        </section>
      </main>
      <footer className="poc-footer">
        Built with tradeintra · {environment} preview · Build. Deploy. Trade.
      </footer>
    </div>
  );
}
