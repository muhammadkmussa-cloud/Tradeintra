"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Globe2,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

type Domain = {
  id: string;
  name: string;
  mode: "purchased" | "connected";
  status: string;
  ssl_status: string;
  expires_at: string;
  auto_renew: boolean;
  site_id: string | null;
};
type Order = {
  id: string;
  domain: string;
  years: number;
  final_price: string;
  provider: string;
  status: string;
};
type Result = {
  name: string;
  available: boolean;
  registrationPrice: number;
  renewalPrice: number;
  currency: string;
  premium: boolean;
};
type SiteRef = { id: string; name: string };

const money = (value: number | string, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    Number(value),
  );
const date = (value: string) => new Date(value).toLocaleDateString();

export function ServerDomains({
  sites,
  notify,
}: {
  sites: SiteRef[];
  notify: (message: string) => void;
}) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [query, setQuery] = useState("operator");
  const [siteId, setSiteId] = useState(sites[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/studio/domains", {
      credentials: "same-origin",
      cache: "no-store",
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Unable to load domains.");
    setDomains(body.domains ?? []);
    setOrders(body.orders ?? []);
  }

  useEffect(() => {
    load().catch((reason: Error) => setError(reason.message));
  }, []);

  async function act(input: Record<string, unknown>, message: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/studio/domains", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "The domain request failed.");
        return false;
      }
      if (body.domains) setDomains(body.domains);
      if (body.orders) setOrders(body.orders);
      if (body.results) setResults(body.results);
      notify(message);
      return true;
    } catch {
      setError("The domain service is unavailable. Try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mock-stack">
      <div className="mock-banner">
        <div>
          <span className="eyebrow">SERVER DOMAIN DESK / NAMECHEAP MOCK</span>
          <strong>
            Domain lifecycle is account-scoped and database-backed.
          </strong>
          <p>
            Search, purchase, connect, verify, renew, and remove domains. Live
            Namecheap calls remain gated; this environment records mock orders
            and requires DNS/SSL verification before a domain becomes active.
          </p>
        </div>
        <span className="badge neutral">mock provider</span>
      </div>
      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="panel mock-panel">
        <div className="section-heading">
          <div>
            <h2>Search and buy</h2>
            <p>Registrar cost plus 15% platform markup.</p>
          </div>
        </div>
        <form
          className="mock-inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            void act(
              { action: "search", query },
              "Domain availability searched.",
            );
          }}
        >
          <label className="field mock-grow">
            Search a domain
            <input value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <button className="btn primary" type="submit" disabled={busy}>
            <Search size={15} /> Search
          </button>
        </form>
        <div className="mock-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Domain</th>
                <th>Availability</th>
                <th>Registration</th>
                <th>Renewal</th>
                <th>Site</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.name}>
                  <td>{result.name}</td>
                  <td>
                    <span
                      className={`badge ${result.available ? "green" : "neutral"}`}
                    >
                      {result.available ? "available" : "taken"}
                    </span>
                  </td>
                  <td>{money(result.registrationPrice, result.currency)}</td>
                  <td>{money(result.renewalPrice, result.currency)}</td>
                  <td>
                    <select
                      value={siteId}
                      onChange={(e) => setSiteId(e.target.value)}
                    >
                      {sites.map((site) => (
                        <option key={site.id} value={site.id}>
                          {site.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className="btn"
                      disabled={!result.available || !siteId || busy}
                      onClick={() =>
                        void act(
                          {
                            action: "buy",
                            name: result.name,
                            siteId,
                            years: 1,
                            idempotencyKey: crypto.randomUUID(),
                          },
                          `${result.name} purchased in the mock provider.`,
                        )
                      }
                    >
                      Buy domain <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel mock-panel">
        <div className="section-heading">
          <div>
            <h2>Your domains</h2>
            <p>DNS pending → SSL pending → active.</p>
          </div>
          <span className="badge neutral">{domains.length} domains</span>
        </div>
        <div className="mock-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Domain</th>
                <th>Mode</th>
                <th>Status</th>
                <th>SSL</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {domains.length ? (
                domains.map((domain) => (
                  <tr key={domain.id}>
                    <td>{domain.name}</td>
                    <td>{domain.mode}</td>
                    <td>
                      <span className="badge neutral">
                        {domain.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td>
                      <span className="badge neutral">{domain.ssl_status}</span>
                    </td>
                    <td>{date(domain.expires_at)}</td>
                    <td>
                      <div className="mock-actions">
                        {domain.status !== "active" ? (
                          <button
                            className="text-link"
                            disabled={busy}
                            onClick={() =>
                              void act(
                                { action: "verify", domainId: domain.id },
                                "Mock DNS/SSL advanced.",
                              )
                            }
                          >
                            <RefreshCw size={13} /> Verify
                          </button>
                        ) : null}
                        <button
                          className="text-link"
                          disabled={busy}
                          onClick={() =>
                            void act(
                              {
                                action: "renew",
                                domainId: domain.id,
                                years: 1,
                              },
                              "Mock domain renewed.",
                            )
                          }
                        >
                          Renew
                        </button>
                        <button
                          className="text-link danger"
                          disabled={busy}
                          onClick={() =>
                            void act(
                              { action: "remove", domainId: domain.id },
                              "Mock domain removed.",
                            )
                          }
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>No domains yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel mock-panel">
        <div className="section-heading">
          <div>
            <h2>Connect an existing domain</h2>
            <p>Attach a domain you already own.</p>
          </div>
        </div>
        <form
          className="mock-inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const name = String(form.get("domain") ?? "");
            void act(
              { action: "connect", name, siteId },
              "Domain connected to the mock verifier.",
            );
          }}
        >
          <label className="field mock-grow">
            Domain
            <input name="domain" placeholder="operator.example" required />
          </label>
          <button
            className="btn primary"
            type="submit"
            disabled={!siteId || busy}
          >
            <Globe2 size={15} /> Connect
          </button>
        </form>
      </section>

      <section className="panel mock-panel">
        <div className="section-heading">
          <div>
            <h2>Domain orders</h2>
            <p>Idempotent mock order ledger.</p>
          </div>
        </div>
        <div className="mock-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Domain</th>
                <th>Years</th>
                <th>Price</th>
                <th>Provider</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length ? (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.domain}</td>
                    <td>{order.years}</td>
                    <td>{money(order.final_price)}</td>
                    <td>{order.provider}</td>
                    <td>
                      <span className="badge neutral">{order.status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>No mock orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mock-note">
        <Check size={12} /> DNS and SSL are verified in the mock state before a
        domain becomes active. Live Namecheap behavior remains unverified.
      </p>
    </div>
  );
}
