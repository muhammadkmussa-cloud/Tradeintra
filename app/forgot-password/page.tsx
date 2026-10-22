"use client";

import Link from "next/link";
import { useState } from "react";
import { MarketingNav } from "@/components/marketing-shell";

export default function ForgotPasswordPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState("");

  return (
    <div className="marketing-page">
      <MarketingNav />
      <main className="auth-page">
        <section className="auth-card">
          <span className="marketing-eyebrow">PASSWORD RECOVERY</span>
          <h1>Reset your password.</h1>
          <p>
            Enter your account email. The response is the same whether or not an
            account exists.
          </p>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError("");
              setMessage("");
              setToken(null);
              const form = new FormData(event.currentTarget);
              try {
                const response = await fetch(
                  "/api/studio/password-reset/request",
                  {
                    method: "POST",
                    credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: String(form.get("email") ?? ""),
                    }),
                  },
                );
                const body = await response.json();
                if (!response.ok) {
                  setError(body.error ?? "The recovery request was rejected.");
                  return;
                }
                setMessage(
                  "If the account exists, a reset message has been issued.",
                );
                if (body.devResetToken) setToken(body.devResetToken);
              } catch {
                setError("The recovery service is unavailable.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="field">
              Email
              <input name="email" type="email" required maxLength={254} />
            </label>
            {message ? (
              <p className="auth-message" role="status">
                {message}
              </p>
            ) : null}
            {token ? (
              <p className="auth-message">
                Development reset link:{" "}
                <Link
                  href={`/reset-password?token=${encodeURIComponent(token)}`}
                >
                  open reset page
                </Link>
              </p>
            ) : null}
            {error ? (
              <p className="auth-error" role="alert">
                {error}
              </p>
            ) : null}
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? "Please wait…" : "Request reset"}
            </button>
          </form>
          <p className="auth-switch">
            <Link href="/login">Back to login</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
