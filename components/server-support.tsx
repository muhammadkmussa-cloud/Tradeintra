"use client";

import { useEffect, useState } from "react";
import { Ticket } from "lucide-react";

type Message = { id: string; author: string; body: string; created_at: string };
type TicketRecord = {
  id: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
  messages: Message[];
};

export function ServerSupport({
  notify,
}: {
  notify: (message: string) => void;
}) {
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("site");
  const [body, setBody] = useState("");
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/studio/support", {
      credentials: "same-origin",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Unable to load tickets.");
    setTickets(data.tickets ?? []);
  }
  useEffect(() => {
    load().catch((reason: Error) => setError(reason.message));
  }, []);

  async function act(input: Record<string, unknown>, message: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/studio/support", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "The support request failed.");
        return;
      }
      await load();
      notify(message);
    } catch {
      setError("Support is unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mock-stack">
      <div className="mock-banner">
        <div>
          <span className="eyebrow">SERVER SUPPORT / TICKET LEDGER</span>
          <strong>Every ticket is account-scoped and persisted.</strong>
          <p>
            Support replies and closures are recorded in the account audit
            trail.
          </p>
        </div>
        <span className="badge neutral">
          {tickets.filter((ticket) => ticket.status !== "closed").length} open
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
              <h2>Open a ticket</h2>
              <p>Describe the issue and the affected resource.</p>
            </div>
          </div>
          <label className="field">
            Subject
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>
          <label className="field">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          <button
            className="btn primary"
            disabled={busy}
            onClick={async () => {
              await act(
                { action: "create", subject, category, body },
                "Support ticket created.",
              );
              setSubject("");
              setBody("");
            }}
          >
            <Ticket size={14} /> Create ticket
          </button>
        </section>
        <section className="panel mock-panel">
          <div className="section-heading">
            <div>
              <h2>Tickets</h2>
              <p>Reply or close an open ticket.</p>
            </div>
          </div>
          <div className="mock-list">
            {tickets.length ? (
              tickets.map((ticket) => (
                <div className="mock-card" key={ticket.id}>
                  <div className="mock-card-top">
                    <strong>{ticket.subject}</strong>
                    <span className="badge neutral">{ticket.status}</span>
                  </div>
                  <p>
                    {ticket.category} ·{" "}
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                  <div className="mock-thread">
                    {ticket.messages.map((message) => (
                      <div key={message.id}>
                        <strong>{message.author}</strong>
                        <p>{message.body}</p>
                      </div>
                    ))}
                  </div>
                  {ticket.status !== "closed" ? (
                    <div className="mock-reply">
                      <label className="field mock-inline-field">
                        Reply
                        <input
                          value={replies[ticket.id] ?? ""}
                          onChange={(e) =>
                            setReplies({
                              ...replies,
                              [ticket.id]: e.target.value,
                            })
                          }
                        />
                      </label>
                      <button
                        className="btn"
                        disabled={busy}
                        onClick={async () => {
                          await act(
                            {
                              action: "reply",
                              ticketId: ticket.id,
                              body:
                                replies[ticket.id] || "Additional information.",
                            },
                            "Support reply added.",
                          );
                          setReplies({ ...replies, [ticket.id]: "" });
                        }}
                      >
                        Reply
                      </button>
                      <button
                        className="text-link"
                        disabled={busy}
                        onClick={() =>
                          void act(
                            { action: "close", ticketId: ticket.id },
                            "Ticket closed.",
                          )
                        }
                      >
                        Close
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="muted">No tickets yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
