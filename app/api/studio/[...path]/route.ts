import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { studioMode, getStudioDb } from "@/lib/server/studio/database";
import { StudioError } from "@/lib/server/studio/types";
import { actionSchema, credentialsSchema } from "@/lib/server/studio/input";
import {
  authenticate,
  sessionActor,
  logout,
  rateLimit,
  SESSION_COOKIE,
  SESSION_SECONDS,
} from "@/lib/server/studio/auth";
import { loadState, applyAction } from "@/lib/server/studio/service";
import { checkOrigin, readJson } from "@/lib/server/studio/http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers });
function failure(error: unknown) {
  if (error instanceof StudioError)
    return json(
      { error: error.message, code: error.code, fields: error.fields },
      error.status,
    );
  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) {
      fields[String(issue.path.at(-1) ?? "form")] = issue.message;
    }
    return json(
      { error: "Check the fields and try again.", code: "VALIDATION", fields },
      422,
    );
  }
  console.error("Studio request unavailable; private error details omitted.");
  return json(
    {
      error:
        "The server workspace is unavailable. Your unsaved draft has not been discarded.",
      code: "UNAVAILABLE",
    },
    503,
  );
}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    if ((await params).path.join("/") !== "session")
      return json({ error: "Not found." }, 404);
    const mode = studioMode();
    if (mode === "disabled") return json({ enabled: false, user: null, mode });
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return json({ enabled: true, user: null, mode });
    const db = await getStudioDb();
    const actor = await sessionActor(db, token);
    if (!actor) {
      const response = json({ enabled: true, user: null, mode });
      response.cookies.set(SESSION_COOKIE, "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    }
    return json({
      enabled: true,
      user: actor,
      mode,
      ...(await loadState(db, actor.id)),
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const secure = checkOrigin(request);
    const mode = studioMode();
    if (mode === "disabled")
      throw new StudioError(
        503,
        "The server workspace is not configured. You can still use the local demo.",
      );
    const endpoint = (await params).path.join("/");
    if (!["register", "login", "logout", "action"].includes(endpoint))
      return json({ error: "Not found." }, 404);
    const body = await readJson(request);
    const db = await getStudioDb();
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (endpoint === "register" || endpoint === "login") {
      const input = credentialsSchema.parse(body);
      const { actor, token: newToken } = await authenticate(
        db,
        input.email,
        input.password,
        endpoint === "register",
      );
      const response = json(
        {
          enabled: true,
          user: actor,
          mode,
          ...(await loadState(db, actor.id)),
        },
        endpoint === "register" ? 201 : 200,
      );
      response.cookies.set(SESSION_COOKIE, newToken, {
        httpOnly: true,
        sameSite: "lax",
        secure,
        path: "/",
        maxAge: SESSION_SECONDS,
      });
      return response;
    }
    if (endpoint === "logout") {
      await logout(db, token);
      const response = json({ ok: true });
      response.cookies.set(SESSION_COOKIE, "", {
        httpOnly: true,
        sameSite: "lax",
        secure,
        path: "/",
        maxAge: 0,
      });
      return response;
    }
    const actor = await sessionActor(db, token);
    if (!actor)
      throw new StudioError(
        401,
        "Your session expired. Sign in again to continue.",
        "UNAUTHENTICATED",
      );
    await rateLimit(db, `mutate:${actor.id}`, 120, 60);
    const input = actionSchema.parse(body);
    const next = await applyAction(db, actor.id, input);
    return json({ user: actor, mode, ...next });
  } catch (error) {
    return failure(error);
  }
}
