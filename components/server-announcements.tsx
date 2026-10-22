"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  body: string;
  target: string;
  status: string;
  created_at: string;
};

export function ServerAnnouncements({
  sites,
  notify,
}: {
  sites: { id: string; name: string }[];
  notify: (message: string) => void;
}) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("Operator notice");
  const [body, setBody] = useState("A short update for your site visitors.");
  const [target, setTarget] = useState("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/studio/announcements", {
      credentials: "same-origin",
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error ?? "Unable to load announcements.");
    setItems(data.announcements ?? []);
  }
  useEffect(() => {
    load().catch((reason: Error) => setError(reason.message));
  }, []);

  async function act(input: Record<string, unknown>, message: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/studio/announcements", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "The announcement request failed.");
        return;
      }
      await load();
      notify(message);
    } catch {
      setError("Announcements are unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mock-stack">
      <div className="mock-banner">
        <div>
          <span className="eyebrow">SERVER ANNOUNCEMENTS / SITE FEED</span>
          <strong>Announcements are account-scoped and audited.</strong>
          <p>Publish a draft to the selected site or all sites.</p>
        </div>
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
              <h2>Create announcement</h2>
              <p>Drafts can be published later.</p>
            </div>
          </div>
          <label className="field">
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="field">
            Body
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          <label className="field">
            Target
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
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
            disabled={busy}
            onClick={() =>
              void act(
                { action: "create", title, body, target },
                "Announcement drafted.",
              )
            }
          >
            <Megaphone size={14} /> Create draft
          </button>
        </section>
        <section className="panel mock-panel">
          <div className="section-heading">
            <div>
              <h2>Announcements</h2>
              <p>Publish a draft to the mock tenant feed.</p>
            </div>
          </div>
          <div className="mock-list">
            {items.length ? (
              items.map((item) => (
                <div className="mock-card" key={item.id}>
                  <div className="mock-card-top">
                    <strong>{item.title}</strong>
                    <span className="badge neutral">{item.status}</span>
                  </div>
                  <p>{item.body}</p>
                  <small>
                    {item.target === "all" ? "All sites" : item.target} ·{" "}
                    {new Date(item.created_at).toLocaleDateString()}
                  </small>
                  {item.status === "draft" ? (
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() =>
                        void act(
                          { action: "publish", announcementId: item.id },
                          "Announcement published.",
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
        </section>
      </div>
    </div>
  );
}
