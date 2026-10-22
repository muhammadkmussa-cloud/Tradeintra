import Link from "next/link";
import type { ReactNode } from "react";
import { BrandWordmark } from "./brand-mark";
import { MarketingNav } from "./marketing-nav";
export { MarketingNav } from "./marketing-nav";

export function MarketingShell({
  children,
  announcement,
  className = "",
}: {
  children: ReactNode;
  announcement?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`marketing-page ${className}`.trim()}>
      {announcement}
      <MarketingNav />
      <main className="marketing-main">{children}</main>
      <footer className="marketing-footer">
        <div>
          <BrandWordmark href={null} className="marketing-footer-wordmark" />
          <p>Build. Deploy. Trade.</p>
        </div>
        <div className="marketing-footer-grid">
          <div>
            <span>Platform</span>
            <a href="/#system">Product</a>
            <a href="/#pricing">Pricing</a>
            <Link href="/status">Status</Link>
          </div>
          <div>
            <span>Company</span>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div>
            <span>Build</span>
            <Link href="/developers">Developers</Link>
            <Link href="/mcp">MCP</Link>
          </div>
          <div>
            <span>Legal</span>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
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
