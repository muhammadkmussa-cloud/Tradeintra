import type { Config } from "@/lib/studio";
import { RISK, accentInk, accentOnDark } from "@/lib/studio";
import { normalizeModuleContent } from "@/lib/studio-modules";
import { DERIV_BOT_PRESETS } from "@/lib/deriv-bot-presets";
import { WorkspacePreview } from "./workspace-preview";

const MARKETS = [
  ["Volatility 100 Index", 1452.38],
  ["Volatility 75 Index", 875.21],
  ["Volatility 50 Index", 2341.65],
] as const;

export function PublishedSite({
  config,
  environment = "Local development",
}: {
  config: Config;
  environment?: string;
}) {
  const modules = config.modules;
  const content = normalizeModuleContent(config.moduleContent);
  const has = (key: string) => modules.includes(key as never);
  const tradeHref =
    content.trade.href === "/trade"
      ? `/trade?site=${encodeURIComponent(config.slug)}&name=${encodeURIComponent(config.name)}&accent=${config.color.replace("#", "")}&theme=${config.theme ?? "dark"}`
      : content.trade.href;

  const sections: Record<string, React.ReactNode> = {
    announcement: has("announcement") ? (
      <div className="poc-announcement">
        <span>{content.announcement.text}</span>
        {content.announcement.linkHref ? (
          <a href={content.announcement.linkHref}>
            {content.announcement.linkLabel}
          </a>
        ) : null}
      </div>
    ) : null,
    header: has("header") ? (
      <header className="poc-nav">
        <strong>
          {config.logo ? (
            <img
              className="poc-brand-logo"
              src={config.logo}
              alt={`${config.name} logo`}
            />
          ) : (
            <span>{config.name.charAt(0)}</span>
          )}
          {config.name}
        </strong>
        <nav className="poc-nav-links" aria-label="Site navigation">
          {has("workspace") ? <a href="#workspace">Workspace</a> : null}
          {has("watchlist") || has("markets") ? (
            <a href="#markets">Markets</a>
          ) : null}
          {has("strategies") ? <a href="#strategies">Strategies</a> : null}
          {has("faq") && content.faq.length ? <a href="#learn">Learn</a> : null}
        </nav>
        <div className="poc-nav-actions">
          {has("trade") ? (
            <a className="poc-button small" href={tradeHref}>
              {content.trade.label}
            </a>
          ) : null}
          <details className="poc-menu">
            <summary>Menu</summary>
            <nav aria-label="Mobile navigation">
              {has("workspace") ? <a href="#workspace">Workspace</a> : null}
              {has("watchlist") || has("markets") ? (
                <a href="#markets">Markets</a>
              ) : null}
              {has("strategies") ? <a href="#strategies">Strategies</a> : null}
              {has("faq") && content.faq.length ? (
                <a href="#learn">Learn</a>
              ) : null}
              {has("trade") ? <a href={tradeHref}>Demo trading</a> : null}
            </nav>
          </details>
        </div>
      </header>
    ) : null,
    ticker: has("ticker") ? (
      <div className="poc-ticker" aria-label="Market ticker">
        {content.ticker.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    ) : null,
    hero: has("hero") ? (
      <section className="poc-hero" id="home">
        <div className="poc-hero-copy">
          <span>ANALYTICS · STRATEGIES · DEMO WORKSPACE</span>
          <h1>{config.headline}</h1>
          <p>{config.description}</p>
          <div className="poc-hero-actions">
            {has("workspace") ? (
              <a className="poc-button" href="#workspace">
                Explore the workspace
              </a>
            ) : has("watchlist") || has("markets") ? (
              <a className="poc-button" href="#markets">
                Explore markets
              </a>
            ) : null}
            {has("trade") ? (
              <a className="poc-button secondary" href={tradeHref}>
                {content.trade.label}
              </a>
            ) : null}
          </div>
          <div className="poc-hero-note">
            <span>Demo only</span>
            <span>No fund custody</span>
            <span>Deriv presets</span>
          </div>
        </div>
        {has("workspace") ? (
          <div className="poc-hero-preview">
            <WorkspacePreview
              name={config.name}
              accent={accentOnDark(config.color)}
              tradeHref={tradeHref}
              logo={config.logo}
              compact
            />
          </div>
        ) : null}
      </section>
    ) : null,
    trust: has("trust") ? (
      <section className="poc-trust">
        <span>Independent operator site</span>
        <span>No live trading</span>
        <span>9 MIT Deriv presets</span>
        <span>One active site</span>
      </section>
    ) : null,
    features: has("features") ? (
      <section className="poc-features" id="platform">
        <div className="poc-section-heading">
          <span>THE OPERATING SURFACE</span>
          <h2>Everything your brand needs to feel like a real product.</h2>
          <p>
            A branded front door, a reviewable strategy library, and a shared
            demo workspace. No AI credits, no fabricated performance claims.
          </p>
        </div>
        <div className="poc-feature-grid">
          {content.features.map((feature, index) => (
            <article key={`${feature.title}-${index}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    ) : null,
    workspace: has("workspace") ? (
      <section className="poc-workspace" id="workspace">
        <div className="poc-section-heading">
          <span>THE DEMO WORKSPACE</span>
          <h2>
            One place for the chart, the market list, and the next action.
          </h2>
          <p>
            Overview, markets, and strategies are visible before anyone signs
            in. Every price is simulated and every action stays in demo mode.
          </p>
        </div>
        <WorkspacePreview
          name={config.name}
          accent={accentOnDark(config.color)}
          tradeHref={tradeHref}
          logo={config.logo}
        />
      </section>
    ) : null,
    strategies: has("strategies") ? (
      <section className="poc-strategies" id="strategies">
        <div className="poc-section-heading">
          <span>STRATEGY LIBRARY</span>
          <h2>Start from a preset you can inspect, not a promise.</h2>
          <p>
            Nine MIT-licensed Deriv DBot starting points. Load, review, and
            adjust stake and stop-loss settings before anything runs.
          </p>
        </div>
        <div className="poc-strategy-grid">
          {DERIV_BOT_PRESETS.map((preset) => (
            <a
              className="poc-strategy-card"
              href={preset.file}
              target="_blank"
              rel="noopener noreferrer"
              key={preset.id}
            >
              <span>{preset.family}</span>
              <h3>{preset.name}</h3>
              <p>{preset.summary}</p>
              <small>{preset.risk}</small>
              <strong>Open preset XML →</strong>
            </a>
          ))}
        </div>
      </section>
    ) : null,
    steps: has("steps") ? (
      <section className="poc-steps" id="how">
        <div className="poc-section-heading">
          <span>FROM BRAND TO DEMO</span>
          <h2>A short path, with the guardrails visible.</h2>
        </div>
        <div className="poc-step-grid">
          {content.steps.map((step, index) => (
            <article key={`${step.title}-${index}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>
    ) : null,
    cta: has("cta") ? (
      <section className="poc-cta">
        <div>
          <span>READY WHEN YOU ARE</span>
          <h2>{config.name} is built for the next conversation.</h2>
        </div>
        {has("trade") ? (
          <a className="poc-button" href={tradeHref}>
            {content.trade.label}
          </a>
        ) : null}
      </section>
    ) : null,
    stats:
      has("stats") && content.stats.length ? (
        <section className="poc-stats">
          {content.stats.map((stat) => (
            <div key={`${stat.value}-${stat.label}`}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
              {stat.note ? <small>{stat.note}</small> : null}
            </div>
          ))}
        </section>
      ) : null,
    watchlist:
      has("watchlist") || has("markets") ? (
        <section className="poc-module" id="markets">
          <h2>Market watchlist</h2>
          <p>
            Illustrative prices only — not live data or a performance claim.
          </p>
          <div className="poc-markets">
            {MARKETS.map(([name, price]) => (
              <article key={name}>
                <h3>{name}</h3>
                <strong>{price.toLocaleString("en-US")}</strong>
                <small>Simulated price</small>
              </article>
            ))}
          </div>
        </section>
      ) : null,
    chart:
      has("chart") || has("terminal") ? (
        <section className="poc-module">
          <h2>Market chart</h2>
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
              stroke="var(--tenant-accent-on-dark)"
              strokeWidth="3"
              fill="none"
            />
          </svg>
        </section>
      ) : null,
    testimonials:
      has("testimonials") && content.testimonials.length ? (
        <section className="poc-testimonials">
          <h2>What people are saying</h2>
          <div>
            {content.testimonials.map((item) => (
              <blockquote key={`${item.name}-${item.quote}`}>
                <p>“{item.quote}”</p>
                <footer>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      ) : null,
    about: has("about") ? (
      <section className="poc-module" id="about">
        <h2>About {config.name}</h2>
        <p>{content.about.text}</p>
        <p>
          This is an independent branded mock site. Tradeintra is not affiliated
          with or endorsed by Deriv.
        </p>
      </section>
    ) : null,
    faq:
      has("faq") && content.faq.length ? (
        <section className="poc-module poc-faq" id="learn">
          <h2>Questions, answered</h2>
          {content.faq.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </section>
      ) : null,
    access: has("access") ? (
      <section className="poc-access" id="access">
        <div>
          <span>ACCESS MODEL</span>
          <h2>No subscription. No credit packs.</h2>
          <p>
            Tradeintra earns 15% of attributed Deriv commission from the
            operator’s own partner account. The builder and preset library are
            included.
          </p>
        </div>
        <div className="poc-access-facts">
          <div>
            <strong>15%</strong>
            <span>platform share</span>
          </div>
          <div>
            <strong>0</strong>
            <span>AI credits</span>
          </div>
          <div>
            <strong>Demo</strong>
            <span>only until approval</span>
          </div>
        </div>
      </section>
    ) : null,
    trade: has("trade") ? (
      <section className="poc-module poc-launch" id="launch">
        <h2>{content.trade.label}</h2>
        <p>
          The shared demo trading workspace opens here after Deriv approval. No
          real money is enabled in this environment.
        </p>
        <a className="poc-button" href={tradeHref}>
          {content.trade.label}
        </a>
      </section>
    ) : null,
    risk: (
      <section className="poc-risk">
        <h2>Risk disclosure</h2>
        <p>{RISK}</p>
      </section>
    ),
  };

  return (
    <div
      className="poc-site"
      data-site-theme={config.theme ?? "dark"}
      style={
        {
          "--tenant-accent": config.color,
          "--tenant-accent-on-dark": accentOnDark(config.color),
          "--tenant-ink": accentInk(config.color),
        } as React.CSSProperties
      }
    >
      <div className="poc-ribbon">
        {environment.toUpperCase()} · PUBLISHED MOCK SNAPSHOT · NO LIVE TRADING
      </div>
      {sections.announcement}
      {sections.header}
      {sections.ticker}
      <main className="poc-main">
        {modules
          .filter(
            (key) =>
              key !== "announcement" &&
              key !== "header" &&
              key !== "ticker" &&
              key !== "footer",
          )
          .map((key) => (
            <div key={key} className={`poc-section poc-section-${key}`}>
              {sections[key] ?? null}
            </div>
          ))}
      </main>
      {has("footer") ? (
        <footer className="poc-footer">
          Built with tradeintra · {environment} preview · Build. Deploy. Trade.
        </footer>
      ) : null}
    </div>
  );
}
