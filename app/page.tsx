import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { Reveal } from "@/components/reveal";
import { HomeAnnouncement } from "@/components/home-announcement";

const proof = [
  ["09", "Deriv presets", "MIT-licensed DBot starting points"],
  ["15%", "platform share", "of attributed Deriv commission"],
  ["85%", "provider share", "after marketplace fees"],
  ["01", "active site", "focused by design"],
];

const steps = [
  {
    n: "01",
    title: "Shape the first impression",
    text: "Choose a considered template, then add your logo, palette, tone, and risk disclosure. Your site starts to feel like your business before you have written a line of code.",
    tag: "Brand",
  },
  {
    n: "02",
    title: "Give it a real address",
    text: "Launch on a free Tradeintra subdomain or attach a domain you own. Registration, DNS, and TLS are verified before the site is shown as live.",
    tag: "Domain",
  },
  {
    n: "03",
    title: "Publish and build momentum",
    text: "Preview every version, publish when it feels right, and keep the next idea moving. One active site keeps the story coherent and the operation calm.",
    tag: "Publish",
  },
];

const system = [
  {
    key: "studio",
    eyebrow: "THE STUDIO",
    title: "A brand surface without the agency timeline.",
    text: "Start with structure that already looks considered. Shape the story, the visual language, and the disclosure without wrestling a general-purpose page builder.",
    points: [
      "Template-led brand kit",
      "Versioned previews",
      "One coherent active site",
    ],
  },
  {
    key: "domains",
    eyebrow: "DOMAINS",
    title: "A real address, ready for the real world.",
    text: "Search, buy, connect, renew, and verify in the same place. The desk shows the exact next step, so a custom domain feels like progress rather than paperwork.",
    points: [
      "Registrar cost + 15%",
      "TXT and TLS verification",
      "Renewal dates in one desk",
    ],
  },
  {
    key: "bots",
    eyebrow: "DERIV PRESETS",
    title: "Start from a strategy you can inspect.",
    text: "Load Deriv’s MIT-licensed DBot presets, review stake and stop-loss settings, verify the XML, and keep a private library. No AI generation charges.",
    points: ["9 reviewed presets", "No AI credits", "Verify before assign"],
  },
  {
    key: "signals",
    eyebrow: "SIGNALS",
    title: "A direct line to the people who want your read.",
    text: "Offer a 24-hour trial, connect Telegram, and deliver a clear subscription experience. Providers keep 85%; the platform keeps the plumbing out of the way.",
    points: ["24-hour trial", "$8.99 / 30 days", "Delivery logs and controls"],
  },
  {
    key: "marketplace",
    eyebrow: "MARKETPLACE",
    title: "Sell the work you have already made.",
    text: "List approved bots, guides, courses, or signals. Buyers get private delivery; sellers get a clear 85% share after review. The marketplace stays curated.",
    points: ["Private delivery", "85% seller share", "Manual review"],
  },
];

const faqs = [
  [
    "Do I need a Deriv account?",
    "Yes. Tradeintra is built around your own Deriv account. You create or connect it before publishing. Trading stays on Deriv, in your account.",
  ],
  [
    "Is Tradeintra a broker?",
    "No. We do not hold funds, execute trades, or provide investment advice. We build and publish the brand surface around your account.",
  ],
  [
    "Can I use my own domain?",
    "Yes. Launch on a free subdomain, buy a domain through the desk, or connect one you already own. DNS and TLS are verified before activation.",
  ],
  [
    "Do bots cost credits?",
    "No. The Deriv preset library and XML tools are included. There are no AI credits, credit packs, or generation charges.",
  ],
  [
    "What happens when I change my mind?",
    "You can archive or replace your active site, and export your account data. Account deletion runs through a 30-day grace period.",
  ],
];

