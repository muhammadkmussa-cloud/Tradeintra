"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

export function ServerMfa({ notify }: { notify: (message: string) => void }) {
  const [enabled, setEnabled] = useState(false);
  const [setup, setSetup] = useState<{
    secret: string;
    otpauth: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/studio/mfa", {
      credentials: "same-origin",
      cache: "no-store",
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Unable to load MFA.");
    setEnabled(Boolean(body.enabled));
  }
  useEffect(() => {
    load().catch((reason: Error) => setError(reason.message));
  }, []);

  async function act(action: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/studio/mfa", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, code }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "The two-factor request failed.");
        return;
      }
      if (action === "setup") {
        setSetup({ secret: body.secret, otpauth: body.otpauth });
        return;
      }
      setCode("");
      setSetup(null);
      await load();
      notify(
        action === "enable"
          ? "Two-factor authentication enabled."
          : "Two-factor authentication disabled.",
      );
    } catch {
      setError("The two-factor service is unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel settings-block">
      <div className="settings-block-head">
        <div>
          <h2>Two-factor authentication</h2>
          <p>Authenticator app (TOTP), server-verified on password login.</p>
        </div>
        <span className="badge neutral">{enabled ? "enabled" : "off"}</span>
      </div>
      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}
      {!enabled ? (
        <>
          {!setup ? (
            <button
              className="btn primary"
              disabled={busy}
              onClick={() => void act("setup")}
            >
              <ShieldCheck size={15} /> Set up authenticator
            </button>
          ) : (
            <>
              <p className="muted">
                Add this secret to your authenticator app, then enter the
                6-digit code.
              </p>
              <code className="mock-code">{setup.secret}</code>
              <label className="field">
                Authenticator code
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  inputMode="numeric"
                  maxLength={8}
                />
              </label>
              <button
                className="btn primary"
                disabled={busy || code.length < 6}
                onClick={() => void act("enable")}
              >
                Enable 2FA
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <label className="field">
            Authenticator code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              maxLength={8}
            />
          </label>
          <button
            className="btn danger"
            disabled={busy || code.length < 6}
            onClick={() => void act("disable")}
          >
            Disable 2FA
          </button>
        </>
      )}
    </section>
  );
}
