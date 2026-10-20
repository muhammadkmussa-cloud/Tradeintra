import { LegalPage } from "@/components/marketing-shell";

export const metadata = { title: "Privacy — Tradeintra" };

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="LEGAL / DEVELOPMENT DRAFT"
      title="Privacy policy."
      intro="This is a development draft. It describes the intended data categories and controls and requires legal review, processor lists, retention decisions, and regional analysis before production."
    >
      <h2>Data we intend to collect</h2>
      <ul>
        <li>
          Account name, email, password hash, role, country, and verification
          state.
        </li>
        <li>
          Site configuration, drafts, published versions, domains, and audit
          events.
        </li>
        <li>
          Deriv linking status and encrypted provider tokens; never raw tokens
          in tenant configuration.
        </li>
        <li>
          Payment references and credit/commission ledgers; no card data stored
          by Tradeintra.
        </li>
        <li>
          Support tickets, marketplace listings, signal delivery logs, and abuse
          reports.
        </li>
      </ul>
      <h2>Processors</h2>
      <p>
        Intended processors include Namecheap (hosting, domains, email), Google
        (sign-in), DeepSeek (AI), Paystack and M-Pesa/Daraja (payments), and
        Telegram (signal delivery where enabled). Each requires a final data
        processing review.
      </p>
      <h2>Retention and deletion</h2>
      <p>
        Account deletion has a grace period. Active provider tokens are revoked
        first. Financial, tax, domain, and audit records may be retained where
        required. Backups may retain data for a limited recovery window.
      </p>
      <h2>Your controls</h2>
      <p>
        You can export workspace configuration, request correction, and request
        deletion subject to legal and registrar obligations. Do not enter
        sensitive financial or personal data into a development account.
      </p>
    </LegalPage>
  );
}
