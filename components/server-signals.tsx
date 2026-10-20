"use client";

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";

type Signal = {
  id: string;
  name: string;
  interval: string;
  telegram: string;
  status: string;
  trial_ends_at: string;
  price: string;
};

export function ServerSignals({
  notify,
}: {
  notify: (message: string) => void;
}) {
  const [orders, setOrders] = useState<Signal[]>([]);
  const [deliveries, setDeliveries] = useState<Record<string, unknown[]>>({});
  const [name, setName] = useState("Operator momentum");
  const [interval, setIntervalValue] = useState("5m");
  const [telegram, setTelegram] = useState("@mock_operator");
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("@mock_operator");
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/studio/signals", {
      credentials: "same-origin",
      cache: "no-store",
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Unable to load signals.");
    setOrders(body.orders ?? []);
  }
  useEffect(() => {
    load().catch((reason: Error) => setError(reason.message));
    fetch("/api/studio/telegram", { credentials: "same-origin" })
      .then((response) => response.json())
      .then((body) => {
        setConnected(Boolean(body.connected));
        if (body.chatId) setChatId(body.chatId);
      })
      .catch(() => {});
  }, []);

  async function act(input: Record<string, unknown>, message: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/studio/signals", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "The signal request failed.");
        return;
      }
      await load();
      notify(message);
    } catch {
      setError("The signal service is unavailable. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function showDeliveries(orderId: string) {
    const response = await fetch(`/api/studio/signals?orderId=${orderId}`, {
      credentials: "same-origin",
      cache: "no-store",
    });
    const body = await response.json();
    if (response.ok)
      setDeliveries((current) => ({
        ...current,
        [orderId]: body.deliveries ?? [],
      }));
  }

  return (
    <div className="mock-stack">
      <div className="mock-banner">
        <div>
          <span className="eyebrow">SERVER SIGNALS / 24H TRIAL</span>
          <strong>
            Signal orders and delivery records are account-scoped.
          </strong>
          <p>
            Provider delivery is mocked until Telegram credentials are supplied.
            After the trial, the subscription price is $8.99/30 days.
          </p>
        </div>
        <span className="badge neutral">{orders.length} orders</span>
      </div>
      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}
      <section className="panel mock-panel">
        <div className="section-heading">
          <div>
            <h2>Telegram connection</h2>
            <p>Provider-owned bot token; encrypted at rest.</p>
          </div>
          <span className="badge neutral">
            {connected ? "connected" : "not connected"}
          </span>
        </div>
        <label className="field">
          Bot token
          <input
            type="password"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="123456:ABC..."
          />
        </label>
        <label className="field">
          Chat or channel
          <input value={chatId} onChange={(e) => setChatId(e.target.value)} />
        </label>
        <div className="mock-actions">
          <button
            className="btn primary"
            disabled={busy || !botToken}
            onClick={async () => {
              setBusy(true);
              try {
                const response = await fetch("/api/studio/telegram", {
                  method: "POST",
                  credentials: "same-origin",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "connect", botToken, chatId }),
                });
                if (response.ok) {
                  setConnected(true);
                  notify("Telegram connection stored with encryption.");
                } else {
                  const body = await response.json();
                  setError(body.error ?? "Telegram connection failed.");
                }
              } finally {
                setBusy(false);
              }
            }}
          >
            Connect
          </button>
          <button
            className="btn"
            disabled={busy || !connected}
            onClick={async () => {
              setBusy(true);
              try {
                const response = await fetch("/api/studio/telegram", {
                  method: "POST",
                  credentials: "same-origin",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "test" }),
                });
                const body = await response.json();
                if (response.ok) notify("Telegram connection verified.");
                else setError(body.error ?? "Telegram test failed.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Test connection
          </button>
        </div>
      </section>
      <div className="mock-two-col">
        <section className="panel mock-panel">
          <div className="section-heading">
            <div>
              <h2>Create signal order</h2>
              <p>Start a 24-hour trial.</p>
            </div>
          </div>
          <label className="field">
            Strategy name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            Interval
            <input
              value={interval}
              onChange={(e) => setIntervalValue(e.target.value)}
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
            disabled={busy}
            onClick={() =>
              void act(
                { action: "create", name, interval, telegram },
                "Signal trial created.",
              )
            }
          >
            <Radio size={14} /> Start trial
          </button>
        </section>
        <section className="panel mock-panel">
          <div className="section-heading">
            <div>
              <h2>Signal orders</h2>
              <p>Deliver, pause, or cancel.</p>
            </div>
          </div>
          <div className="mock-list">
            {orders.length ? (
              orders.map((order) => (
                <div className="mock-card" key={order.id}>
                  <div className="mock-card-top">
                    <strong>{order.name}</strong>
                    <span className="badge neutral">{order.status}</span>
                  </div>
                  <p>
                    {order.interval} · {order.telegram} · trial ends{" "}
                    {new Date(order.trial_ends_at).toLocaleDateString()}
                  </p>
                  <div className="mock-actions">
                    {["trial", "active", "paused"].includes(order.status) ? (
                      <button
                        className="text-link"
                        disabled={busy}
                        onClick={() =>
                          void act(
                            { action: "deliver", orderId: order.id },
                            "Mock signal delivered.",
                          )
                        }
                      >
                        Deliver now
                      </button>
                    ) : null}
                    {["trial", "active", "paused"].includes(order.status) ? (
                      <button
                        className="text-link"
                        disabled={busy}
                        onClick={() =>
                          void act(
                            {
                              action: "status",
                              orderId: order.id,
                              status:
                                order.status === "paused" ? "active" : "paused",
                            },
                            "Signal status updated.",
                          )
                        }
                      >
                        {order.status === "paused" ? "Resume" : "Pause"}
                      </button>
                    ) : null}
                    {!["cancelled", "expired"].includes(order.status) ? (
                      <button
                        className="text-link danger"
                        disabled={busy}
                        onClick={() =>
                          void act(
                            {
                              action: "status",
                              orderId: order.id,
                              status: "cancelled",
                            },
                            "Signal cancelled.",
                          )
                        }
                      >
                        Cancel
                      </button>
                    ) : null}
                    <button
                      className="text-link"
                      onClick={() => void showDeliveries(order.id)}
                    >
                      Deliveries
                    </button>
                  </div>
                  {deliveries[order.id]?.length ? (
                    <div className="mock-deliveries">
                      {deliveries[order.id].map((delivery, index) => (
                        <div key={index}>
                          <span className="badge neutral">sent</span>
                          <span>
                            {String(
                              (delivery as { message?: string }).message ??
                                "Signal",
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="muted">No signal orders yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
