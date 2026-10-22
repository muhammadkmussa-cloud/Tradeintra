import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { Reveal } from "@/components/reveal";

export const metadata = { title: "Contact — Tradeintra" };

const channels = [
  {
    label: "Operator support",
    email: "support@tradeintra.com",
    text: "Account, domain, publishing, billing, marketplace, or signal questions. Include the account email and a clear description. Never send passwords or API keys.",
  },
  {
    label: "Abuse and impersonation",
    email: "abuse@tradeintra.com",
    text: "Phishing, impersonation, trademark abuse, or a malicious listing. Include the hostname, account, screenshots, and any relevant evidence.",
  },
  {
    label: "Security",
    email: "security@tradeintra.com",
    text: "Report a suspected vulnerability privately. Do not test against real customer data, attempt a live trade, or publish the issue before it is reviewed.",
  },
  {
    label: "Privacy",
    email: "privacy@tradeintra.com",
    text: "Access, export, correction, or deletion requests. Include the account email and the specific request.",
  },
];

export default function ContactPage() {
  return (
    <MarketingShell>
      <section className="info-hero contact-hero">
        <Reveal immediate>
          <span className="marketing-eyebrow">CONTACT / OPERATOR SUPPORT</span>
          <h1>
            A direct line
            <br />
            <em>to the operator team.</em>
          </h1>
          <p>
            Tell us what you are trying to build, what is blocking it, or what
            feels wrong. The more context you share, the faster the conversation
            becomes useful. For account or domain issues, include the account
            email and the relevant hostname.
          </p>
          <div className="marketing-cta">
            <a className="btn primary" href="mailto:support@tradeintra.com">
              Email support
            </a>
            <Link className="btn" href="/developers">
              Developer contact
            </Link>
          </div>
          <p className="contact-safety">
            Never send passwords, Deriv tokens, API keys, or registrar auth
            codes. We will never ask for them over email.
          </p>
        </Reveal>
        <Reveal immediate className="contact-card" delay={100}>
          <span className="marketing-eyebrow">BEFORE YOU WRITE</span>
          <h2>What helps us move faster.</h2>
          <ul>
            <li>The account email you use with Tradeintra.</li>
            <li>The site, domain, order, or listing involved.</li>
            <li>What you expected, what happened, and when.</li>
            <li>A screenshot or exact error text if available.</li>
          </ul>
          <p>
            For security reports, use the dedicated channel and keep the details
            private until we have had a chance to respond.
          </p>
        </Reveal>
      </section>

      <section className="marketing-section info-section">
        <Reveal className="marketing-section-heading">
          <span className="marketing-eyebrow">CHOOSE THE RIGHT CHANNEL</span>
          <h2>Clear routing. Less noise.</h2>
          <p>
            Using the right channel protects your account and gets the report to
            the person who can act on it.
          </p>
        </Reveal>
        <div className="contact-grid">
          {channels.map((channel, index) => (
            <Reveal key={channel.email} delay={index * 70}>
              <article className="contact-channel">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{channel.label}</h3>
                <a href={`mailto:${channel.email}`}>{channel.email}</a>
                <p>{channel.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="marketing-section info-split">
        <Reveal>
          <span className="marketing-eyebrow">RESPONSE EXPECTATIONS</span>
          <h2>No invented service promises.</h2>
          <p>
            This is a development preview. Support is handled through email
            while the production support identity, incident history, and
            operating hours are approved. We will not promise a response time we
            cannot measure.
          </p>
        </Reveal>
        <Reveal delay={100}>
          <div className="info-rule-list">
            {[
              "Use email for account and billing context",
              "Use the abuse channel for impersonation",
              "Use the security channel for vulnerabilities",
              "Never send secrets or auth codes",
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
        <span className="marketing-eyebrow">STILL UNSURE?</span>
        <h2>Ask the question. We will route it.</h2>
        <p>
          If you do not know which channel fits, start with support and include
          the context. We will move it to the right place.
        </p>
        <div className="marketing-cta">
          <a className="btn primary" href="mailto:support@tradeintra.com">
            Start a conversation
          </a>
          <Link className="btn" href="/status">
            Check system status
          </Link>
        </div>
      </Reveal>
    </MarketingShell>
  );
}
