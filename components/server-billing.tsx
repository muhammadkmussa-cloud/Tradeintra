"use client";

import { useEffect, useState } from "react";
import { Check, CreditCard } from "lucide-react";

type Pack = { id: string; credits: number; amount: number; currency: string };
type Purchase = {
  id: string;
  pack_credits: number;
  amount: string;
  currency: string;
  provider: string;
  provider_reference: string;
  status: string;
  created_at: string;
};

const money = (value: number | string, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    Number(value),
  );

export function ServerBilling({
  notify,
}: {
  notify: (message: string) => void;
}) {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [credits, setCredits] = useState(0);
  const [provider, setProvider] = useState<"mock" | "paystack" | "mpesa">(
    "mock",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/studio/credits", {
      credentials: "same-origin",
      cache: "no-store",
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Unable to load credits.");
    setPacks(body.packs ?? []);
    setCredits(body.credits ?? 0);
    setPurchases(body.purchases ?? []);
  }

  useEffect(() => {
    load().catch((reason: Error) => setError(reason.message));
  }, []);

  async function buy(packId: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/studio/credits", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId, provider }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "The credit purchase failed.");
        return;
      }
      setCredits(body.credits ?? credits);
      setPurchases(body.purchases ?? purchases);
      notify(
        body.status === "paid"
          ? "Credits added in the mock payment provider."
          : "Payment created. Credits are granted by the verified webhook.",
      );
    } catch {
      setError("The credit service is unavailable. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mock-stack">
      <div className="mock-banner">
        <div>
          <span className="eyebrow">SERVER BILLING / CREDIT LEDGER</span>
          <strong>
            Credits are account-scoped and recorded in PostgreSQL.
          </strong>
          <p>
            Mock checkout grants credits immediately. Paystack and M-Pesa live
            checkout remain gated; verified webhooks are idempotent.
          </p>
        </div>
        <span className="badge neutral">{credits} credits</span>
      </div>
      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}
      <section className="panel mock-panel">
        <div className="section-heading">
          <div>
            <h2>AI credit packs</h2>
            <p>Generate 10 · refine 3 · verify 3.</p>
          </div>
          <label className="field mock-inline-field">
            Payment provider
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as typeof provider)}
            >
              <option value="mock">Mock</option>
              <option value="paystack">Paystack</option>
              <option value="mpesa">M-Pesa</option>
            </select>
          </label>
        </div>
        <div className="mock-plan-grid">
          {packs.map((pack) => (
            <article className="mock-plan" key={pack.id}>
              <div className="mock-plan-top">
                <span>{pack.id}</span>
              </div>
              <strong>{pack.credits}</strong>
              <p>{money(pack.amount, pack.currency)}</p>
              <button
                className="btn primary"
                disabled={busy}
                onClick={() => void buy(pack.id)}
              >
                <CreditCard size={14} /> Buy credits
              </button>
            </article>
          ))}
        </div>
      </section>
      <section className="panel mock-panel">
        <div className="section-heading">
          <div>
            <h2>Purchase history</h2>
            <p>Every purchase has a provider reference and status.</p>
          </div>
        </div>
        <div className="mock-list">
          {purchases.length ? (
            purchases.map((purchase) => (
              <div className="mock-list-row" key={purchase.id}>
                <span>
                  {purchase.pack_credits} credits
                  <small>
                    {purchase.provider} · {purchase.provider_reference}
                  </small>
                </span>
                <strong>{money(purchase.amount, purchase.currency)}</strong>
                <span className="badge neutral">{purchase.status}</span>
              </div>
            ))
          ) : (
            <p className="muted">No credit purchases yet.</p>
          )}
        </div>
        <p className="mock-note">
          <Check size={12} /> Only paid purchases create a credit-ledger entry.
        </p>
      </section>
    </div>
  );
}
