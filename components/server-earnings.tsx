"use client";

import { useEffect, useState } from "react";
import { CreditCard, Wallet } from "lucide-react";

type Earning = {
  id: string;
  source: string;
  amount: string;
  status: string;
  reference: string | null;
  created_at: string;
};
type Payout = {
  id: string;
  amount: string;
  method: string;
  status: string;
  created_at: string;
};
type Summary = {
  earnings: Earning[];
  payouts: Payout[];
  available: number;
  pending: number;
  paid: number;
};
type CommissionEntry = {
  id: string;
  period: string;
  gross_commission: string;
  platform_share: string;
  status: string;
  statement_name: string | null;
  reviewer_note: string | null;
  submitted_at: string | null;
};
type CommissionSummary = {
  entries: CommissionEntry[];
  gross: number;
  platformShare: number;
  pending: number;
  approved: number;
};

const money = (value: number | string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(value),
  );

export function ServerEarnings({
  notify,
}: {
  notify: (message: string) => void;
}) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [commission, setCommission] = useState<CommissionSummary | null>(null);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [statement, setStatement] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [amount, setAmount] = useState("10");
  const [method, setMethod] = useState<"mpesa" | "bank" | "crypto">("mpesa");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const [payoutsResponse, commissionResponse] = await Promise.all([
      fetch("/api/studio/payouts", {
        credentials: "same-origin",
        cache: "no-store",
      }),
      fetch("/api/studio/commissions", {
        credentials: "same-origin",
        cache: "no-store",
      }),
    ]);
    const body = await payoutsResponse.json();
    if (!payoutsResponse.ok)
      throw new Error(body.error ?? "Unable to load earnings.");
    setSummary(body);
    if (commissionResponse.ok) setCommission(await commissionResponse.json());
  }

  async function uploadStatement() {
    if (!statement) {
      setError("Choose a CSV commission statement first.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.set("period", period);
      form.set("statement", statement);
      const response = await fetch("/api/studio/commissions", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "The statement upload failed.");
        return;
      }
      setCommission(body);
      setStatement(null);
      notify("Commission statement submitted for Finance review.");
    } catch {
      setError("The commission service is unavailable. Try again.");
    } finally {
      setUploading(false);
    }
  }
  useEffect(() => {
    load().catch((reason: Error) => setError(reason.message));
  }, []);

  async function act(input: Record<string, unknown>, message: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/studio/payouts", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "The payout request failed.");
        return;
      }
      await load();
      notify(message);
    } catch {
      setError("The payout service is unavailable. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mock-stack">
      <div className="mock-banner">
        <div>
          <span className="eyebrow">SERVER EARNINGS / PAYOUT LEDGER</span>
          <strong>Marketplace and provider earnings are account-scoped.</strong>
          <p>
            The platform keeps 15%. Available earnings can be requested for
            Finance review via M-Pesa, bank, or crypto. No payout is executed
            automatically.
          </p>
        </div>
        <span className="badge neutral">
          {money(summary?.available ?? 0)} available
        </span>
      </div>
      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mock-metrics">
        <div>
          <span>Available</span>
          <strong>{money(summary?.available ?? 0)}</strong>
        </div>
        <div>
          <span>Pending</span>
          <strong>{money(summary?.pending ?? 0)}</strong>
        </div>
        <div>
          <span>Paid</span>
          <strong>{money(summary?.paid ?? 0)}</strong>
        </div>
        <div>
          <span>Payout requests</span>
          <strong>{summary?.payouts.length ?? 0}</strong>
        </div>
      </div>
      <div className="mock-two-col">
        <section className="panel mock-panel">
          <div className="section-heading">
            <div>
              <h2>Earnings ledger</h2>
              <p>Separate sources; no unexplained balance.</p>
            </div>
          </div>
          <div className="mock-list">
            {summary?.earnings.length ? (
              summary.earnings.map((entry) => (
                <div className="mock-list-row" key={entry.id}>
                  <span>
                    {entry.source}
                    <small>{entry.reference ?? "no reference"}</small>
                  </span>
                  <strong>{money(entry.amount)}</strong>
                  <span className="badge neutral">{entry.status}</span>
                </div>
              ))
            ) : (
              <p className="muted">No earnings yet.</p>
            )}
          </div>
          <button
            className="btn"
            disabled={busy}
            onClick={() =>
              void act(
                { action: "release" },
                "Pending earnings released for the mock payout window.",
              )
            }
          >
            Release pending earnings
          </button>
        </section>
        <section className="panel mock-panel">
          <div className="section-heading">
            <div>
              <h2>Request payout</h2>
              <p>Minimum $10; Finance review required.</p>
            </div>
          </div>
          <label className="field">
            Amount
            <input
              type="number"
              min="10"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label className="field">
            Method
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as typeof method)}
            >
              <option value="mpesa">M-Pesa</option>
              <option value="bank">Bank</option>
              <option value="crypto">Crypto</option>
            </select>
          </label>
          <button
            className="btn primary"
            disabled={busy}
            onClick={() =>
              void act(
                { action: "request", amount: Number(amount), method },
                "Mock payout requested for Finance review.",
              )
            }
          >
            <Wallet size={14} /> Request payout
          </button>
          <div className="mock-list">
            {summary?.payouts.length ? (
              summary.payouts.map((payout) => (
                <div className="mock-list-row" key={payout.id}>
                  <span>
                    {payout.method}
                    <small>
                      {new Date(payout.created_at).toLocaleDateString()}
                    </small>
                  </span>
                  <strong>{money(payout.amount)}</strong>
                  <span className="badge neutral">{payout.status}</span>
                </div>
              ))
            ) : (
              <p className="muted">No payout requests yet.</p>
            )}
          </div>
          <p className="mock-note">
            <CreditCard size={12} /> No card data or provider payout credential
            is stored here.
          </p>
        </section>
      </div>
      <section className="panel mock-panel" style={{ marginTop: 12 }}>
        <div className="section-heading">
          <div>
            <h2>Deriv commission statements</h2>
            <p>
              Upload the monthly CSV from your own Deriv partner account.
              Tradeintra records a 15% platform share and waits for Finance
              review.
            </p>
          </div>
          <span className="badge neutral">
            {money(commission?.pending ?? 0)} in review
          </span>
        </div>
        <div className="mock-inline-form">
          <label className="field">
            Period
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </label>
          <label className="field mock-grow">
            CSV statement
            <input
              type="file"
              accept=".csv,.txt,text/csv"
              onChange={(e) => setStatement(e.target.files?.[0] ?? null)}
            />
          </label>
          <button
            className="btn primary"
            disabled={uploading || !statement}
            onClick={() => void uploadStatement()}
          >
            Submit for review
          </button>
        </div>
        <div className="mock-metrics">
          <div>
            <span>Gross commission</span>
            <strong>{money(commission?.gross ?? 0)}</strong>
          </div>
          <div>
            <span>Platform share</span>
            <strong>{money(commission?.platformShare ?? 0)}</strong>
          </div>
          <div>
            <span>Approved</span>
            <strong>{money(commission?.approved ?? 0)}</strong>
          </div>
        </div>
        <div className="mock-list">
          {commission?.entries.length ? (
            commission.entries.map((entry) => (
              <div className="mock-list-row" key={entry.id}>
                <span>
                  {entry.period} · {entry.statement_name ?? "statement"}
                  <small>
                    {entry.reviewer_note ??
                      (entry.submitted_at
                        ? new Date(entry.submitted_at).toLocaleDateString()
                        : "Imported")}
                  </small>
                </span>
                <strong>{money(entry.gross_commission)}</strong>
                <span className="badge neutral">{entry.status}</span>
              </div>
            ))
          ) : (
            <p className="muted">No commission statements yet.</p>
          )}
        </div>
        <p className="mock-note">
          CSV must include a <code>gross_commission</code> or{" "}
          <code>commission</code> column. Statements are account-scoped and
          reviewed by Finance; upload does not create a payout.
        </p>
      </section>
    </div>
  );
}
