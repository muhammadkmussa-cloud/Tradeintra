import Link from "next/link";
import { LegalPage } from "@/components/marketing-shell";

export const metadata = { title: "Contact — Tradeintra" };

export default function ContactPage() {
  return (
    <LegalPage
      eyebrow="CONTACT / OPERATOR SUPPORT"
      title="Talk to the operator team."
      intro="Use the published support channel for account, domain, publishing, billing, marketplace, or abuse questions. Never send passwords, Deriv tokens, or API keys."
    >
      <h2>Support</h2>
      <p>
        Email:{" "}
        <a href="mailto:support@tradeintra.com">support@tradeintra.com</a>
      </p>
      <p>
        Telegram and status-page details will be published when the production
        support identity is approved. Until then, use email.
      </p>
      <h2>Abuse and impersonation</h2>
      <p>
        Report phishing, impersonation, trademark abuse, or a malicious
        marketplace listing to{" "}
        <a href="mailto:abuse@tradeintra.com">abuse@tradeintra.com</a>. Include
        the hostname, account, and evidence.
      </p>
      <h2>Security</h2>
      <p>
        Report a suspected vulnerability privately. Do not test against real
        customer data or attempt a live trade.
      </p>
      <h2>Developer contact</h2>
      <p>
        Read <Link href="/developers">developer resources</Link> and the{" "}
        <Link href="/mcp">MCP boundary</Link> before requesting an integration.
      </p>
    </LegalPage>
  );
}
