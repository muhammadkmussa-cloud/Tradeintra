"use client";

import { useEffect, useState } from "react";
import { Check, Store } from "lucide-react";

type Listing = {
  id: string;
  title: string;
  kind: string;
  price: string;
  status: string;
  seller_id: string;
};
type Purchase = {
  id: string;
  amount: string;
  status: string;
  title: string;
  kind: string;
  delivery_filename: string | null;
  delivery_asset_key: string | null;
};
type Profile = {
  display_name: string;
  kind: string;
  status: string;
  payout_method: string | null;
} | null;

const money = (value: number | string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(value),
  );

export function ServerMarketplace({
  notify,
}: {
  notify: (message: string) => void;
}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [mine, setMine] = useState<Listing[]>([]);
  const [profile, setProfile] = useState<Profile>(null);
  const [displayName, setDisplayName] = useState("My operator studio");
  const [kind, setKind] = useState<"seller" | "signal_provider" | "both">(
    "seller",
  );
  const [payoutMethod, setPayoutMethod] = useState<"mpesa" | "bank" | "crypto">(
    "mpesa",
  );
  const [title, setTitle] = useState("Operator bot template");
  const [listingKind, setListingKind] = useState<
    "bot" | "pdf" | "course" | "signal"
  >("bot");
  const [price, setPrice] = useState("19");
  const [deliveryContent, setDeliveryContent] = useState(
    '<xml><strategy name="operator" /></xml>',
  );
  const [deliveryFilename, setDeliveryFilename] = useState("operator-bot.xml");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/studio/marketplace", {
      credentials: "same-origin",
      cache: "no-store",
    });
    const body = await response.json();
    if (!response.ok)
      throw new Error(body.error ?? "Unable to load marketplace.");
    setListings(body.listings ?? []);
    setMine(body.mine ?? []);
    setPurchases(body.purchases ?? []);
  }
  useEffect(() => {
    load().catch((reason: Error) => setError(reason.message));
  }, []);

  async function act(input: Record<string, unknown>, message: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/studio/marketplace", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "The marketplace request failed.");
        return;
      }
      if (body.profile) setProfile(body.profile);
      await load();
      notify(message);
    } catch {
      setError("The marketplace service is unavailable. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mock-stack">
      <div className="mock-banner">
        <div>
          <span className="eyebrow">SERVER MARKETPLACE / 15% PLATFORM FEE</span>
          <strong>Listings and purchases are account-scoped.</strong>
          <p>
            sellers receive 85% after the refund window. Seller approval and
            payouts are reviewed manually; no payout is executed automatically.
          </p>
        </div>
        <span className="badge neutral">
          {profile?.status ?? "not applied"}
        </span>
      </div>
      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mock-two-col">
        <section className="panel mock-panel">
          <div className="section-heading">
            <div>
              <h2>Seller profile</h2>
              <p>Manual approval is required before listing.</p>
            </div>
          </div>
          <label className="field">
            Display name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <label className="field">
            Kind
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
            >
              <option value="seller">Seller</option>
              <option value="signal_provider">Signal provider</option>
              <option value="both">Both</option>
            </select>
          </label>
          <label className="field">
            Payout method
            <select
              value={payoutMethod}
              onChange={(e) =>
                setPayoutMethod(e.target.value as typeof payoutMethod)
              }
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
                { action: "apply", displayName, kind, payoutMethod },
                "Seller application submitted for review.",
              )
            }
          >
            Apply as seller
          </button>
          {profile ? (
            <p className="mock-note">
              <Check size={12} /> {profile.display_name} · {profile.status}
            </p>
          ) : null}
        </section>
        <section className="panel mock-panel">
          <div className="section-heading">
            <div>
              <h2>Create listing</h2>
              <p>Only approved sellers can publish.</p>
            </div>
          </div>
          <label className="field">
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="field">
            Kind
            <select
              value={listingKind}
              onChange={(e) =>
                setListingKind(e.target.value as typeof listingKind)
              }
            >
              <option value="bot">Bot</option>
              <option value="pdf">PDF</option>
              <option value="course">Course</option>
              <option value="signal">Signal</option>
            </select>
          </label>
          <label className="field">
            Price
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
          <button
            className="btn primary"
            disabled={busy || profile?.status !== "approved"}
            onClick={() =>
              void act(
                {
                  action: "create",
                  title,
                  kind: listingKind,
                  price: Number(price),
                  deliveryContent,
                  deliveryFilename,
                  uploadId: uploadId ?? undefined,
                },
                "Listing published in the mock marketplace.",
              )
            }
          >
            <Store size={14} /> Publish listing
          </button>
        </section>
      </div>
      <section className="panel mock-panel">
        <div className="section-heading">
          <div>
            <h2>Live listings</h2>
            <p>Buyers pay through the configured payment adapter.</p>
          </div>
        </div>
        <div className="mock-market-grid">
          {listings.length ? (
            listings.map((listing) => (
              <article className="mock-listing" key={listing.id}>
                <div className="mock-card-top">
                  <span className="badge neutral">{listing.kind}</span>
                  <span className="badge neutral">{listing.status}</span>
                </div>
                <h3>{listing.title}</h3>
                <strong>{money(listing.price)}</strong>
                <p>Seller {listing.seller_id.slice(0, 8)}</p>
                <button
                  className="btn primary"
                  disabled={busy}
                  onClick={() =>
                    void act(
                      { action: "buy", listingId: listing.id },
                      "Marketplace purchase recorded.",
                    )
                  }
                >
                  Buy
                </button>
              </article>
            ))
          ) : (
            <p className="muted">No live listings yet.</p>
          )}
        </div>
      </section>
      <section className="panel mock-panel">
        <div className="section-heading">
          <div>
            <h2>My purchases</h2>
            <p>Paid purchases expose their private delivery file.</p>
          </div>
        </div>
        <div className="mock-list">
          {purchases.length ? (
            purchases.map((purchase) => (
              <div className="mock-list-row" key={purchase.id}>
                <span>
                  {purchase.title}
                  <small>
                    {purchase.kind} · {money(purchase.amount)}
                  </small>
                </span>
                <span className="badge neutral">{purchase.status}</span>
                {purchase.delivery_asset_key && purchase.status === "paid" ? (
                  <a
                    className="text-link"
                    href={`/api/studio/marketplace/delivery?orderId=${purchase.id}`}
                  >
                    Download delivery
                  </a>
                ) : null}
                {purchase.status === "paid" ? (
                  <button
                    className="text-link danger"
                    disabled={busy}
                    onClick={() =>
                      void act(
                        { action: "refund", orderId: purchase.id },
                        "Purchase refunded and seller earnings reversed.",
                      )
                    }
                  >
                    Refund
                  </button>
                ) : null}
              </div>
            ))
          ) : (
            <p className="muted">No purchases yet.</p>
          )}
        </div>
      </section>
      <section className="panel mock-panel">
        <div className="section-heading">
          <div>
            <h2>My listings</h2>
            <p>Your seller inventory.</p>
          </div>
        </div>
        <div className="mock-list">
          {mine.length ? (
            mine.map((listing) => (
              <div className="mock-list-row" key={listing.id}>
                <span>
                  {listing.title}
                  <small>{listing.kind}</small>
                </span>
                <strong>{money(listing.price)}</strong>
                <span className="badge neutral">{listing.status}</span>
              </div>
            ))
          ) : (
            <p className="muted">No listings yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
