"use client";

import { useEffect, useState } from "react";
import { Bot, Check, Sparkles, Trash2 } from "lucide-react";

type BotRecord = {
  id: string;
  name: string;
  xml: string;
  compatibility: string;
  status: string;
  site_id: string | null;
};
type SiteRef = { id: string; name: string };

export function ServerBots({
  mode,
  sites,
  notify,
}: {
  mode: "library" | "generator";
  sites: SiteRef[];
  notify: (message: string) => void;
}) {
  const [bots, setBots] = useState<BotRecord[]>([]);
  const [credits, setCredits] = useState(0);
  const [prompt, setPrompt] = useState(
    "A cautious volatility breakout with a fixed stake and stop loss.",
  );
  const [name, setName] = useState("Momentum starter");
  const [xml, setXml] = useState('<xml><strategy name="momentum" /></xml>');
  const [siteId, setSiteId] = useState(sites[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/studio/bots", {
      credentials: "same-origin",
      cache: "no-store",
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Unable to load bots.");
    setBots(body.bots ?? []);
    setCredits(body.credits ?? 0);
  }
  useEffect(() => {
    load().catch((reason: Error) => setError(reason.message));
  }, []);

  async function act(input: Record<string, unknown>, message: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/studio/bots", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "The bot request failed.");
        return;
      }
      await load();
      notify(message);
    } catch {
      setError("The bot service is unavailable. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mock-stack">
      <div className="mock-banner">
        <div>
          <span className="eyebrow">SERVER BOT LIBRARY / DEEPSEEK</span>
          <strong>Generated bots are stored and credit-metered.</strong>
          <p>
            Generate 10 credits · refine 3 · verify 3. Mock mode returns a
            deterministic XML fixture; live mode calls DeepSeek only when the
            key is configured.
          </p>
        </div>
        <span className="badge neutral">{credits} credits</span>
      </div>
      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mock-two-col">
        {mode === "generator" ? (
          <section className="panel mock-panel">
            <div className="section-heading">
              <div>
                <h2>Generate a bot</h2>
                <p>Describe the strategy; credits are debited first.</p>
              </div>
            </div>
            <label className="field">
              Strategy prompt
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </label>
            <button
              className="btn primary"
              disabled={busy || credits < 10}
              onClick={() =>
                void act(
                  { action: "generate", prompt },
                  "Mock bot generated and 10 credits debited.",
                )
              }
            >
              <Sparkles size={14} /> Generate · 10 credits
            </button>
          </section>
        ) : (
          <section className="panel mock-panel">
            <div className="section-heading">
              <div>
                <h2>Add a bot</h2>
                <p>Paste DBot XML or load a local file.</p>
              </div>
            </div>
            <label className="field">
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="field">
              XML
              <textarea
                rows={5}
                value={xml}
                onChange={(e) => setXml(e.target.value)}
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
                    setName(file.name.replace(/\.xml$/i, ""));
                    setXml(await file.text());
                  }
                }}
              />
            </label>
            <button
              className="btn primary"
              disabled={busy}
              onClick={() =>
                void act(
                  { action: "create", name, xml },
                  "Bot stored in your server library.",
                )
              }
            >
              <Bot size={14} /> Store bot
            </button>
          </section>
        )}
        <section className="panel mock-panel">
          <div className="section-heading">
            <div>
              <h2>Bot library</h2>
              <p>Validate and assign to your active site.</p>
            </div>
          </div>
          <div className="mock-list">
            {bots.length ? (
              bots.map((bot) => (
                <div className="mock-card" key={bot.id}>
                  <div className="mock-card-top">
                    <strong>{bot.name}</strong>
                    <span className="badge neutral">{bot.status}</span>
                  </div>
                  <p>
                    {bot.compatibility} ·{" "}
                    {bot.site_id ? "assigned" : "unassigned"}
                  </p>
                  <code className="mock-code">{bot.xml.slice(0, 220)}</code>
                  <div className="mock-actions">
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() =>
                        void act(
                          { action: "validate", botId: bot.id },
                          "Bot validation completed.",
                        )
                      }
                    >
                      <Check size={13} /> Validate
                    </button>
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() =>
                        void act(
                          { action: "verify", botId: bot.id },
                          "Bot verified; safe fixes applied.",
                        )
                      }
                    >
                      Verify & fix · 3
                    </button>
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() => {
                        const instruction = window.prompt(
                          "Describe the refinement:",
                          "Improve risk controls and tighten stops.",
                        );
                        if (instruction)
                          void act(
                            {
                              action: "refine",
                              botId: bot.id,
                              instruction,
                            },
                            "Bot refined with 3 credits debited.",
                          );
                      }}
                    >
                      Refine · 3
                    </button>
                    <label className="field mock-inline-field">
                      Assign
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
                    </label>
                    <button
                      className="text-link"
                      disabled={busy || !siteId}
                      onClick={() =>
                        void act(
                          { action: "assign", botId: bot.id, siteId },
                          "Bot assigned to site.",
                        )
                      }
                    >
                      Assign
                    </button>
                    <button
                      className="text-link danger"
                      disabled={busy}
                      onClick={() =>
                        void act(
                          { action: "remove", botId: bot.id },
                          "Bot removed.",
                        )
                      }
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">No bots yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
