"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MarketingNav } from "@/components/marketing-shell";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="marketing-page">
      <MarketingNav />
      <main className="auth-page">
        <section className="auth-card">
          <span className="marketing-eyebrow">PASSWORD RECOVERY</span>
          <h1>Choose a new password.</h1>
          <p>At least 8 characters, one uppercase letter, and one number.</p>
          {done ? (
            <p className="auth-message">
              Password updated. <Link href="/login">Sign in</Link>
            </p>
          ) : (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                setBusy(true);
                setError("");
                const form = new FormData(event.currentTarget);
                try {
                  const response = await fetch(
                    "/api/studio/password-reset/confirm",
                    {
                      method: "POST",
                      credentials: "same-origin",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        token,
                        password: String(form.get("password") ?? ""),
                      }),
                    },
                  );
                  const body = await response.json();
                  if (!response.ok) {
                    setError(body.error ?? "Password reset failed.");
                    return;
                  }
                  setDone(true);
                } catch {
                  setError("The recovery service is unavailable.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label className="field">
                New password
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                />
              </label>
              {error ? (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                className="btn primary"
                type="submit"
                disabled={busy || !token}
              >
                {busy ? "Please wait…" : "Reset password"}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
