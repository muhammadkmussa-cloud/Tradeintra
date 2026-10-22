import { LegalDocument } from "@/components/legal-document";

export const metadata = { title: "Terms of Use — Tradeintra" };

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrow="LEGAL / TERMS OF USE"
      title="Terms of use."
      updated="22 October 2026"
      intro="These terms govern access to the Tradeintra preview and the operator studio, including the website, domain, publishing, AI, signals, marketplace, and account tools. By using the service, you agree to these terms. If you do not agree, do not use the service."
      sections={[
        {
          id: "agreement",
          title: "1. Agreement and eligibility",
          body: (
            <>
              <p>
                You must be at least 18 years old and legally able to enter a
                contract in your jurisdiction. You are responsible for ensuring
                that your use of Tradeintra, your site, and your Deriv account
                complies with the laws and regulations that apply to you.
              </p>
              <p>
                If you use Tradeintra for a business, you confirm that you have
                authority to bind that business to these terms.
              </p>
            </>
          ),
        },
        {
          id: "service",
          title: "2. What Tradeintra provides",
          body: (
            <>
              <p>
                Tradeintra provides a template-led studio for building a branded
                market presence, publishing a site, managing a domain,
                generating and validating XML bots, offering signals, and
                participating in a curated marketplace. The service is a brand
                and publishing tool.
              </p>
              <p>
                We may improve, change, or remove features as the product
                evolves. Material changes will be communicated through the
                service or the contact email associated with your account.
              </p>
            </>
          ),
        },
        {
          id: "accounts",
          title: "3. Accounts and security",
          body: (
            <>
              <p>
                You must provide accurate registration information, verify your
                email, and keep your credentials secure. You are responsible for
                activity under your account. Notify us immediately if you
                suspect unauthorized access.
              </p>
              <p>
                One active site is allowed per account. You may archive or
                replace a site, but you may not use multiple accounts to evade
                limits, abuse reviews, or operate duplicate presences.
              </p>
            </>
          ),
        },
        {
          id: "deriv",
          title: "4. Deriv relationship and trading risk",
          body: (
            <>
              <p>
                Tradeintra is independent of Deriv. Trading happens on Deriv, in
                your own account. Tradeintra does not become a broker, hold
                customer funds, execute orders, manage positions, or provide
                investment advice.
              </p>
              <p>
                Trading involves risk, including the risk of losing money.
                Nothing on Tradeintra is a promise of performance, a guarantee
                of profit, or a recommendation to trade. You are solely
                responsible for your decisions and for any third-party terms
                that apply to your Deriv account.
              </p>
            </>
          ),
        },
        {
          id: "sites-domains",
          title: "5. Sites, domains, and content",
          body: (
            <>
              <p>
                You retain responsibility for the content you publish and for
                the rights required to use your brand, images, copy, bots, and
                marketplace materials. You grant Tradeintra the limited rights
                needed to host, render, distribute, and back up that content as
                part of the service.
              </p>
              <p>
                Domain registration is subject to Namecheap, registry, and ICANN
                policies. Registration and renewal prices include a platform
                markup. Registrar fees are generally non-refundable after a
                successful registration. You are responsible for renewal,
                accurate registrant data, DNS records, and any transfer
                requirements.
              </p>
            </>
          ),
        },
        {
          id: "credits",
          title: "6. Credits, payments, and taxes",
          body: (
            <>
              <p>
                AI credits are a usage balance, not money, a security, or a
                stored-value account. Verified accounts receive 30 starter
                credits. Additional packs are 30 credits for $4.99, 65 for
                $9.99, and 150 for $19.99, unless a different price is shown at
                checkout.
              </p>
              <p>
                Payments may be processed by third-party providers such as
                Paystack or M-Pesa. You authorize the applicable charge and
                agree to the provider&rsquo;s terms. Taxes are shown where
                required. Credits are consumed by generation, refinement, and
                verification actions. Failed actions are refunded in credits as
                described in the product.
              </p>
            </>
          ),
        },
        {
          id: "marketplace",
          title: "7. Marketplace, signals, and provider earnings",
          body: (
            <>
              <p>
                Sellers and signal providers must be approved. Listings must be
                accurate, lawful, and owned by the seller. Digital delivery is
                private, and buyers may not redistribute purchased materials
                without permission.
              </p>
              <p>
                Tradeintra retains 15% and records 85% for the provider after
                review. Payouts require Finance approval and are not executed by
                the public API. Refunds are reviewed; downloaded digital goods
                and open payouts may require support intervention. Providers are
                responsible for their claims, delivery, refunds, tax, and
                compliance.
              </p>
            </>
          ),
        },
        {
          id: "acceptable-use",
          title: "8. Acceptable use",
          body: (
            <>
              <p>You may not use Tradeintra to:</p>
              <ul>
                <li>
                  impersonate another person, brand, or financial institution;
                </li>
                <li>publish phishing, fraud, malware, or deceptive claims;</li>
                <li>infringe trademarks, copyrights, or other rights;</li>
                <li>
                  attempt to access another tenant&rsquo;s data or bypass access
                  controls;
                </li>
                <li>
                  execute unauthorized trades, launder money, or evade
                  sanctions;
                </li>
                <li>
                  abuse reviews, payments, credits, domains, or marketplace
                  delivery.
                </li>
              </ul>
              <p>
                We may remove content, suspend a site, or restrict an account
                where we reasonably believe these rules have been broken.
              </p>
            </>
          ),
        },
        {
          id: "termination",
          title: "9. Suspension, termination, and deletion",
          body: (
            <>
              <p>
                You may stop using the service at any time. Account deletion
                starts a 30-day grace period, after which eligible account and
                site data is purged. Records that must be retained for
                financial, audit, domain, or legal reasons may be archived for
                the required period.
              </p>
              <p>
                We may suspend or terminate access for material breach, security
                risk, abuse, non-payment, or legal obligation. Where practical,
                we will explain the reason and provide an opportunity to export
                eligible data.
              </p>
            </>
          ),
        },
        {
          id: "disclaimers",
          title: "10. Disclaimers and limitation of liability",
          body: (
            <>
              <p>
                The service is provided on an &ldquo;as available&rdquo; basis.
                To the maximum extent permitted by law, Tradeintra disclaims
                implied warranties of merchantability, fitness for a particular
                purpose, and non-infringement. We do not warrant uninterrupted
                or error-free operation, or that a provider will remain
                available.
              </p>
              <p>
                To the maximum extent permitted by law, Tradeintra is not liable
                for indirect, incidental, special, consequential, or punitive
                damages, or for lost profits, trading losses, or loss of data.
                Nothing in these terms excludes liability that cannot lawfully
                be excluded.
              </p>
            </>
          ),
        },
        {
          id: "changes-contact",
          title: "11. Changes and contact",
          body: (
            <>
              <p>
                We may update these terms as the service changes. The updated
                date above reflects the current version. Continued use after a
                material update constitutes acceptance of the revised terms.
              </p>
              <p>
                Questions about these terms:{" "}
                <a href="mailto:support@tradeintra.com">
                  support@tradeintra.com
                </a>
                .
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
