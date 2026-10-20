"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  Check,
  Copy,
  Globe2,
  Mail,
  Megaphone,
  Radio,
  RefreshCw,
  Search,
  Ticket,
  Trash2,
} from "lucide-react";
import {
  MOCK_OPS_KEY,
  MOCK_PLANS,
  availableCredits,
  addAsset,
  addHostMapping,
  advanceDomain,
  createBackup,
  assignBot,
  buyCredits,
  buyDomain,
  buyListing,
  cancelDeletion,
  cancelSubscription,
  changePlan,
  closeTicket,
  connectDomain,
  createAnnouncement,
  createBot,
  createListing,
  createSignal,
  createTicket,
  deliverSignal,
  enqueueJob,
  initialMockState,
  normalizeMockHostname,
  publishAnnouncement,
  readMockState,
  removeDomain,
  renewDomain,
  replyTicket,
  requestDeletion,
  requestPayout,
  restoreBackup,
  resumeSubscription,
  runJobs,
  searchDomains,
  sendEmail,
  setAutoRenew,
  setDomainMarkup,
  setHostStatus,
  setSignalStatus,
  spendCredits,
  toggleTwoFactor,
  validateBot,
  verifyEmail,
  type MockDomain,
  type MockSiteRef,
  type MockState,
  type MockTicket,
} from "@/lib/mock-ops";

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );
const date = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
const statusTone = (status: string) =>
  [
    "active",
    "succeeded",
    "available",
    "published",
    "validated",
    "sent",
    "paid",
  ].includes(status)
    ? "green"
    : ["failed", "expired", "cancelled", "suspended", "timed_out"].includes(
          status,
        )
      ? "danger"
      : "neutral";

function Badge({ status }: { status: string }) {
  const label = String(status ?? "unknown");
  return (
    <span className={`badge ${statusTone(label)}`}>
      {label.replaceAll("_", " ")}
    </span>
  );
}

