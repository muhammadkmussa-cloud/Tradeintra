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
  const [mfaRequired, setMfaRequired] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setFieldErrors({});
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
            ...(String(form.get("mfaCode") ?? "").trim()
              ? { mfaCode: String(form.get("mfaCode")).trim() }
              : {}),
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
        if (reply.code === "MFA_REQUIRED") setMfaRequired(true);
        if (reply.fields && typeof reply.fields === "object")
          setFieldErrors(reply.fields as Record<string, string>);
        setError(reply.error ?? "The request could not be completed.");
        return;
      }
      if (mode === "signup" && reply.devVerificationToken) {
        setVerificationToken(reply.devVerificationToken);
        setMessage(
          "Development verification token created. Verify now to open your studio.",
        );
        return;
      }
      if (mode === "signup") {
        setMessage(
          "Check your email to verify your account before creating a site.",
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
    } catch {
      setError("Verification is unavailable. Try again.");
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
            {mode === "signup" ? "CREATE AN ACCOUNT" : "SIGN IN"}
          </span>
          <h1>{mode === "signup" ? "Start your studio." : "Welcome back."}</h1>
          <p>
            {mode === "signup"
              ? "Create or connect a Deriv account before publishing. Email verification is required before site creation."
              : "Use email and password, or connect Google when credentials are configured."}
          </p>
          <form onSubmit={submit} aria-busy={busy}>
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
                    aria-invalid={Boolean(fieldErrors.fullName)}
                    aria-describedby={
                      fieldErrors.fullName ? "fullname-error" : undefined
                    }
                  />
                  {fieldErrors.fullName ? (
                    <small className="field-error" id="fullname-error">
                      {fieldErrors.fullName}
                    </small>
                  ) : null}
                </label>
                <label className="field">
                  Referral code (optional)
                  <input
                    name="referralCode"
                    placeholder="TRD-XXXXXXXX"
                    maxLength={12}
                    aria-invalid={Boolean(fieldErrors.referralCode)}
                    aria-describedby={
                      fieldErrors.referralCode ? "referral-error" : undefined
                    }
                  />
                  {fieldErrors.referralCode ? (
                    <small className="field-error" id="referral-error">
                      {fieldErrors.referralCode}
                    </small>
                  ) : null}
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
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
              />
              {fieldErrors.email ? (
                <small className="field-error" id="email-error">
                  {fieldErrors.email}
                </small>
              ) : null}
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
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password ? "password-error" : undefined
                }
              />
              {fieldErrors.password ? (
                <small className="field-error" id="password-error">
                  {fieldErrors.password}
                </small>
              ) : null}
              {mode === "signup" ? (
                <small>
                  At least 8 characters, one uppercase letter, and one number.
                </small>
              ) : null}
            </label>
            {mode === "login" && mfaRequired ? (
              <label className="field">
                Authenticator code
                <input
                  name="mfaCode"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  required
                  autoFocus
                />
              </label>
            ) : null}
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
            Google sign-in uses the configured OAuth adapter. Local development
            creates a clearly labelled mock identity; your Google password is
            never shared with Tradeintra.
          </small>
          <p className="auth-switch">
            {mode === "signup" ? (
              <>
                Already have an account? <Link href="/login">Log in</Link>
              </>
            ) : (
              <>
                <Link href="/forgot-password">Forgot password?</Link>
                <span> · </span>
                New here? <Link href="/signup">Create an account</Link>
              </>
            )}
          </p>
        </section>
        <aside className="auth-aside">
          <span className="marketing-eyebrow">ONE ACCOUNT / ONE SITE</span>
          <h2>Build the brand surface. Keep the trading boundary.</h2>
          <div className="auth-aside-visual" aria-hidden="true">
            <div className="auth-aside-bar">
              <span />
              <span />
              <span />
              <code>operator.tradeintra.com</code>
            </div>
            <div className="auth-aside-site">
              <small>YOUR MARKETS. YOUR PERSPECTIVE.</small>
              <strong>Your next move, in your own name.</strong>
              <div className="auth-aside-chart">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="auth-aside-badges">
              <span>Domain verified</span>
              <span>Deriv presets included</span>
            </div>
          </div>
          <ul>
            <li>Deriv preset library and 20 site modules</li>
            <li>One active site; archive before replacement</li>
            <li>Free subdomain or custom domain</li>
            <li>Deriv account required before site creation</li>
          </ul>
        </aside>
      </main>
    </div>
  );
}
