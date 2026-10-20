import { LegalPage } from "@/components/marketing-shell";

export const metadata = { title: "Terms — Tradeintra" };

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="LEGAL / DEVELOPMENT DRAFT"
      title="Terms of use."
      intro="This is a development draft, not a legal sign-off. It describes the intended operating boundary and must be reviewed by counsel before production use."
    >
      <h2>The service</h2>
      <p>
        Tradeintra provides template-led branded site creation, publishing,
        domain workflows, AI-assisted bot generation, signals, and marketplace
        tools for independent operators. Trading happens on Deriv, in the
        customer&rsquo;s own account. Tradeintra is independent of Deriv and
        does not execute trades, hold funds, or provide investment advice.
      </p>
      <h2>Accounts</h2>
      <p>
        You must provide accurate registration details, verify your email, and
        maintain one active site per account. You are responsible for your Deriv
        account, credentials, content, and compliance with applicable law.
      </p>
      <h2>Domains</h2>
      <p>
        Domain registration is subject to Namecheap and ICANN policies.
        Registration and renewal prices include a platform markup. Registrar
        fees are generally non-refundable after a successful registration.
        Registrant ownership, transfer-out, renewal, expiry, abuse, and dispute
        terms require final legal review.
      </p>
      <h2>Bots, signals, and marketplace</h2>
      <p>
        AI output is assistive and must be validated. Bots are XML data and do
        not execute on Tradeintra. Signal providers and marketplace sellers are
        responsible for their claims, delivery, refunds, tax, and compliance.
        Tradeintra keeps 15% and pays providers 85% after review.
      </p>
      <h2>Credits and commission</h2>
      <p>
        AI credits are a usage balance, not money. Tradeintra earns 15% of the
        Deriv partner commission attributed to a site; this is not a charge on
        the customer&rsquo;s trade volume. Domain sales carry a 15% markup.
      </p>
      <h2>Prohibited uses</h2>
      <p>
        No impersonation, phishing, trademark abuse, unauthorized trading, money
        laundering, or attempt to access another tenant&rsquo;s data. Abusive
        domains and listings may be removed.
      </p>
    </LegalPage>
  );
}