function Panel({
  title,
  detail,
  children,
  action,
}: {
  title: string;
  detail?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="panel mock-panel">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          {detail ? <p>{detail}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function MockOpsPage({
  page,
  sites,
  notify,
}: {
  page: string;
  sites: MockSiteRef[];
  notify: (message: string) => void;
}) {
  const [state, setState] = useState<MockState>(() => initialMockState());
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("aurora");
  const [results, setResults] = useState(searchDomains("aurora"));
  const [connectName, setConnectName] = useState("operator.example");
  const [hostName, setHostName] = useState("operator.example");
  const [hostSite, setHostSite] = useState(sites[0]?.id ?? "");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] =
    useState<MockTicket["category"]>("site");
  const [ticketBody, setTicketBody] = useState("");
  const [reply, setReply] = useState<Record<string, string>>({});
  const [botName, setBotName] = useState("Momentum starter");
  const [botXml, setBotXml] = useState(
    '<xml><strategy name="momentum" /></xml>',
  );
  const [botSites, setBotSites] = useState<Record<string, string>>({});
  const [prompt, setPrompt] = useState(
    "A cautious volatility breakout with a fixed stake and stop loss.",
  );
  const [signalName, setSignalName] = useState("Operator momentum");
  const [signalInterval, setSignalInterval] = useState("5m");
  const [telegram, setTelegram] = useState("@mock_operator");
  const [listingTitle, setListingTitle] = useState("Risk-first bot template");
  const [listingKind, setListingKind] = useState<
    "bot" | "pdf" | "course" | "signal"
  >("bot");
  const [listingPrice, setListingPrice] = useState("19");
  const [payoutAmount, setPayoutAmount] = useState("20");
  const [payoutMethod, setPayoutMethod] = useState<"mpesa" | "bank" | "crypto">(
    "mpesa",
  );
  const [announcementTitle, setAnnouncementTitle] =
    useState("Maintenance window");
  const [announcementBody, setAnnouncementBody] = useState(
    "A short mock notice for the selected tenant.",
  );
  const [announcementTarget, setAnnouncementTarget] = useState("all");
  const [markup, setMarkup] = useState("15");
  const [mailTo, setMailTo] = useState("operator@example.test");

  useEffect(() => {
    try {
      setState(readMockState(localStorage.getItem(MOCK_OPS_KEY)));
    } catch {
      setState(initialMockState());
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(MOCK_OPS_KEY, JSON.stringify(state));
    } catch {
      notify(
        "Mock storage is unavailable or full. Export and reset the fixture.",
      );
    }
  }, [state, ready, notify]);

  useEffect(() => {
    setMarkup(String(state.domainMarkupPercent));
  }, [state.domainMarkupPercent]);

  const commit = (next: MockState, message?: string) => {
    setState(next);
    if (message) notify(message);
  };

  const plan = MOCK_PLANS.find((p) => p.id === state.planId) ?? MOCK_PLANS[0];
  const connectHost = normalizeMockHostname(connectName);
  const connectTaken = Boolean(
    connectHost && state.domains.some((domain) => domain.name === connectHost),
  );
  const mappingHost = normalizeMockHostname(hostName);
  const mappingTaken = Boolean(
    mappingHost &&
    state.hostMappings.some((mapping) => mapping.hostname === mappingHost),
  );
  const creditsAvailable = availableCredits(state);
  const siteName = (siteId?: string) =>
    sites.find((s) => s.id === siteId)?.name ?? "No site";

  const header = (
    <div className="mock-banner">
      <div>
        <span className="eyebrow">DEVELOPMENT MOCK / NO EXTERNAL CALLS</span>
        <strong>Every action writes browser-local fixtures only.</strong>
        <p>
          No Namecheap, payment, Telegram, Deriv, SMTP, or AI provider is
          contacted. This surface is hidden in production builds unless
          explicitly enabled.
        </p>
      </div>
      <Badge status="dev only" />
    </div>
  );

  if (page === "Domains") {
    return (
      <div className="mock-stack">
        {header}
        <Panel
          title="Domain search"
          detail="Fixture pricing with availability, premium, and alternatives."
          action={<Badge status="namecheap mock" />}
        >
          <form
            className="mock-inline-form"
            onSubmit={(event) => {
              event.preventDefault();
              setResults(
                searchDomains(
                  query,
                  state.domains.map((domain) => domain.name),
                ),
              );
              notify("Domain availability searched against local fixtures.");
            }}
          >
            <label className="field mock-grow">
              Search a domain
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="operator.com"
              />
            </label>
            <button className="btn primary" type="submit">
              <Search size={15} /> Search
            </button>
          </form>
          <div className="mock-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Available</th>
                  <th>Registration</th>
                  <th>Renewal</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.name}>
                    <td>
                      {result.name}
                      {result.premium ? (
                        <span className="mock-tag">premium</span>
                      ) : null}
                    </td>
                    <td>
                      <Badge
                        status={result.available ? "available" : "taken"}
                      />
                    </td>
                    <td>{money(result.registrationPrice)}</td>
                    <td>{money(result.renewalPrice)}</td>
                    <td>
                      <button
                        className="btn"
                        disabled={!result.available}
                        onClick={() =>
                          commit(
                            buyDomain(state, result.name, 1),
                            `${result.name} registered in the mock provider.`,
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
        </Panel>

        <Panel
          title="Owned domains"
          detail="Draft-free mock lifecycle: DNS pending → SSL pending → active."
        >
          <div className="mock-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>SSL</th>
                  <th>Expires</th>
                  <th>Auto-renew</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.domains.map((domain) => (
                  <tr key={domain.id}>
                    <td>
                      {domain.name}
                      <small className="mock-sub">
                        {siteName(domain.siteId)}
                      </small>
                    </td>
                    <td>{domain.mode}</td>
                    <td>
                      <Badge status={domain.status} />
                    </td>
                    <td>
                      <Badge status={domain.ssl} />
                    </td>
                    <td>{date(domain.expiresAt)}</td>
                    <td>
                      <button
                        className="mock-toggle"
                        aria-label={`Auto-renew ${domain.name}`}
                        aria-pressed={domain.autoRenew}
                        onClick={() =>
                          setState(
                            setAutoRenew(state, domain.id, !domain.autoRenew),
                          )
                        }
                      >
                        {domain.autoRenew ? "On" : "Off"}
                      </button>
                    </td>
                    <td>
                      <div className="mock-actions">
                        {domain.status !== "active" ? (
                          <button
                            className="text-link"
                            aria-label={`Verify ${domain.name}`}
                            onClick={() =>
                              commit(
                                advanceDomain(state, domain.id),
                                "Mock DNS/SSL advanced.",
                              )
                            }
                          >
                            <RefreshCw size={13} /> Verify
                          </button>
                        ) : null}
                        <button
                          className="text-link"
                          aria-label={`Renew ${domain.name}`}
                          onClick={() =>
                            commit(
                              renewDomain(state, domain.id),
                              "Mock renewal completed.",
                            )
                          }
                        >
                          Renew
                        </button>
                        <button
                          className="text-link danger"
                          aria-label={`Remove ${domain.name}`}
                          onClick={() =>
                            commit(
                              removeDomain(state, domain.id),
                              "Mock domain removed.",
                            )
                          }
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="mock-two-col">
          <Panel
            title="Connect an existing domain"
            detail="Shows the required DNS records without contacting a registrar."
          >
            <label className="field">
              Domain
              <input
                value={connectName}
                onChange={(e) => setConnectName(e.target.value)}
              />
            </label>
            <div className="mock-record">
              <span>A</span>
              <code>203.0.113.10</code>
              <button
                className="icon-btn"
                aria-label="Copy mock A record"
                onClick={async () => {
                  if (!navigator.clipboard?.writeText) {
                    notify(
                      "Clipboard unavailable; mock A record is 203.0.113.10.",
                    );
                    return;
                  }
                  try {
                    await navigator.clipboard.writeText("203.0.113.10");
                    notify("Mock A record copied.");
                  } catch {
                    notify(
                      "Clipboard unavailable; mock A record is 203.0.113.10.",
                    );
                  }
                }}
              >
                <Copy size={14} />
              </button>
            </div>
            <div className="mock-record">
              <span>CNAME</span>
              <code>edge.mock.tradeintra.test</code>
            </div>
            <button
              className="btn primary"
              disabled={!connectHost || connectTaken}
              onClick={() =>
                commit(
                  connectDomain(state, connectHost ?? "", sites[0]?.id),
                  "External domain connected to the mock verifier.",
                )
              }
            >
              Connect domain
            </button>
          </Panel>
          <Panel
            title="Custom host mapping"
            detail="Activate or suspend a canonical custom hostname."
          >
            <label className="field">
              Hostname
              <input
                value={hostName}
                onChange={(e) => setHostName(e.target.value.toLowerCase())}
              />
            </label>
            <label className="field">
              Site
              <select
                value={hostSite}
                onChange={(e) => setHostSite(e.target.value)}
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="btn primary"
              disabled={!mappingHost || mappingTaken || !hostSite}
              onClick={() =>
                commit(
                  addHostMapping(state, mappingHost ?? "", hostSite),
                  "Custom host activated in the mock mapping table.",
                )
              }
            >
              Activate mapping
            </button>
            <div className="mock-list">
              {state.hostMappings.map((mapping) => (
                <div className="mock-list-row" key={mapping.id}>
                  <span>
                    <Globe2 size={14} /> {mapping.hostname}
                    <small>{siteName(mapping.siteId)}</small>
                  </span>
                  <Badge status={mapping.status} />
                  <button
                    className="text-link"
                    onClick={() =>
                      setState(
                        setHostStatus(
                          state,
                          mapping.id,
                          mapping.status === "active" ? "suspended" : "active",
                        ),
                      )
                    }
                  >
                    {mapping.status === "active" ? "Suspend" : "Activate"}
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="Domain orders" detail="Idempotent mock order ledger.">
          <div className="mock-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Years</th>
                  <th>Quote</th>
                  <th>Provider</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {state.orders.length ? (
                  state.orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.domain}</td>
                      <td>{order.years}</td>
                      <td>{money(order.finalPrice)}</td>
                      <td>{order.provider}</td>
                      <td>
                        <Badge status={order.status} />
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
        </Panel>
      </div>
    );
  }

  if (page === "Billing") {
    return (
      <div className="mock-stack">
        {header}
        <div className="mock-plan-grid">
          {MOCK_PLANS.map((option) => (
            <section
              className={`mock-plan ${option.id === state.planId ? "current" : ""}`}
              key={option.id}
            >
              <div className="mock-plan-top">
                <span>{option.name}</span>
                {option.id === state.planId ? <Badge status="current" /> : null}
              </div>
              <strong>
                {option.price ? `${money(option.price)}/mo` : "Free"}
              </strong>
              <ul>
                {option.features.map((feature) => (
                  <li key={feature}>
                    <Check size={14} />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`btn ${option.id === state.planId ? "" : "primary"}`}
                disabled={option.id === state.planId}
                onClick={() =>
                  commit(
                    changePlan(state, option.id),
                    `${option.name} plan selected in the mock billing provider.`,
                  )
                }
              >
                {option.id === state.planId ? "Current plan" : "Switch plan"}
              </button>
            </section>
          ))}
        </div>

        <div className="mock-two-col">
          <Panel
            title="Subscription"
            detail="Mock provider state; no payment is taken."
          >
            <div className="mock-kv">
              <span>Status</span>
              <Badge status={state.subscription} />
            </div>
            <div className="mock-kv">
              <span>Renews</span>
              <strong>{date(state.renewsAt)}</strong>
            </div>
            <div className="mock-kv">
              <span>Cancels at period end</span>
              <strong>{state.cancelAtPeriodEnd ? "Yes" : "No"}</strong>
            </div>
            <div className="mock-actions">
              {state.cancelAtPeriodEnd ? (
                <button
                  className="btn primary"
                  onClick={() =>
                    commit(
                      resumeSubscription(state),
                      "Mock subscription resumed.",
                    )
                  }
                >
                  Resume
                </button>
              ) : (
                <button
                  className="btn"
                  onClick={() =>
                    commit(
                      cancelSubscription(state),
                      "Mock subscription will cancel at period end.",
                    )
                  }
                >
                  Cancel at period end
                </button>
              )}
            </div>
          </Panel>
          <Panel
            title="AI credits"
            detail="Credit ledger with mock pack purchase."
            action={<Badge status={`${state.credits} credits`} />}
          >
            <div className="mock-credit-balance">
              {state.credits}
              <small>credits available</small>
            </div>
            <div className="mock-actions">
              {[
                { amount: 30, price: 4.99 },
                { amount: 65, price: 9.99 },
                { amount: 150, price: 19.99 },
              ].map((pack) => (
                <button
                  className="btn"
                  key={pack.amount}
                  onClick={() =>
                    commit(
                      buyCredits(state, pack.amount, pack.price),
                      `${pack.amount} mock credits added.`,
                    )
                  }
                >
                  +{pack.amount} · {money(pack.price)}
                </button>
              ))}
            </div>
            <div className="mock-list">
              {state.creditLedger.slice(0, 6).map((entry) => (
                <div className="mock-list-row" key={entry.id}>
                  <span>
                    {entry.reason}
                    <small>{date(entry.at)}</small>
                  </span>
                  <strong>
                    {entry.delta > 0 ? "+" : ""}
                    {entry.delta}
                  </strong>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel
          title="Entitlements"
          detail="Mock plan limits used by this development workspace."
        >
          <div className="mock-entitlements">
            <div>
              <span>Sites</span>
              <strong>{plan.limits.sites}</strong>
            </div>
            <div>
              <span>Domains</span>
              <strong>{plan.limits.domains}</strong>
            </div>
            <div>
              <span>Storage</span>
              <strong>{plan.limits.storageMb} MB</strong>
            </div>
            <div>
              <span>AI credits included</span>
              <strong>{plan.limits.aiCredits}</strong>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  if (page === "XML Bots") {
    return (
      <div className="mock-stack">
        {header}
        <div className="mock-two-col">
          <Panel
            title="Upload a bot"
            detail="Accepts XML text or a local file; no file leaves the browser."
          >
            <label className="field">
              Name
              <input
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
              />
            </label>
            <label className="field">
              XML
              <textarea
                rows={6}
                value={botXml}
                onChange={(e) => setBotXml(e.target.value)}
              />
            </label>
            <label className="field">
              Load local file
              <input
                type="file"
                accept=".xml,text/xml"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setBotName(file.name.replace(/\.xml$/i, ""));
                    setBotXml(await file.text());
                  }
                }}
              />
            </label>
            <button
              className="btn primary"
              onClick={() =>
                commit(
                  createBot(state, botName, botXml),
                  "Mock bot stored in browser state.",
                )
              }
            >
              Store bot
            </button>
          </Panel>
          <Panel
            title="Bot library"
            detail="Validate, assign, and inspect DBot compatibility labels."
          >
            <div className="mock-list">
              {state.bots.map((bot) => (
                <div className="mock-card" key={bot.id}>
                  <div className="mock-card-top">
                    <strong>
                      <Bot size={15} /> {bot.name}
                    </strong>
                    <Badge status={bot.status} />
                  </div>
                  <p>
                    {bot.compatibility} · {siteName(bot.siteId)}
                  </p>
                  <div className="mock-actions">
                    <button
                      className="text-link"
                      onClick={() =>
                        commit(
                          validateBot(state, bot.id),
                          "Mock XML validation completed.",
                        )
                      }
                    >
                      Validate
                    </button>
                    <label className="field mock-inline-field">
                      Assign to site
                      <select
                        value={
                          botSites[bot.id] ?? bot.siteId ?? sites[0]?.id ?? ""
                        }
                        onChange={(event) =>
                          setBotSites((current) => ({
                            ...current,
                            [bot.id]: event.target.value,
                          }))
                        }
                      >
                        {sites.map((site) => (
                          <option key={site.id} value={site.id}>
                            {site.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="text-link"
                      onClick={() =>
                        commit(
                          assignBot(
                            state,
                            bot.id,
                            botSites[bot.id] ??
                              bot.siteId ??
                              sites[0]?.id ??
                              "",
                          ),
                          "Mock bot assigned to site.",
                        )
                      }
                    >
                      Assign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  if (page === "AI Bot Generator") {
    return (
      <div className="mock-stack">
        {header}
        <Panel
          title="AI bot generator"
          detail="Mock generation job. Costs 10 credits; no AI provider is called."
          action={<Badge status={`${state.credits} credits`} />}
        >
          <label className="field">
            Strategy prompt
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </label>
          <div className="mock-actions">
            <button
              className="btn primary"
              disabled={state.credits < 10}
              onClick={() => {
                const next = createBot(
                  spendCredits(state, 10, "AI bot generation · mock"),
                  "Generated strategy",
                  '<xml><strategy name="generated" /><tradeintra>true</tradeintra></xml>',
                );
                commit(next, "Generated a mock bot. 10 credits spent.");
              }}
            >
              Generate · 10 credits
            </button>
            <span className="mock-note">
              Insufficient credits blocks generation in the fixture.
            </span>
          </div>
          <div className="mock-list">
            {state.bots
              .filter((bot) => bot.name === "Generated strategy")
              .map((bot) => (
                <div className="mock-card" key={bot.id}>
                  <div className="mock-card-top">
                    <strong>{bot.name}</strong>
                    <Badge status={bot.compatibility} />
                  </div>
                  <code className="mock-code">{bot.xml}</code>
                </div>
              ))}
          </div>
        </Panel>
        <Panel
          title="Generation jobs"
          detail="Jobs are completed synchronously in this mock."
        >
          <div className="mock-list">
            {state.creditLedger
              .filter((entry) => entry.reason.includes("AI bot"))
              .map((entry) => (
                <div className="mock-list-row" key={entry.id}>
                  <span>
                    {entry.reason}
                    <small>{date(entry.at)}</small>
                  </span>
                  <strong>{entry.delta}</strong>
                </div>
              ))}
          </div>
        </Panel>
      </div>
    );
  }

  if (page === "AI Signals") {
    return (
      <div className="mock-stack">
        {header}
        <div className="mock-two-col">
          <Panel
            title="Create signal order"
            detail="Trial first; no Telegram message is sent."
          >
            <label className="field">
              Strategy name
              <input
                value={signalName}
                onChange={(e) => setSignalName(e.target.value)}
              />
            </label>
            <label className="field">
              Interval
              <input
                value={signalInterval}
                onChange={(e) => setSignalInterval(e.target.value)}
              />
            </label>
            <label className="field">
              Telegram channel
              <input
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
              />
            </label>
            <button
              className="btn primary"
              onClick={() =>
                commit(
                  createSignal(state, signalName, signalInterval, telegram),
                  "Mock signal trial created.",
                )
              }
            >
              Start 24h trial
            </button>
          </Panel>
          <Panel
            title="Signal orders"
            detail="Pause, cancel, or simulate a delivery."
          >
            <div className="mock-list">
              {state.signals.length ? (
                state.signals.map((signal) => (
                  <div className="mock-card" key={signal.id}>
                    <div className="mock-card-top">
                      <strong>
                        <Radio size={15} /> {signal.name}
                      </strong>
                      <Badge status={signal.status} />
                    </div>
                    <p>
                      {signal.interval} · {signal.telegram} · trial ends{" "}
                      {date(signal.trialEndsAt)}
                    </p>
                    <div className="mock-actions">
                      {["trial", "active", "paused"].includes(signal.status) ? (
                        <button
                          className="text-link"
                          onClick={() =>
                            commit(
                              deliverSignal(state, signal.id),
                              "Mock signal delivered.",
                            )
                          }
                        >
                          Deliver now
                        </button>
                      ) : null}
                      {["trial", "active", "paused"].includes(signal.status) ? (
                        <button
                          className="text-link"
                          onClick={() =>
                            setState(
                              setSignalStatus(
                                state,
                                signal.id,
                                signal.status === "paused"
                                  ? "active"
                                  : "paused",
                              ),
                            )
                          }
                        >
                          {signal.status === "paused" ? "Resume" : "Pause"}
                        </button>
                      ) : null}
                      {!["cancelled", "expired"].includes(signal.status) ? (
                        <button
                          className="text-link danger"
                          onClick={() =>
                            setState(
                              setSignalStatus(state, signal.id, "cancelled"),
                            )
                          }
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                    <div className="mock-deliveries">
                      {signal.deliveries.map((delivery, index) => (
                        <div key={`${delivery.at}-${index}`}>
                          <Badge status={delivery.status} />
                          <span>{delivery.message}</span>
                          <small>{date(delivery.at)}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted">No signal orders yet.</p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  if (page === "Marketplace") {
    return (
      <div className="mock-stack">
        {header}
        <Panel
          title="Marketplace"
          detail="Buy or list a mock bot, PDF, course, or signal."
        >
          <div className="mock-market-grid">
            {state.listings.map((listing) => (
              <article className="mock-listing" key={listing.id}>
                <div className="mock-card-top">
                  <Badge status={listing.kind} />
                  <Badge status={listing.status} />
                </div>
                <h3>{listing.title}</h3>
                <p>{listing.seller}</p>
                <strong>{money(listing.price)}</strong>
                <button
                  className="btn primary"
                  disabled={listing.status === "sold"}
                  onClick={() =>
                    commit(
                      buyListing(state, listing.id),
                      "Mock marketplace purchase recorded.",
                    )
                  }
                >
                  {listing.status === "sold" ? "Sold" : "Buy mock"}
                </button>
              </article>
            ))}
          </div>
        </Panel>
        <Panel
          title="List an item"
          detail="Seller identity, tax, and payout review are represented as mock states."
        >
          <div className="mock-inline-form">
            <label className="field mock-grow">
              Title
              <input
                value={listingTitle}
                onChange={(e) => setListingTitle(e.target.value)}
              />
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
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
              />
            </label>
            <button
              className="btn"
              onClick={() =>
                commit(
                  createListing(
                    state,
                    listingTitle,
                    listingKind,
                    Math.max(0, Number(listingPrice) || 0),
                  ),
                  "Mock listing published.",
                )
              }
            >
              Publish listing
            </button>
          </div>
        </Panel>
      </div>
    );
  }

  if (page === "Earnings") {
    return (
      <div className="mock-stack">
        {header}
        <div className="mock-metrics">
          <div>
            <span>Available</span>
            <strong>{money(creditsAvailable)}</strong>
          </div>
          <div>
            <span>Pending</span>
            <strong>
              {money(
                state.earnings
                  .filter((e) => e.status === "pending")
                  .reduce((s, e) => s + e.amount, 0),
              )}
            </strong>
          </div>
          <div>
            <span>Paid</span>
            <strong>
              {money(
                state.earnings
                  .filter((e) => e.status === "paid")
                  .reduce((s, e) => s + e.amount, 0),
              )}
            </strong>
          </div>
          <div>
            <span>Payout requests</span>
            <strong>{state.payouts.length}</strong>
          </div>
        </div>
        <div className="mock-two-col">
          <Panel
            title="Earnings ledger"
            detail="Separate streams, never one unexplained balance."
          >
            <div className="mock-list">
              {state.earnings.map((entry) => (
                <div className="mock-list-row" key={entry.id}>
                  <span>
                    {entry.note}
                    <small>
                      {entry.source} · {date(entry.createdAt)}
                    </small>
                  </span>
                  <strong>{money(entry.amount)}</strong>
                  <Badge status={entry.status} />
                </div>
              ))}
            </div>
          </Panel>
          <Panel
            title="Request payout"
            detail="No payout is executed; Finance review is mocked."
          >
            <label className="field">
              Amount
              <input
                type="number"
                min="0"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
              />
            </label>
            <label className="field">
              Method
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
              onClick={() =>
                commit(
                  requestPayout(
                    state,
                    Math.max(0, Number(payoutAmount) || 0),
                    payoutMethod,
                  ),
                  "Mock payout requested for finance review.",
                )
              }
            >
              Request payout
            </button>
            <div className="mock-list">
              {state.payouts.map((payout) => (
                <div className="mock-list-row" key={payout.id}>
                  <span>
                    {payout.method}
                    <small>{date(payout.createdAt)}</small>
                  </span>
                  <strong>{money(payout.amount)}</strong>
                  <Badge status={payout.status} />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  if (page === "Support") {
    return (
      <div className="mock-stack">
        {header}
        <div className="mock-two-col">
          <Panel
            title="Open a support ticket"
            detail="Mock support queue; no message is sent."
          >
            <label className="field">
              Subject
              <input
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
              />
            </label>
            <label className="field">
              Category
              <select
                value={ticketCategory}
                onChange={(e) =>
                  setTicketCategory(e.target.value as MockTicket["category"])
                }
              >
                <option value="account">Account</option>
                <option value="domain">Domain</option>
                <option value="site">Site</option>
                <option value="billing">Billing</option>
                <option value="abuse">Abuse</option>
              </select>
            </label>
            <label className="field">
              Message
              <textarea
                rows={4}
                value={ticketBody}
                onChange={(e) => setTicketBody(e.target.value)}
              />
            </label>
            <button
              className="btn primary"
              onClick={() => {
                commit(
                  createTicket(
                    state,
                    ticketSubject,
                    ticketCategory,
                    ticketBody,
                  ),
                  "Mock support ticket created.",
                );
                setTicketSubject("");
                setTicketBody("");
              }}
            >
              Create ticket
            </button>
          </Panel>
          <Panel title="Tickets" detail="Reply as support or close the ticket.">
            <div className="mock-list">
              {state.tickets.map((ticket) => (
                <div className="mock-card" key={ticket.id}>
                  <div className="mock-card-top">
                    <strong>
                      <Ticket size={15} /> {ticket.subject}
                    </strong>
                    <Badge status={ticket.status} />
                  </div>
                  <p>
                    {ticket.category} · {date(ticket.createdAt)}
                  </p>
                  <div className="mock-thread">
                    {ticket.messages.map((message, index) => (
                      <div key={`${message.at}-${index}`}>
                        <strong>{message.author}</strong>
                        <p>{message.body}</p>
                      </div>
                    ))}
                  </div>
                  {ticket.status !== "closed" ? (
                    <div className="mock-reply">
                      <label className="field mock-inline-field">
                        Support reply
                        <input
                          value={reply[ticket.id] ?? ""}
                          onChange={(e) =>
                            setReply({ ...reply, [ticket.id]: e.target.value })
                          }
                        />
                      </label>
                      <button
                        className="btn"
                        onClick={() => {
                          commit(
                            replyTicket(
                              state,
                              ticket.id,
                              reply[ticket.id] || "Mock support reply.",
                            ),
                            "Mock support reply added.",
                          );
                          setReply({ ...reply, [ticket.id]: "" });
                        }}
                      >
                        Reply
                      </button>
                      <button
                        className="text-link"
                        onClick={() =>
                          commit(
                            closeTicket(state, ticket.id),
                            "Mock ticket closed.",
                          )
                        }
                      >
                        Close
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  if (page === "Announcements") {
    return (
      <div className="mock-stack">
        {header}
        <div className="mock-two-col">
          <Panel
            title="Create announcement"
            detail="Target all sites or a specific site."
          >
            <label className="field">
              Title
              <input
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
              />
            </label>
            <label className="field">
              Body
              <textarea
                rows={4}
                value={announcementBody}
                onChange={(e) => setAnnouncementBody(e.target.value)}
              />
            </label>
            <label className="field">
              Target
              <select
                value={announcementTarget}
                onChange={(e) => setAnnouncementTarget(e.target.value)}
              >
                <option value="all">All sites</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="btn primary"
              onClick={() =>
                commit(
                  createAnnouncement(
                    state,
                    announcementTitle,
                    announcementBody,
                    announcementTarget,
                  ),
                  "Mock announcement drafted.",
                )
              }
            >
              Create draft
            </button>
          </Panel>
          <Panel
            title="Announcements"
            detail="Publish a draft to the mock tenant feed."
          >
            <div className="mock-list">
              {state.announcements.length ? (
                state.announcements.map((announcement) => (
                  <div className="mock-card" key={announcement.id}>
                    <div className="mock-card-top">
                      <strong>
                        <Megaphone size={15} /> {announcement.title}
                      </strong>
                      <Badge status={announcement.status} />
                    </div>
                    <p>{announcement.body}</p>
                    <small>
                      {announcement.target === "all"
                        ? "All sites"
                        : siteName(announcement.target)}{" "}
                      · {date(announcement.createdAt)}
                    </small>
                    {announcement.status === "draft" ? (
                      <button
                        className="text-link"
                        onClick={() =>
                          commit(
                            publishAnnouncement(state, announcement.id),
                            "Mock announcement published.",
                          )
                        }
                      >
                        Publish
                      </button>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="muted">No announcements yet.</p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  if (page === "Admin") {
    return (
      <div className="mock-stack">
        {header}
        <div className="mock-two-col">
          <Panel
            title="Platform controls"
            detail="Super Admin mock configuration."
          >
            <label className="field">
              Domain markup (%)
              <input
                type="number"
                min="0"
                max="100"
                value={markup}
                onChange={(e) => setMarkup(e.target.value)}
              />
            </label>
            <button
              className="btn primary"
              onClick={() =>
                commit(
                  setDomainMarkup(state, Number(markup) || 0),
                  "Mock per-TLD markup updated.",
                )
              }
            >
              Save markup
            </button>
            <div className="mock-kv">
              <span>Current markup</span>
              <strong>{state.domainMarkupPercent}%</strong>
            </div>
            <div className="mock-kv">
              <span>Template</span>
              <strong>Deriv Studio v1</strong>
            </div>
            <div className="mock-kv">
              <span>Modules</span>
              <strong>markets, terminal, about</strong>
            </div>
            <div className="mock-kv">
              <span>Mock users</span>
              <strong>1 owner · 1 support · 1 finance</strong>
            </div>
          </Panel>
          <Panel
            title="Job queue"
            detail="Enqueue and run up to three mock jobs per tick."
            action={
              <button
                className="btn"
                onClick={() =>
                  commit(
                    runJobs(state),
                    "Mock cron tick processed queued jobs.",
                  )
                }
              >
                <Activity size={14} /> Run tick
              </button>
            }
          >
            <div className="mock-actions">
              {(["domain-poll", "email", "cleanup"] as const).map((type) => (
                <button
                  className="btn"
                  key={type}
                  onClick={() =>
                    commit(enqueueJob(state, type), `Mock ${type} job queued.`)
                  }
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="mock-list">
              {state.jobs.slice(0, 8).map((job) => (
                <div className="mock-list-row" key={job.id}>
                  <span>
                    {job.type}
                    <small>
                      {date(job.createdAt)} · attempt {job.attempts}
                    </small>
                  </span>
                  <Badge status={job.status} />
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <div className="mock-two-col">
          <Panel
            title="Storage fixtures"
            detail="No file leaves the browser; 1 MB mock cap."
          >
            <label className="field">
              Upload asset
              <input
                type="file"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.size > 1024 * 1024) {
                    notify(
                      "Mock upload rejected: over the 1 MB development cap.",
                    );
                    return;
                  }
                  commit(
                    addAsset(
                      state,
                      file.name,
                      file.size,
                      file.type || "unknown",
                    ),
                    "Mock asset recorded in browser state.",
                  );
                }}
              />
            </label>
            <div className="mock-list">
              {state.assets.map((asset) => (
                <div className="mock-list-row" key={asset.id}>
                  <span>
                    {asset.name}
                    <small>
                      {asset.type} · {(asset.size / 1024).toFixed(1)} KB
                    </small>
                  </span>
                  <Badge status="stored" />
                </div>
              ))}
            </div>
          </Panel>
          <Panel
            title="Backup and restore"
            detail="Mock snapshot workflow; no database is copied."
            action={
              <button
                className="btn"
                onClick={() =>
                  commit(createBackup(state), "Mock backup created.")
                }
              >
                Create backup
              </button>
            }
          >
            <div className="mock-list">
              {state.backups.length ? (
                state.backups.map((backup) => (
                  <div className="mock-list-row" key={backup.id}>
                    <span>
                      {backup.note}
                      <small>{date(backup.at)}</small>
                    </span>
                    <button
                      className="text-link"
                      onClick={() =>
                        commit(
                          restoreBackup(state, backup.id),
                          "Mock restore recorded. No data was changed.",
                        )
                      }
                    >
                      Restore
                    </button>
                  </div>
                ))
              ) : (
                <p className="muted">No mock backups yet.</p>
              )}
            </div>
            <div className="mock-metrics">
              <div>
                <span>Jobs queued</span>
                <strong>
                  {state.jobs.filter((job) => job.status === "queued").length}
                </strong>
              </div>
              <div>
                <span>Open tickets</span>
                <strong>
                  {
                    state.tickets.filter((ticket) => ticket.status !== "closed")
                      .length
                  }
                </strong>
              </div>
              <div>
                <span>Domains</span>
                <strong>{state.domains.length}</strong>
              </div>
              <div>
                <span>Audit events</span>
                <strong>{state.audit.length}</strong>
              </div>
            </div>
          </Panel>
        </div>
        <Panel title="Audit log" detail="Append-only development audit trail.">
          <div className="mock-list">
            {state.audit.slice(0, 12).map((entry) => (
              <div className="mock-list-row" key={entry.id}>
                <span>
                  {entry.action}
                  <small>{entry.detail}</small>
                </span>
                <small>{date(entry.at)}</small>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    );
  }

  if (page === "Settings") {
    return (
      <div className="mock-stack mock-settings-block">
        {header}
        <div className="mock-two-col">
          <Panel
            title="Identity lab"
            detail="Verification, reset, and 2FA fixtures."
          >
            <div className="mock-kv">
              <span>Email verified</span>
              <Badge status={state.emailVerified ? "verified" : "unverified"} />
            </div>
            <div className="mock-kv">
              <span>2FA</span>
              <Badge status={state.twoFactorEnabled ? "enabled" : "disabled"} />
            </div>
            <div className="mock-actions">
              <button
                className="btn"
                onClick={() =>
                  commit(
                    sendEmail(state, {
                      to: mailTo,
                      subject: "Verify your mock account",
                      body: "Use this development token to verify your email.",
                      kind: "verification",
                    }),
                    "Mock verification email created.",
                  )
                }
              >
                <Mail size={14} /> Send verification
              </button>
              <button
                className="btn"
                onClick={() =>
                  commit(verifyEmail(state), "Mock email verified.")
                }
              >
                Verify email
              </button>
              <button
                className="btn"
                onClick={() =>
                  commit(
                    sendEmail(state, {
                      to: mailTo,
                      subject: "Reset your mock password",
                      body: "Development reset token: reset-mock-token.",
                      kind: "reset",
                    }),
                    "Mock reset email created.",
                  )
                }
              >
                Send reset
              </button>
              <button
                className="btn"
                onClick={() =>
                  commit(toggleTwoFactor(state), "Mock 2FA toggled.")
                }
              >
                {state.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
              </button>
            </div>
            <label className="field">
              Development mailbox
              <input
                value={mailTo}
                onChange={(e) => setMailTo(e.target.value)}
              />
            </label>
            <div className="mock-list">
              {state.emails.map((email) => (
                <div className="mock-card" key={email.id}>
                  <div className="mock-card-top">
                    <strong>{email.subject}</strong>
                    <Badge status={email.kind} />
                  </div>
                  <p>{email.body}</p>
                  <small>
                    {email.to} · {date(email.createdAt)}
                  </small>
                </div>
              ))}
            </div>
          </Panel>
          <Panel
            title="Account lifecycle"
            detail="Grace-period deletion and full export fixtures."
          >
            <div className="mock-kv">
              <span>Deletion requested</span>
              <strong>
                {state.deletionRequestedAt
                  ? date(state.deletionRequestedAt)
                  : "No"}
              </strong>
            </div>
            {state.deletionRequestedAt ? (
              <button
                className="btn"
                onClick={() =>
                  commit(
                    cancelDeletion(state),
                    "Mock deletion request cancelled.",
                  )
                }
              >
                Cancel deletion
              </button>
            ) : (
              <button
                className="btn danger"
                onClick={() =>
                  commit(
                    requestDeletion(state),
                    "Mock account deletion requested with 30-day grace.",
                  )
                }
              >
                Request account deletion
              </button>
            )}
            <button
              className="btn"
              onClick={() => {
                const blob = new Blob([JSON.stringify(state, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "tradeintra-mock-ops.json";
                link.click();
                URL.revokeObjectURL(url);
                notify("Mock operations state exported.");
              }}
            >
              Export mock state
            </button>
            <p className="muted">
              The real account remains local/staging only. This fixture does not
              delete auth records, storage, or domains.
            </p>
          </Panel>
        </div>
      </div>
    );
  }

  return null;
}
