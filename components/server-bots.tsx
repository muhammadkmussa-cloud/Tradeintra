"use client";

import { useEffect, useState } from "react";
import { Bot, Check, Download, ShieldCheck, Trash2 } from "lucide-react";
import { DERIV_BOT_PRESETS } from "@/lib/deriv-bot-presets";

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
  sites,
  notify,
}: {
  sites: SiteRef[];
  notify: (message: string) => void;
}) {
  const [bots, setBots] = useState<BotRecord[]>([]);
  const [name, setName] = useState("Momentum starter");
  const [xml, setXml] = useState("<xml><strategy /></xml>");
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

  async function loadPreset(file: string, presetName: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(file, { cache: "no-store" });
      if (!response.ok) throw new Error("Preset file unavailable.");
      setXml(await response.text());
      setName(presetName);
      notify(`${presetName} loaded. Review stake and stop-loss before saving.`);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Preset file unavailable.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mock-stack">
      <div className="mock-banner">
        <div>
          <span className="eyebrow">DERIV PRESET LIBRARY / MIT</span>
          <strong>
            Start from a reviewed DBot template, not generated code.
          </strong>
          <p>
            Imported from Deriv&apos;s MIT-licensed trading-bot-template.
            Validate, review the risk controls, then assign to your active site.
            No AI credits or generation charges.
          </p>
        </div>
        <span className="badge neutral">Demo only</span>
      </div>
      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="panel mock-panel">
        <div className="section-heading">
          <div>
            <h2>Deriv presets</h2>
            <p>
              Editable starting points. They are not profit claims or
              personalised advice.
            </p>
          </div>
        </div>
        <div className="mock-preset-grid">
          {DERIV_BOT_PRESETS.map((preset) => (
            <article className="mock-preset-card" key={preset.id}>
              <span className="badge neutral">{preset.family}</span>
              <strong>{preset.name}</strong>
              <p>{preset.summary}</p>
              <small>{preset.risk}</small>
              <button
                className="text-link"
                disabled={busy}
                onClick={() => void loadPreset(preset.file, preset.name)}
              >
                <Download size={13} /> Load preset
              </button>
            </article>
          ))}
        </div>
      </section>

      <div className="mock-two-col">
        <section className="panel mock-panel">
          <div className="section-heading">
            <div>
              <h2>Add a bot</h2>
              <p>Load a preset above, paste DBot XML, or open a local file.</p>
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
                      <ShieldCheck size={13} /> Verify &amp; fix
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
