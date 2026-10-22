"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { MarketingNav } from "./marketing-nav";

export function VerifyEmail({ token }: { token: string }) {
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState("Verifying your email…");
  const started = useRef(false);

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("This verification link is missing a token.");
      return;
    }
    if (started.current) return;
    started.current = true;
    fetch("/api/studio/verify-email", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) {
          setState("error");
          setMessage(
            body.error ?? "This verification link is invalid or expired.",
          );
          return;
        }
        setState("done");
        setMessage("Your email is verified. Your studio is ready.");
      })
      .catch(() => {
        setState("error");
        setMessage("Verification is unavailable. Try again from Settings.");
      });
  }, [token]);

  return (
    <div className="marketing-page">
      <MarketingNav />
      <main className="auth-page verify-page">
        <section className="auth-card verify-card">
          <span className="marketing-eyebrow">EMAIL VERIFICATION</span>
          <h1>{state === "done" ? "You are ready." : "One last step."}</h1>
          <p role="status">{message}</p>
          <div className={`verify-state verify-${state}`} aria-hidden="true">
            {state === "working" ? (
              <Loader2 size={18} className="spin" />
            ) : state === "done" ? (
              <Check size={18} />
            ) : null}
          </div>
          {state !== "working" ? (
            <div className="marketing-cta">
              <Link
                className="btn primary"
                href={state === "done" ? "/studio" : "/login"}
              >
                {state === "done" ? "Open your studio" : "Back to sign in"}
              </Link>
              {state === "error" ? (
                <Link className="btn" href="/signup">
                  Create a new account
                </Link>
              ) : null}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
