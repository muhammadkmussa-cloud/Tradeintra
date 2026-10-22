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
  dns_verified: boolean;
  verification_token: string | null;
  verification_error: string | null;
};
type Transfer = {
  id: string;
  direction: "in" | "out";
  domain_name: string;
  status: string;
  note: string | null;
  created_at: string;
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
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [transferDirection, setTransferDirection] = useState<"in" | "out">(
    "in",
  );
  const [transferName, setTransferName] = useState("");
  const [transferAuthCode, setTransferAuthCode] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [kesRate, setKesRate] = useState(130);
  const [query, setQuery] = useState("operator");
  const [siteId, setSiteId] = useState(sites[0]?.id ?? "");
  const [contact, setContact] = useState({
    firstName: "",
    lastName: "",
    address1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "KE",
    phone: "",
    email: "",
  });
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
      if (body.transfers) setTransfers(body.transfers);
      if (body.kesRate) setKesRate(Number(body.kesRate));
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
            Namecheap purchases remain gated; purchases are mocked in this
            environment. Custom domains require a DNS TXT check and a trusted
            TLS certificate before activation.
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
                  <td>
                    {money(result.registrationPrice, result.currency)}
                    {result.currency === "USD" ? (
                      <small>
                        ≈ {money(result.registrationPrice * kesRate, "KES")}
                      </small>
                    ) : null}
                  </td>
                  <td>
                    {money(result.renewalPrice, result.currency)}
                    {result.currency === "USD" ? (
                      <small>
                        ≈ {money(result.renewalPrice * kesRate, "KES")}
                      </small>
                    ) : null}
                  </td>
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
                            expectedPrice: result.registrationPrice,
                            idempotencyKey: crypto.randomUUID(),
                            ...(Object.values(contact).every((value) =>
                              value.trim(),
                            )
                              ? { contact }
                              : {}),
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
                    <td>
                      {domain.name}
                      {domain.status === "dns_pending" &&
                      domain.verification_token ? (
                        <small>
                          TXT _tradeintra.{domain.name} ={" "}
                          {domain.verification_token}
                        </small>
                      ) : null}
                      {domain.verification_error ? (
                        <small>{domain.verification_error}</small>
                      ) : null}
                    </td>
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
                                "Domain verification passed.",
                              )
                            }
                          >
                            <RefreshCw size={13} /> Verify DNS/SSL
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
            <h2>Transfer requests</h2>
            <p>Manual registrar queue for transfer-in and transfer-out.</p>
          </div>
        </div>
        <div className="mock-inline-form">
          <label className="field">
            Direction
            <select
              value={transferDirection}
              onChange={(e) =>
                setTransferDirection(e.target.value as "in" | "out")
              }
            >
              <option value="in">Transfer in</option>
              <option value="out">Transfer out</option>
            </select>
          </label>
          <label className="field mock-grow">
            Domain
            <input
              value={transferName}
              onChange={(e) => setTransferName(e.target.value)}
              placeholder="operator.example"
            />
          </label>
          <label className="field mock-grow">
            Auth / EPP code
            <input
              type="password"
              value={transferAuthCode}
              onChange={(e) => setTransferAuthCode(e.target.value)}
              placeholder="Stored encrypted"
            />
          </label>
          <label className="field mock-grow">
            Note
            <input
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
            />
          </label>
          <button
            className="btn primary"
            disabled={busy || !transferName}
            onClick={async () => {
              if (
                await act(
                  {
                    action: "transfer",
                    direction: transferDirection,
                    name: transferName,
                    authCode: transferAuthCode,
                    note: transferNote,
                  },
                  "Transfer request queued for manual review.",
                )
              ) {
                setTransferName("");
                setTransferAuthCode("");
                setTransferNote("");
              }
            }}
          >
            Request transfer
          </button>
        </div>
        <div className="mock-list">
          {transfers.length ? (
            transfers.map((transfer) => (
              <div className="mock-list-row" key={transfer.id}>
                <span>
                  {transfer.domain_name}
                  <small>
                    {transfer.direction} ·{" "}
                    {new Date(transfer.created_at).toLocaleDateString()}
                  </small>
                </span>
                <span className="badge neutral">{transfer.status}</span>
              </div>
            ))
          ) : (
            <p className="muted">No transfer requests yet.</p>
          )}
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
