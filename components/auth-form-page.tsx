"use client";

import Link from "next/link";
import { useState } from "react";
import { MarketingNav } from "./marketing-shell";

type Mode = "login" | "signup";

export function AuthFormPage({ mode }: { mode: Mode }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [verificationToken, setVerificationToken] = useState<string | null>(
    null,
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body =
      mode === "signup"
        ? {
            fullName: String(form.get("fullName") ?? ""),
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
            ...(String(form.get("referralCode") ?? "").trim()
              ? { referralCode: String(form.get("referralCode")) }
              : {}),
          }
        : {
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
          };
    try {
      const response = await fetch(
        `/api/studio/${mode === "signup" ? "register" : "login"}`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const reply = await response.json();
      if (!response.ok) {
        setError(reply.error ?? "The request could not be completed.");
        return;
      }
      if (mode === "signup" && reply.devVerificationToken) {
        setVerificationToken(reply.devVerificationToken);
        setMessage(
          "Development verification token created. Verify now to claim 30 starter credits.",
        );
        return;
      }
      window.location.href = "/studio";
    } catch {
      setError("The server is unavailable. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!verificationToken) return;
    setBusy(true);
    try {
      const response = await fetch("/api/studio/verify-email", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationToken }),
      });
      if (!response.ok) {
        setError("Verification failed. Request a new token from Settings.");
        return;
      }
      window.location.href = "/studio";
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="marketing-page">
      <MarketingNav />
      <main className="auth-page">
        <section className="auth-card">
          <span className="marketing-eyebrow">
            {mode === "signup" ? "CREATE AN ACCOUNT" : "WELCOME BACK"}
          </span>
          <h1>
            {mode === "signup"
              ? "Start your operator studio."
              : "Sign in to your studio."}
          </h1>
          <p>
            {mode === "signup"
              ? "Create or connect a Deriv account before publishing. Email verification is required before the dashboard, site creation, and credits."
              : "Use email and password, or connect Google when credentials are configured."}
          </p>
          <form onSubmit={submit}>
            {mode === "signup" ? (
              <>
                <label className="field">
                  Full name
                  <input
                    name="fullName"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={80}
                  />
                </label>
                <label className="field">
                  Referral code (optional)
                  <input
                    name="referralCode"
                    placeholder="TRD-XXXXXXXX"
                    maxLength={12}
                  />
                </label>
              </>
            ) : null}
            <label className="field">
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </label>
            <label className="field">
              Password
              <input
                name="password"
                type="password"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                required
                minLength={8}
                maxLength={128}
              />
              {mode === "signup" ? (
                <small>
                  At least 8 characters, one uppercase letter, and one number.
                </small>
              ) : null}
            </label>
            {error ? (
              <p className="auth-error" role="alert">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="auth-message" role="status">
                {message}
              </p>
            ) : null}
            {verificationToken ? (
              <button
                className="btn primary"
                type="button"
                disabled={busy}
                onClick={verify}
              >
                Verify email and continue
              </button>
            ) : (
              <button className="btn primary" type="submit" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : mode === "signup"
                    ? "Create account"
                    : "Sign in"}
              </button>
            )}
          </form>
          <div className="auth-divider">
            <span>or</span>
          </div>
          <a className="btn auth-google" href="/api/auth/google/start">
            Continue with Google
          </a>
          <small className="auth-note">
            Uses the real Google OAuth adapter when credentials are configured;
            in local development it creates a clearly labelled mock Google
            identity. No Google credentials are stored in the browser.
          </small>
          <p className="auth-switch">
            {mode === "signup" ? (
              <>
                Already have an account? <Link href="/login">Log in</Link>
              </>
            ) : (
              <>
                New here? <Link href="/signup">Create an account</Link>
              </>
            )}
          </p>
        </section>
        <aside className="auth-aside">
          <span className="marketing-eyebrow">ONE ACCOUNT / ONE SITE</span>
          <h2>Build the brand surface. Keep the trading boundary.</h2>
          <ul>
            <li>30 starter AI credits after verification</li>
            <li>Referrer also receives 30 credits</li>
            <li>One active site; archive before replacement</li>
            <li>Free subdomain or custom domain</li>
            <li>Deriv account required before site creation</li>
          </ul>
        </aside>
      </main>
    </div>
  );
}
