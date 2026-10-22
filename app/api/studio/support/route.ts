import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import { StudioError } from "@/lib/server/studio/types";
import { sessionActor, SESSION_COOKIE } from "@/lib/server/studio/auth";
import { checkOrigin, readJson } from "@/lib/server/studio/http";
import {
  closeTicket,
  createTicket,
  listTickets,
  replyTicket,
} from "@/lib/server/support";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers });
async function actor(request: NextRequest) {
  if (studioMode() === "disabled")
    throw new StudioError(503, "Support is not configured.");
  const db = await getStudioDb();
  const session = await sessionActor(
    db,
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  if (!session)
    throw new StudioError(401, "Sign in to use support.", "UNAUTHENTICATED");
  return { db, session };
}
function failure(error: unknown) {
  if (error instanceof StudioError)
    return json({ error: error.message, code: error.code }, error.status);
  console.error("Support request unavailable; details omitted.");
  return json({ error: "Support is unavailable." }, 503);
}
export async function GET(request: NextRequest) {
  try {
    const { db, session } = await actor(request);
    return json({ tickets: await listTickets(db, session.id) });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const { db, session } = await actor(request);
    const body = await readJson(request);
    if (!body || typeof body !== "object")
      throw new StudioError(422, "Invalid request.", "VALIDATION");
    const input = body as Record<string, unknown>;
    const action = String(input.action ?? "");
    const category = String(input.category ?? "site");
    if (!["account", "domain", "site", "billing", "abuse"].includes(category))
      throw new StudioError(422, "Invalid support category.", "VALIDATION");
    const ticketId = String(input.ticketId ?? "");
    if (ticketId && !/^[0-9a-f-]{36}$/i.test(ticketId))
      throw new StudioError(422, "Invalid ticket ID.", "VALIDATION");
    if (action === "create")
      return json({
        ticket: await createTicket(
          db,
          session.id,
          String(input.subject ?? ""),
          String(input.category ?? "site") as
            "account" | "domain" | "site" | "billing" | "abuse",
          String(input.body ?? ""),
        ),
      });
    if (action === "reply")
      return json({
        ok: await replyTicket(
          db,
          session.id,
          String(input.ticketId ?? ""),
          String(input.body ?? ""),
        ),
      });
    if (action === "close")
      return json({
        ok: await closeTicket(db, session.id, String(input.ticketId ?? "")),
      });
    throw new StudioError(400, "Unknown support action.", "INVALID_ACTION");
  } catch (error) {
    return failure(error);
  }
}
