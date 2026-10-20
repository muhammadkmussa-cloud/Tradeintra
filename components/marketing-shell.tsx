import Link from "next/link";
import type { ReactNode } from "react";

export function MarketingNav() {
  return (
    <header className="marketing-nav">
      <Link className="marketing-wordmark" href="/">
        <span className="marketing-mark">t</span>
        tradeintra<span>.</span>
      </Link>
      <nav aria-label="Public navigation">
        <Link href="/#product">Product</Link>
        <Link href="/#pricing">Pricing</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/developers">Developers</Link>
        <Link href="/mcp">MCP</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
      </nav>
      <div className="marketing-actions">
        <Link className="btn" href="/login">
          Log in
        </Link>
        <Link className="btn primary" href="/signup">
          Sign up
        </Link>
      </div>
    </header>
  );
}

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="marketing-page">
      <MarketingNav />
      <main className="marketing-main">{children}</main>
      <footer className="marketing-footer">
        <div>
          <strong>tradeintra.</strong>
          <p>Build. Deploy. Trade.</p>
        </div>
        <div className="marketing-footer-links">
          <Link href="/contact">Contact</Link>
          <Link href="/developers">Developers</Link>
          <Link href="/mcp">MCP</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
        <p className="marketing-legal">
          Tradeintra is independent of Deriv. Trading happens on Deriv, in the
          customer&rsquo;s own account. This build is a development preview and
          does not execute trades or hold funds.
        </p>
      </footer>
    </div>
  );
}

export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <MarketingShell>
      <section className="legal-hero">
        <span className="marketing-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </section>
      <article className="legal-body">{children}</article>
    </MarketingShell>
  );
}
