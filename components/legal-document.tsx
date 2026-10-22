import type { ReactNode } from "react";
import { MarketingShell } from "./marketing-shell";

export type LegalSection = {
  id: string;
  title: string;
  body: ReactNode;
};

export function LegalDocument({
  eyebrow,
  title,
  intro,
  updated,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <MarketingShell>
      <section className="legal-doc-hero">
        <span className="marketing-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
        <small>Last updated {updated}</small>
      </section>
      <div className="legal-doc-layout">
        <aside className="legal-doc-toc" aria-label="On this page">
          <span>ON THIS PAGE</span>
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.title}
            </a>
          ))}
        </aside>
        <article className="legal-doc-body">
          {sections.map((section) => (
            <section id={section.id} key={section.id}>
              <h2>{section.title}</h2>
              {section.body}
            </section>
          ))}
        </article>
      </div>
    </MarketingShell>
  );
}
