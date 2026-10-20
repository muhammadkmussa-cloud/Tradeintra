import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";

const features = [
  {
    n: "01",
    title: "One operator, one site",
    text: "Every account builds one branded market presence. Start on a free subdomain, then attach or buy a custom domain.",
  },
  {
    n: "02",
    title: "Deriv account first",
    text: "Create or connect a Deriv account before publishing. Tradeintra never executes trades or holds customer funds.",
  },
  {
    n: "03",
    title: "AI trading bots",
    text: "Generate, validate, and store DeepSeek-assisted DBot XML. Credits are transparent; every bot is compatibility-labelled.",
  },
  {
    n: "04",
    title: "Signals and marketplace",
    text: "Subscribe to Telegram signals or sell approved bots, guides, and courses. Providers keep 85%; Tradeintra keeps 15%.",
  },
  {
    n: "05",
    title: "Domains, handled",
    text: "Search, buy, connect, renew, and verify domains through Namecheap. Pricing is registrar cost plus a 15% platform markup.",
  },
  {
    n: "06",
    title: "A 15% partner share",
    text: "Tradeintra earns 15% of the Deriv partner commission attributed to your site. You are not charged 15% of your trade volume.",
  },
];

export default function MarketingHome() {
  return (
    <MarketingShell>
      <section className="marketing-hero">
        <div>
          <span className="marketing-eyebrow">
            OPERATOR INFRASTRUCTURE / DERIV-ONLY
          </span>
          <h1>
            Build the brand.
            <br />
            Publish the platform.
            <br />
            <em>Keep the control.</em>
          </h1>
          <p>
            A measured studio for independent market operators. One site, one
            Deriv account, one clear publishing path — with domains, AI bots,
            signals, and marketplace tools in the same place.
          </p>
          <div className="marketing-cta">
            <Link className="btn primary" href="/signup">
              Create an account
            </Link>
            <Link className="btn" href="/studio">
              Open the studio
            </Link>
          </div>
          <small className="marketing-disclaimer">
            Development preview. Mock market data. No live trading, payments, or
            provider calls without configured credentials.
          </small>
        </div>
        <div className="marketing-hero-card" aria-hidden="true">
          <div className="marketing-browser-bar">
            <span />
            <span />
            <span />
            <code>your-brand.tradeintra.com</code>
          </div>
          <div className="marketing-preview">
            <span>YOUR MARKETS. YOUR PERSPECTIVE.</span>
            <h2>Your markets. Your next move.</h2>
            <p>
              A clear, focused space to explore the markets. Built around you.
            </p>
            <span className="marketing-preview-cta">Explore markets →</span>
            <div className="marketing-chart">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="marketing-status">
            <span>Mock published snapshot</span>
            <span>HTTPS</span>
            <span>No live trading</span>
          </div>
        </div>
      </section>

      <section className="marketing-proof" id="product">
        <div>
          <span>One</span>
          <strong>active site</strong>
          <small>per account</small>
        </div>
        <div>
          <span>15%</span>
          <strong>partner share</strong>
          <small>of Deriv commission</small>
        </div>
        <div>
          <span>30</span>
          <strong>starter credits</strong>
          <small>on verification</small>
        </div>
        <div>
          <span>85%</span>
          <strong>seller share</strong>
          <small>after marketplace fees</small>
        </div>
      </section>

      <section className="marketing-section">
        <div className="marketing-section-heading">
          <span className="marketing-eyebrow">THE OPERATOR SYSTEM</span>
          <h2>Everything the site needs. Nothing it does not.</h2>
          <p>
            Template-led, constrained, and auditable. No free-form code builder,
            no invented market data, and no hidden provider claims.
          </p>
        </div>
        <div className="marketing-feature-grid">
          {features.map((feature) => (
            <article key={feature.n}>
              <span>{feature.n}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section marketing-pricing" id="pricing">
        <div>
          <span className="marketing-eyebrow">PRICING / SIMPLE BY DESIGN</span>
          <h2>Start free. Pay for what you use.</h2>
          <p>
            No monthly subscription. New verified accounts receive 30 AI
            credits. Buy more when you need them; domain and marketplace
            purchases are priced separately.
          </p>
        </div>
        <div className="marketing-price-card">
          <span>AI credit packs</span>
          <ul>
            <li>
              <strong>30</strong>
              <span>$4.99</span>
            </li>
            <li>
              <strong>65</strong>
              <span>$9.99</span>
            </li>
            <li>
              <strong>150</strong>
              <span>$19.99</span>
            </li>
          </ul>
          <p>Generate 10 · refine 3 · verify 3 credits.</p>
          <Link className="btn primary" href="/signup">
            Start with 30 free
          </Link>
        </div>
      </section>

      <section className="marketing-section marketing-split">
        <div>
          <span className="marketing-eyebrow">DOMAINS</span>
          <h2>A real address, verified before it goes live.</h2>
          <p>
            Start on <code>your-brand.tradeintra.com</code>. Upgrade to a custom
            domain when you are ready. Namecheap registration, DNS, and SSL are
            verified before the site is shown as live.
          </p>
          <Link className="text-link" href="/studio">
            Explore domain workflow →
          </Link>
        </div>
        <div>
          <span className="marketing-eyebrow">DERIV BOUNDARY</span>
          <h2>Your account. Your trades. Our studio.</h2>
          <p>
            Tradeintra is independent of Deriv. You create or connect your own
            Deriv account. The platform builds and publishes the brand surface;
            it does not become a broker, hold funds, or execute orders.
          </p>
          <Link className="text-link" href="/terms">
            Read the product boundary →
          </Link>
        </div>
      </section>

      <section className="marketing-final">
        <span className="marketing-eyebrow">READY WHEN YOU ARE</span>
        <h2>Build one site. Keep the whole picture.</h2>
        <div className="marketing-cta">
          <Link className="btn primary" href="/signup">
            Create an account
          </Link>
          <Link className="btn" href="/contact">
            Talk to the operator team
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
