"use client";

import { useEffect, useState } from "react";
import { Check, ShieldCheck, X } from "lucide-react";

type Seller = {
  account_id: string;
  display_name: string;
  kind: string;
  status: string;
};
type Payout = {
  id: string;
  account_id: string;
  amount: string;
  method: string;
  status: string;
};
type Commission = {
  id: string;
  account_id: string;
  period: string;
  gross_commission: string;
  platform_share: string;
  status: string;
  statement_name: string | null;
};
type Transfer = {
  id: string;
  direction: string;
  domain_name: string;
  status: string;
  note: string | null;
  created_at: string;
};
type Audit = {
  id: string;
  action: string;
  detail: string;
  account_id: string;
  created_at: string;
};
type DomainPrice = {
  tld: string;
  registration_price: string;
  renewal_price: string;
  markup_percent: string;
};

const money = (value: number | string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(value),
  );

export function ServerAdmin({
  role,
  notify,
}: {
  role: string;
  notify: (message: string) => void;
}) {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [domainPrices, setDomainPrices] = useState<DomainPrice[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [tld, setTld] = useState(".com");
  const [registrationPrice, setRegistrationPrice] = useState("12.5");
  const [renewalPrice, setRenewalPrice] = useState("14");
  const [markupPercent, setMarkupPercent] = useState("15");
  const [accountId, setAccountId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [gross, setGross] = useState("100");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/studio/admin/commerce", {
      credentials: "same-origin",
      cache: "no-store",
    });
    const body = await response.json();
    if (!response.ok)
      throw new Error(body.error ?? "Unable to load admin commerce.");
    setSellers(body.sellers ?? []);
    setPayouts(body.payouts ?? []);
    setCommissions(body.commissions ?? []);
    setDomainPrices(body.domainPrices ?? []);
    setTransfers(body.transfers ?? []);
    setAudit(body.audit ?? []);
  }
  const adminRole = ["super_admin", "finance", "support"].includes(role);
  useEffect(() => {
    if (adminRole) load().catch((reason: Error) => setError(reason.message));
  }, [adminRole]);

  async function act(input: Record<string, unknown>, message: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/studio/admin/commerce", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "The admin request failed.");
        return;
      }
      await load();
      notify(message);
    } catch {
      setError("The admin commerce service is unavailable.");
    } finally {
      setBusy(false);
    }
  }

  if (!adminRole)
    return (
      <div className="empty-state">
        <ShieldCheck size={34} />
        <h2>Admin access required.</h2>
        <p>This area is restricted to the server-side allowlist.</p>
      </div>
    );

  return (
    <div className="mock-stack">
      <div className="mock-banner">
        <div>
          <span className="eyebrow">
            {role === "support"
              ? "SUPPORT / SELLER REVIEW"
              : role === "finance"
                ? "FINANCE / PAYOUT REVIEW"
                : "SUPER ADMIN / COMMERCE REVIEW"}
          </span>
          <strong>Seller, payout, and commission controls are audited.</strong>
          <p>
            Restricted by `SUPER_ADMIN_EMAILS`, `FINANCE_EMAILS`, and
            `SUPPORT_EMAILS`. Payouts are status transitions only; no provider
            transfer is executed here.
          </p>
        </div>
        <span className="badge neutral">{role.replace("_", " ")}</span>
      </div>
      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mock-two-col">
        <section
          className="panel mock-panel"
          style={{ display: role === "finance" ? "none" : undefined }}
        >
          <div className="section-heading">
            <div>
              <h2>Seller approvals</h2>
              <p>Approve or suspend a seller profile.</p>
            </div>
          </div>
          <div className="mock-list">
            {sellers.length ? (
              sellers.map((seller) => (
                <div className="mock-list-row" key={seller.account_id}>
                  <span>
                    {seller.display_name}
                    <small>{seller.account_id}</small>
                  </span>
                  <span className="badge neutral">{seller.status}</span>
                  <div className="mock-actions">
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() =>
                        void act(
                          {
                            action: "seller-status",
                            accountId: seller.account_id,
                            status: "approved",
                          },
                          "Seller approved.",
                        )
                      }
                    >
                      <Check size={13} /> Approve
                    </button>
                    <button
                      className="text-link danger"
                      disabled={busy}
                      onClick={() =>
                        void act(
                          {
                            action: "seller-status",
                            accountId: seller.account_id,
                            status: "suspended",
                          },
                          "Seller suspended.",
                        )
                      }
                    >
                      <X size={13} /> Suspend
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">No seller applications yet.</p>
            )}
          </div>
        </section>
        <section
          className="panel mock-panel"
          style={{ display: role === "support" ? "none" : undefined }}
        >
          <div className="section-heading">
            <div>
              <h2>Payout review</h2>
              <p>Finance status transitions only.</p>
            </div>
          </div>
          <div className="mock-list">
            {payouts.length ? (
              payouts.map((payout) => (
                <div className="mock-list-row" key={payout.id}>
                  <span>
                    {payout.method}
                    <small>{payout.account_id}</small>
                  </span>
                  <strong>{money(payout.amount)}</strong>
                  <span className="badge neutral">{payout.status}</span>
                  <div className="mock-actions">
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() =>
                        void act(
                          {
                            action: "payout-status",
                            accountId: payout.account_id,
                            payoutId: payout.id,
                            status: "approved",
                          },
                          "Payout approved.",
                        )
                      }
                    >
                      Approve
                    </button>
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() =>
                        void act(
                          {
                            action: "payout-status",
                            accountId: payout.account_id,
                            payoutId: payout.id,
                            status: "paid",
                          },
                          "Payout marked paid.",
                        )
                      }
                    >
                      Mark paid
                    </button>
                    <button
                      className="text-link danger"
                      disabled={busy}
                      onClick={() =>
                        void act(
                          {
                            action: "payout-status",
                            accountId: payout.account_id,
                            payoutId: payout.id,
                            status: "rejected",
                          },
                          "Payout rejected.",
                        )
                      }
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">No payout requests yet.</p>
            )}
          </div>
        </section>
      </div>
      <section className="panel mock-panel">
        <div className="section-heading">
          <div>
            <h2>Domain transfer queue</h2>
            <p>Manual registrar transfer requests.</p>
          </div>
        </div>
        <div className="mock-list">
          {transfers.length ? (
            transfers.map((transfer) => (
              <div className="mock-list-row" key={transfer.id}>
                <span>
                  {transfer.domain_name}
                  <small>
                    {transfer.direction}
                    {transfer.note ? ` · ${transfer.note}` : ""}
                  </small>
                </span>
                <span className="badge neutral">{transfer.status}</span>
                <div className="mock-actions">
                  <button
                    className="text-link"
                    disabled={busy}
                    onClick={() =>
                      void act(
                        {
                          action: "transfer-status",
                          id: transfer.id,
                          status: "approved",
                        },
                        "Transfer approved.",
                      )
                    }
                  >
                    Approve
                  </button>
                  <button
                    className="text-link"
                    disabled={busy}
                    onClick={() =>
                      void act(
                        {
                          action: "transfer-status",
                          id: transfer.id,
                          status: "completed",
                        },
                        "Transfer marked complete.",
                      )
                    }
                  >
                    Complete
                  </button>
                  <button
                    className="text-link danger"
                    disabled={busy}
                    onClick={() =>
                      void act(
                        {
                          action: "transfer-status",
                          id: transfer.id,
                          status: "rejected",
                        },
                        "Transfer rejected.",
                      )
                    }
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="muted">No transfer requests yet.</p>
          )}
        </div>
      </section>
      <section
        className="panel mock-panel"
        style={{ display: role === "support" ? "none" : undefined }}
      >
        <div className="section-heading">
          <div>
            <h2>Import commission</h2>
            <p>Records 15% of the imported gross partner commission.</p>
          </div>
        </div>
        <div className="mock-inline-form">
          <label className="field mock-grow">
            Account ID
            <input
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            />
          </label>
          <label className="field mock-grow">
            Site ID (optional)
            <input value={siteId} onChange={(e) => setSiteId(e.target.value)} />
          </label>
          <label className="field">
            Period
            <input value={period} onChange={(e) => setPeriod(e.target.value)} />
          </label>
          <label className="field">
            Gross
            <input
              type="number"
              min="0"
              value={gross}
              onChange={(e) => setGross(e.target.value)}
            />
          </label>
          <label className="field mock-grow">
            Reference
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </label>
          <button
            className="btn primary"
            disabled={busy || !accountId}
            onClick={() =>
              void act(
                {
                  action: "commission",
                  accountId,
                  siteId: siteId || undefined,
                  period,
                  gross: Number(gross),
                  reference: reference || undefined,
                  status: "imported",
                },
                "Commission imported with 15% platform share.",
              )
            }
          >
            Import
          </button>
        </div>
        <div className="mock-list">
          {commissions.length ? (
            commissions.map((entry) => (
              <div className="mock-list-row" key={entry.id}>
                <span>
                  {entry.period}
                  <small>
                    {entry.account_id}
                    {entry.statement_name ? ` · ${entry.statement_name}` : ""}
                  </small>
                </span>
                <strong>{money(entry.platform_share)}</strong>
                <span className="badge neutral">{entry.status}</span>
                {entry.statement_name ? (
                  <a
                    className="text-link"
                    href={`/api/studio/admin/commissions/${entry.id}`}
                  >
                    Download
                  </a>
                ) : null}
                {entry.status === "submitted" ? (
                  <span className="mock-actions">
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() =>
                        void act(
                          {
                            action: "review-commission",
                            id: entry.id,
                            status: "approved",
                            note: "Statement reviewed and approved.",
                          },
                          "Commission statement approved.",
                        )
                      }
                    >
                      Approve
                    </button>
                    <button
                      className="text-link danger"
                      disabled={busy}
                      onClick={() =>
                        void act(
                          {
                            action: "review-commission",
                            id: entry.id,
                            status: "rejected",
                            note: "Statement rejected; upload a corrected CSV.",
                          },
                          "Commission statement rejected.",
                        )
                      }
                    >
                      Reject
                    </button>
                  </span>
                ) : null}
              </div>
            ))
          ) : (
            <p className="muted">No commission entries yet.</p>
          )}
        </div>
      </section>
      {role === "super_admin" ? (
        <section className="panel mock-panel">
          <div className="section-heading">
            <div>
              <h2>Audit log</h2>
              <p>Recent account and admin events.</p>
            </div>
          </div>
          <div className="mock-list">
            {audit.length ? (
              audit.map((entry) => (
                <div className="mock-list-row" key={entry.id}>
                  <span>
                    {entry.action}
                    <small>
                      {entry.account_id} ·{" "}
                      {new Date(entry.created_at).toLocaleString()}
                    </small>
                  </span>
                  <span>{entry.detail}</span>
                </div>
              ))
            ) : (
              <p className="muted">No audit events yet.</p>
            )}
          </div>
        </section>
      ) : null}
      {role === "super_admin" ? (
        <section className="panel mock-panel">
          <div className="section-heading">
            <div>
              <h2>Domain price rules</h2>
              <p>Registrar cost plus the platform markup.</p>
            </div>
          </div>
          <div className="mock-list">
            {domainPrices.map((rule) => (
              <div className="mock-list-row" key={rule.tld}>
                <span>
                  {rule.tld}
                  <small>{rule.markup_percent}% markup</small>
                </span>
                <span>{money(rule.registration_price)}</span>
                <span>{money(rule.renewal_price)}</span>
              </div>
            ))}
          </div>
          <div className="mock-inline-form">
            <label className="field">
              TLD
              <input value={tld} onChange={(e) => setTld(e.target.value)} />
            </label>
            <label className="field">
              Registration
              <input
                type="number"
                min="0"
                step="0.01"
                value={registrationPrice}
                onChange={(e) => setRegistrationPrice(e.target.value)}
              />
            </label>
            <label className="field">
              Renewal
              <input
                type="number"
                min="0"
                step="0.01"
                value={renewalPrice}
                onChange={(e) => setRenewalPrice(e.target.value)}
              />
            </label>
            <label className="field">
              Markup %
              <input
                type="number"
                min="0"
                max="100"
                value={markupPercent}
                onChange={(e) => setMarkupPercent(e.target.value)}
              />
            </label>
            <button
              className="btn primary"
              disabled={busy || !tld}
              onClick={() =>
                void act(
                  {
                    action: "domain-price",
                    tld,
                    registrationPrice: Number(registrationPrice),
                    renewalPrice: Number(renewalPrice),
                    markupPercent: Number(markupPercent),
                  },
                  "Domain price rule updated.",
                )
              }
            >
              Save rule
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
