import { LegalDocument } from "@/components/legal-document";

export const metadata = { title: "Privacy — Tradeintra" };

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrow="LEGAL / PRIVACY"
      title="Privacy policy."
      updated="22 October 2026"
      intro="This policy explains what Tradeintra collects, why we collect it, how it is used, and the choices available to you. It covers the public website, the operator studio, and the provider workflows connected to the service."
      sections={[
        {
          id: "scope",
          title: "1. Scope",
          body: (
            <>
              <p>
                This policy applies to Tradeintra-controlled pages and services.
                It does not govern Deriv, Namecheap, Paystack, M-Pesa, Telegram,
                Google, DeepSeek, or any other third-party service. Those
                providers have their own privacy terms.
              </p>
            </>
          ),
        },
        {
          id: "collect",
          title: "2. Information we collect",
          body: (
            <>
              <p>We collect information you provide directly:</p>
              <ul>
                <li>
                  name, email address, password hash, and account preferences;
                </li>
                <li>
                  site content, brand assets, domains, bots, and listings;
                </li>
                <li>support messages, abuse reports, and security reports;</li>
                <li>
                  payment references and purchase records from payment
                  providers;
                </li>
                <li>
                  Deriv account linkage details and encrypted provider tokens;
                </li>
                <li>
                  registrant contact details required for domain registration.
                </li>
              </ul>
              <p>
                We also collect limited technical information such as session
                identifiers, IP-derived rate-limit keys, browser storage for
                your theme preference, and server logs needed to operate and
                secure the service.
              </p>
            </>
          ),
        },
        {
          id: "use",
          title: "3. How we use information",
          body: (
            <>
              <p>We use information to:</p>
              <ul>
                <li>
                  create and secure accounts, sessions, and email verification;
                </li>
                <li>
                  provide the studio, publishing, domain, billing, and
                  marketplace features;
                </li>
                <li>
                  process payments, credits, commissions, earnings, and
                  invoices;
                </li>
                <li>
                  deliver signals, marketplace files, and support responses;
                </li>
                <li>
                  detect abuse, fraud, security incidents, and policy
                  violations;
                </li>
                <li>
                  comply with legal, tax, registrar, and financial-record
                  obligations;
                </li>
                <li>
                  improve the product through aggregated, non-identifying usage
                  signals.
                </li>
              </ul>
              <p>
                We do not sell personal information. We do not use customer site
                content to make trading decisions or execute trades.
              </p>
            </>
          ),
        },
        {
          id: "sharing",
          title: "4. When information is shared",
          body: (
            <>
              <p>
                We share information with providers only as needed to deliver
                the service: Namecheap for domain registration, Paystack or
                M-Pesa for payments, Telegram for signal delivery, Google for
                optional sign-in, DeepSeek for AI-assisted bot generation, and
                hosting or infrastructure providers for storage and operation.
              </p>
              <p>
                We may disclose information when required by law, to protect
                rights or safety, to investigate abuse, or as part of a
                reorganization or transfer of the service. Provider secrets and
                registrar contacts are not returned by the public API.
              </p>
            </>
          ),
        },
        {
          id: "storage",
          title: "5. Cookies and local storage",
          body: (
            <>
              <p>
                Tradeintra uses a secure session cookie for authentication and
                local storage for the light/dark theme preference and unsaved
                demo workspace state. Those preferences stay in your browser and
                are not sent to the server as account data.
              </p>
              <p>
                We do not use advertising cookies or third-party behavioral
                tracking on the public preview. Provider pages may set their own
                cookies under their policies.
              </p>
            </>
          ),
        },
        {
          id: "retention",
          title: "6. Retention",
          body: (
            <>
              <p>
                Account and site data is retained while the account is active
                and through the 30-day deletion grace period. Payment, payout,
                commission, domain, and audit records may be retained for the
                period required for financial, tax, registrar, dispute, and
                legal purposes.
              </p>
              <p>
                Private marketplace files are removed after a completed account
                purge. Backups are retained on a rolling schedule and are not
                promised to be deleted immediately from every backup copy.
              </p>
            </>
          ),
        },
        {
          id: "security",
          title: "7. Security",
          body: (
            <>
              <p>
                We use server-side authorization, tenant-scoped database
                policies, encrypted provider secrets, hashed passwords, secure
                session cookies, and redacted error handling. No system is
                perfect. You are responsible for using a unique password and
                protecting your email and Deriv credentials.
              </p>
              <p>
                Report a suspected vulnerability to{" "}
                <a href="mailto:security@tradeintra.com">
                  security@tradeintra.com
                </a>
                . Do not test against real customer data.
              </p>
            </>
          ),
        },
        {
          id: "rights",
          title: "8. Your choices and rights",
          body: (
            <>
              <p>
                You can access your account data, export an account summary,
                update account preferences, disconnect provider links where the
                feature is available, and request deletion. Some records may be
                retained where the law or a financial obligation requires it.
              </p>
              <p>
                Depending on your jurisdiction, you may also have rights to
                correct, restrict, object to, or receive a copy of certain
                personal data. Contact{" "}
                <a href="mailto:privacy@tradeintra.com">
                  privacy@tradeintra.com
                </a>
                .
              </p>
            </>
          ),
        },
        {
          id: "children-international",
          title: "9. Children and international use",
          body: (
            <>
              <p>
                Tradeintra is not intended for anyone under 18. The service is
                operated from the infrastructure selected for the deployment and
                may process information in other countries where providers
                operate. By using the service, you understand that information
                may be transferred to those providers.
              </p>
            </>
          ),
        },
        {
          id: "changes",
          title: "10. Changes and contact",
          body: (
            <>
              <p>
                We may update this policy as the service changes. The date above
                reflects the current version. Material changes will be
                communicated through the service or the account email.
              </p>
              <p>
                Privacy questions:{" "}
                <a href="mailto:privacy@tradeintra.com">
                  privacy@tradeintra.com
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
