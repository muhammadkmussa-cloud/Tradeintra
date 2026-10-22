"use client";
import { useEffect, useRef, useState } from "react";
import type { Studio } from "./studio";
export type Account = {
  id: string;
  email: string;
  fullName: string | null;
  emailVerified: boolean;
  referralCode: string | null;
  role: "user" | "support" | "finance" | "super_admin" | "service";
};
type Reply = {
  enabled?: boolean;
  user: Account | null;
  mode: "local" | "postgres" | "disabled";
  studio: Studio;
  revision: number;
  devVerificationToken?: string | null;
  credits?: number;
};
class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}
async function call(endpoint: string, input?: unknown): Promise<Reply> {
  const response = await fetch(`/api/studio/${endpoint}`, {
    method: input === undefined ? "GET" : "POST",
    credentials: "same-origin",
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
    ...(input === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }),
  });
  const reply = await response.json();
  if (!response.ok)
    throw new RequestError(
      reply.error || "The request could not be completed.",
      response.status,
      reply.code,
      reply.fields,
    );
  return reply;
}
export function useServerWorkspace(
  onState: (studio: Studio) => void,
  notify: (message: string) => void,
) {
  const [user, setUser] = useState<Account | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState("local");
  const [busy, setBusy] = useState(false);
  const [authMode, setAuthMode] = useState<"register" | "login" | null>(null);
  const [authError, setAuthError] = useState("");
  const [revision, setRevision] = useState(0);
  const [serviceError, setServiceError] = useState("");
  const [verificationToken, setVerificationToken] = useState<string | null>(
    null,
  );
  const [credits, setCredits] = useState(0);
  const callbacks = useRef({ onState, notify });
  callbacks.current = { onState, notify };
  const currentAccount = useRef<Account | null>(null);
  const lock = useRef(false);
  const operation = useRef<{ key: string; id: string } | null>(null);
  function accept(reply: Reply) {
    if (!reply.user && currentAccount.current) {
      setAuthMode("login");
      setAuthError(
        "Your session ended. Sign in again to continue; your private draft remains in memory.",
      );
      return;
    }
    currentAccount.current = reply.user;
    setEnabled(reply.enabled !== false);
    setMode(reply.mode);
    setUser(reply.user);
    if (typeof reply.credits === "number") setCredits(reply.credits);
    if (reply.user && reply.studio) {
      setRevision(reply.revision);
      callbacks.current.onState(reply.studio);
    }
    setServiceError("");
  }
  useEffect(() => {
    let alive = true;
    call("session")
      .then((reply) => {
        if (alive) accept(reply);
      })
      .catch(() => {
        if (alive)
          setServiceError(
            "Server accounts are temporarily unavailable. The browser demo still works.",
          );
      })
      .finally(() => {
        if (alive) setSessionReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  async function authenticate(input: {
    email: string;
    password: string;
    fullName?: string;
    referralCode?: string;
    mfaCode?: string;
  }) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setAuthError("");
    try {
      const reply = await call(
        authMode === "register" ? "register" : "login",
        input,
      );
      accept(reply);
      setAuthMode(null);
      operation.current = null;
      if (reply.devVerificationToken)
        setVerificationToken(reply.devVerificationToken);
      callbacks.current.notify(
        "Signed in to your server-backed mock workspace.",
      );
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Unable to sign in.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function mutate(
    input: Record<string, unknown>,
  ): Promise<{ ok: boolean; fields?: Record<string, string> }> {
    if (lock.current) {
      callbacks.current.notify("Please wait for the current request.");
      return { ok: false };
    }
    lock.current = true;
    setBusy(true);
    const key = JSON.stringify({ ...input, revision });
    if (operation.current?.key !== key)
      operation.current = { key, id: crypto.randomUUID() };
    try {
      accept(
        await call("action", {
          ...input,
          revision,
          operationId: operation.current.id,
        }),
      );
      operation.current = null;
      return { ok: true };
    } catch (error) {
      if (error instanceof RequestError) {
        if (error.code === "STALE_WORKSPACE") {
          try {
            accept(await call("session"));
          } catch {
            /* Preserve the current draft on failed refresh. */
          }
          operation.current = null;
        }
        if (error.status === 401) {
          setAuthMode("login");
          setAuthError(
            "Your session expired. Sign in again; your unsaved editor remains open.",
          );
        }
        callbacks.current.notify(error.message);
        return { ok: false, fields: error.fields };
      }
      callbacks.current.notify(
        "Connection interrupted. Your draft is still open. Retry to safely reuse the same operation.",
      );
      return { ok: false };
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function verifyEmail(token: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      accept(await call("verify-email", { token }));
      setVerificationToken(null);
      callbacks.current.notify("Email verified. 30 starter credits added.");
    } catch (error) {
      callbacks.current.notify(
        error instanceof Error ? error.message : "Unable to verify email.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function resendVerification() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const reply = await call("verify-email/resend", {});
      if (reply.devVerificationToken)
        setVerificationToken(reply.devVerificationToken);
      callbacks.current.notify("Verification token reissued.");
    } catch (error) {
      callbacks.current.notify(
        error instanceof Error
          ? error.message
          : "Unable to resend verification.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function signOut() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await call("logout", {});
      window.location.reload();
    } catch (error) {
      callbacks.current.notify(
        error instanceof Error ? error.message : "Unable to sign out.",
      );
      lock.current = false;
      setBusy(false);
    }
  }
  return {
    user,
    sessionReady,
    enabled,
    mode,
    busy,
    authMode,
    setAuthMode,
    authError,
    setAuthError,
    authenticate,
    verifyEmail,
    resendVerification,
    verificationToken,
    credits,
    mutate,
    signOut,
    serviceError,
  };
}
