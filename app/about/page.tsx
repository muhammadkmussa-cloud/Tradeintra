import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";

export const metadata = { title: "About — Tradeintra" };

const principles = [
  {
    n: "01",
    title: "Own the first impression",
    text: "Your brand should feel considered before a visitor reads a single number. Tradeintra gives independent operators a polished surface without turning them into full-time designers.",
  },
  {
    n: "02",
    title: "Build on your own terms",
    text: "One focused site. Your domain. Your narrative. Your Deriv account. The platform handles the structure while you keep control of the relationship and the direction.",
  },
  {
    n: "03",
    title: "Make complexity disappear",
    text: "Domains, publishing, Deriv preset tools, signals, and marketplace workflows belong in one calm operating space — not across ten disconnected tabs.",
  },
  {
    n: "04",
    title: "Keep the boundary clear",
    text: "Tradeintra is not a broker. We do not hold funds, execute trades, or promise outcomes. We build the brand surface around the account you already own.",
  },
];

export default function AboutPage() {
  return (
    <MarketingShell>
      <section className="marketing-hero about-hero">
        <div>
          <span className="marketing-eyebrow">ABOUT TRADEINTRA</span>
          <h1>
            The surface
            <br />
            behind your
            <br />
            <em>next chapter.</em>
          </h1>
          <p>
            Tradeintra exists for the operator who has a point of view — and
            wants a digital presence that looks as serious as the work behind
            it. We bring brand, domain, publishing, and growth tools into one
            deliberate studio, so you can stop assembling pieces and start
            building momentum.
          </p>
          <div className="marketing-cta">
            <Link className="btn primary" href="/signup">
              Start building
            </Link>
            <Link className="btn" href="/contact">
              Talk to us
            </Link>
          </div>
        </div>
        <aside className="about-manifesto">
          <span className="marketing-eyebrow">OUR BELIEF</span>
          <blockquote>
            “A strong market presence is not noise. It is clarity, repeated
            until it becomes trust.”
          </blockquote>
          <div className="about-manifesto-stats">
            <div>
              <strong>One</strong>
              <span>focused site per operator</span>
            </div>
            <div>
              <strong>Three</strong>
              <span>steps from idea to published</span>
            </div>
            <div>
              <strong>Zero</strong>
              <span>custody of your funds or trades</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="marketing-proof">
        <div>
          <span>01</span>
          <strong>Clarity first</strong>
          <small>before decoration</small>
        </div>
        <div>
          <span>02</span>
          <strong>Operator control</strong>
          <small>at every step</small>
        </div>
        <div>
          <span>03</span>
          <strong>Built to publish</strong>
          <small>not to tinker forever</small>
        </div>
        <div>
          <span>04</span>
          <strong>Clear boundaries</strong>
          <small>no hidden brokerage</small>
        </div>
      </section>

      <section className="marketing-section about-story">
        <div className="marketing-section-heading">
          <span className="marketing-eyebrow">WHY WE BUILT IT</span>
          <h2>The tools were there. The coherence was not.</h2>
        </div>
        <div className="about-story-grid">
          <p>
            Independent operators are expected to be strategists, publishers,
            designers, and technologists at the same time. The result is often a
            patchwork of tools that work separately and feel disconnected
            together. The brand suffers first, and the audience feels it.
          </p>
          <p>
            Tradeintra was built around a different idea: give one operator a
            single, considered surface. A place where the site, the domain, the
            publishing flow, and the tools around it share the same standard of
            craft. Not more options. Better decisions.
          </p>
          <p>
            We are independent of Deriv. Trading happens in your own account. We
            build the front door, the story, and the system around it — with the
            restraint to stay out of the parts that are not ours.
          </p>
        </div>
      </section>

      <section className="marketing-section">
        <div className="marketing-section-heading">
          <span className="marketing-eyebrow">WHAT WE PROTECT</span>
          <h2>Four principles. Every screen.</h2>
          <p>
            The product is deliberately narrower than a general website builder.
            That constraint is the point: fewer choices, stronger outcomes.
          </p>
        </div>
        <div className="marketing-feature-grid">
          {principles.map((principle) => (
            <article key={principle.n}>
              <span>{principle.n}</span>
              <h3>{principle.title}</h3>
              <p>{principle.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section marketing-split about-boundary">
        <div>
          <span className="marketing-eyebrow">WHAT WE DO</span>
          <h2>Brand, domain, publish, grow.</h2>
          <p>
            A guided studio for the operator who wants a credible market
            presence without becoming a technical administrator. Start with a
            template, shape it around your brand, publish a version, and build
            from there.
          </p>
          <Link className="text-link" href="/#system">
            See the operator system →
          </Link>
        </div>
        <div>
          <span className="marketing-eyebrow">WHAT WE DO NOT DO</span>
          <h2>We do not become the broker.</h2>
          <p>
            Tradeintra does not hold customer funds, execute trades, or provide
            investment advice. Your Deriv relationship stays yours. Our work is
            the brand surface and the operating system around it.
          </p>
          <Link className="text-link" href="/terms">
            Read the product boundary →
          </Link>
        </div>
      </section>

      <section className="marketing-final">
        <span className="marketing-eyebrow">THE NEXT MOVE</span>
        <h2>Build something that looks like you meant it.</h2>
        <p className="about-final-copy">
          Start with a focused site, a clear domain, and a studio that keeps the
          details in one place.
        </p>
        <div className="marketing-cta">
          <Link className="btn primary" href="/signup">
            Create your studio
          </Link>
          <Link className="btn" href="/contact">
            Ask us anything
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