export default function MarketingHome() {
  return (
    <MarketingShell announcement={<HomeAnnouncement />} className="home-page">
      <section className="home-deriv-hero">
        <div className="home-deriv-atmosphere" aria-hidden="true">
          <div className="home-deriv-grid" />
          <div className="home-deriv-orb home-orb-one" />
          <div className="home-deriv-orb home-orb-two" />
          <svg
            className="home-deriv-line"
            viewBox="0 0 900 380"
            preserveAspectRatio="none"
          >
            <path
              d="M0 300 C90 286 130 305 190 250 C250 196 300 235 360 190 C420 145 470 180 520 120 C580 50 640 110 700 80 C760 50 820 95 900 30"
              fill="none"
              stroke="rgba(254,221,0,.42)"
              strokeWidth="1.5"
            />
          </svg>
          <div className="home-deriv-candles">
            {[38, 62, 48, 78, 56, 88, 71, 96, 64, 82, 54, 74].map(
              (height, index) => (
                <i key={index} style={{ height: `${height}%` }} />
              ),
            )}
          </div>
          <div className="home-deriv-chip home-deriv-chip-a">
            <span>DOMAIN</span>
            <strong>operator.com</strong>
            <small>Verified · TLS ready</small>
          </div>
          <div className="home-deriv-chip home-deriv-chip-b">
            <span>PUBLISHED</span>
            <strong>Version 12</strong>
            <small>Rollback ready</small>
          </div>
        </div>
        <div className="home-deriv-inner">
          <div className="home-deriv-copy">
            <span className="marketing-eyebrow">THE OPERATOR STUDIO</span>
            <h1>
              Build the brand.
              <br />
              Publish the platform.
              <br />
              <em>Keep the control.</em>
            </h1>
            <p>
              A considered studio for independent market operators who want a
              presence that earns trust before the first conversation. One
              focused site, one clear address, one system for the work around
              it.
            </p>
            <div className="home-deriv-cta">
              <Link className="btn primary" href="/signup">
                Create your studio
              </Link>
              <a className="home-deriv-link" href="#system">
                See how it works <span aria-hidden="true">→</span>
              </a>
            </div>
            <div className="home-deriv-trust">
              <span>Independent of Deriv</span>
              <span>No fund custody</span>
              <span>No trade execution</span>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-proof home-proof">
        {proof.map(([value, label, detail]) => (
          <div key={label}>
            <span>{value}</span>
            <strong>{label}</strong>
            <small>{detail}</small>
          </div>
        ))}
      </section>

      <Reveal className="marketing-section home-intro">
        <div className="marketing-section-heading">
          <span className="marketing-eyebrow">BUILT FOR OPERATORS</span>
          <h2>Credibility is a design decision.</h2>
          <p>
            Your audience decides whether to stay before they read the details.
            A coherent brand, a real domain, and a clear next step do more than
            a long feature list. Tradeintra gives you those three things in one
            place — and keeps the technical noise out of the room.
          </p>
        </div>
        <div className="home-intro-grid">
          <div>
            <strong>Look established from day one.</strong>
            <p>
              A template-led visual system means the first version already has
              hierarchy, rhythm, and restraint. You are not shipping a
              placeholder; you are starting with a point of view.
            </p>
          </div>
          <div>
            <strong>Own the address and the narrative.</strong>
            <p>
              The site, the domain, the publishing history, and the tools around
              them belong to one account. The relationship stays yours, with a
              clear export path if you ever want to leave.
            </p>
          </div>
          <div>
            <strong>Grow without losing the plot.</strong>
            <p>
              Bots, signals, and marketplace tools are available when the
              foundation is ready. One focused site keeps the story coherent
              while the operation expands.
            </p>
          </div>
        </div>
      </Reveal>

      <section className="marketing-section home-steps">
        <Reveal className="marketing-section-heading">
          <span className="marketing-eyebrow">THE PATH</span>
          <h2>From first idea to a presence that feels inevitable.</h2>
          <p>
            Three deliberate steps. No maze of settings. No guessing what comes
            next. The studio keeps the work moving while you keep the judgment.
          </p>
        </Reveal>
        <div className="home-step-grid">
          {steps.map((step, index) => (
            <Reveal key={step.n} delay={index * 90}>
              <article className="home-step">
                <span className="home-step-n">{step.n}</span>
                <span className="home-step-tag">{step.tag}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <span className="home-step-line" aria-hidden="true" />
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="marketing-section home-system" id="system">
        <Reveal className="marketing-section-heading">
          <span className="marketing-eyebrow">THE OPERATOR SYSTEM</span>
          <h2>Everything the presence needs. Nothing it does not.</h2>
          <p>
            A focused set of tools that share one standard of craft. Use what
            the moment asks for; leave the rest quiet.
          </p>
        </Reveal>
        <div className="home-stack" id="product">
          {system.map((item, index) => (
            <article
              className={`home-stack-card home-stack-${item.key}`}
              key={item.key}
              style={{ "--stack-index": index } as React.CSSProperties}
            >
              <div className="home-stack-copy">
                <span className="marketing-eyebrow">{item.eyebrow}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <ul>
                  {item.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
              <div className="home-stack-visual" aria-hidden="true">
                <div className="home-stack-window">
                  <span />
                  <span />
                  <span />
                  <div className={`home-stack-mock home-mock-${item.key}`}>
                    <strong>{item.eyebrow}</strong>
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Reveal className="marketing-section home-boundary">
        <div>
          <span className="marketing-eyebrow">THE BOUNDARY</span>
          <h2>Built for the operator, not the committee.</h2>
          <p>
            Tradeintra is deliberately narrower than a general website builder.
            One active site, a constrained brand kit, and a clear trading
            boundary keep the product honest and the outcome sharper.
          </p>
          <Link className="text-link" href="/about">
            Read our principles →
          </Link>
        </div>
        <div className="home-boundary-list">
          <div>
            <strong>Your account. Your trades.</strong>
            <p>
              Trading happens on Deriv. We do not execute orders or hold funds.
            </p>
          </div>
          <div>
            <strong>Your brand. Your domain.</strong>
            <p>The address and the relationship stay in your name.</p>
          </div>
          <div>
            <strong>Your data. Your exit.</strong>
            <p>
              Export your account data. Deletion runs through a 30-day grace
              period.
            </p>
          </div>
        </div>
      </Reveal>

      <section
        className="marketing-section marketing-pricing home-pricing"
        id="pricing"
      >
        <Reveal>
          <span className="marketing-eyebrow">PRICING / SIMPLE BY DESIGN</span>
          <h2>One platform share. No credit packs.</h2>
          <p>
            Start with the builder and Deriv preset library at no monthly fee.
            Tradeintra earns 15% of attributed Deriv commission; domains and
            marketplace purchases are priced separately.
          </p>
          <div className="home-price-note">
            <span>No AI credits</span>
            <span>No subscription</span>
            <span>15% platform share</span>
          </div>
        </Reveal>
        <Reveal className="marketing-price-card home-price-card" delay={120}>
          <span>OPERATOR ACCESS</span>
          <ul>
            <li>
              <strong>1</strong>
              <span>active site</span>
            </li>
            <li>
              <strong>15</strong>
              <span>modules</span>
            </li>
            <li>
              <strong>9</strong>
              <span>Deriv presets</span>
            </li>
          </ul>
          <p>No AI credits. No monthly subscription.</p>
          <Link className="btn primary" href="/signup">
            Start building
          </Link>
        </Reveal>
      </section>

      <section className="marketing-section home-faq">
        <Reveal className="marketing-section-heading">
          <span className="marketing-eyebrow">QUESTIONS, ANSWERED</span>
          <h2>Clear before you commit.</h2>
        </Reveal>
        <div className="home-faq-list">
          {faqs.map(([question, answer], index) => (
            <Reveal key={question} delay={index * 50}>
              <details>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal className="marketing-final home-final">
        <span className="marketing-eyebrow">READY WHEN YOU ARE</span>
        <h2>Build one site. Keep the whole picture.</h2>
        <p>
          The next version of your presence can start with a name, a domain, and
          a decision to look serious about the work.
        </p>
        <div className="marketing-cta">
          <Link className="btn primary" href="/signup">
            Create your studio
          </Link>
          <Link className="btn" href="/contact">
            Talk to the operator team
          </Link>
        </div>
      </Reveal>
    </MarketingShell>
  );
}
