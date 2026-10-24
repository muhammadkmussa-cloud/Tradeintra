import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import { StudioError } from "@/lib/server/studio/types";
import {
  rateLimit,
  sessionActor,
  SESSION_COOKIE,
} from "@/lib/server/studio/auth";
import { checkOrigin, readJson } from "@/lib/server/studio/http";
import { commissionSummary, recordCommission } from "@/lib/server/commerce";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers });

async function admin(request: NextRequest) {
  if (studioMode() === "disabled")
    throw new StudioError(503, "Server billing is not configured.");
  const db = await getStudioDb();
  const actor = await sessionActor(
    db,
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  if (!actor) throw new StudioError(401, "Sign in first.", "UNAUTHENTICATED");
  if (!["super_admin", "finance"].includes(actor.role))
    throw new StudioError(403, "Finance access is required.", "FORBIDDEN");
  return { db, actor };
}

function failure(error: unknown) {
  if (error instanceof StudioError)
    return json({ error: error.message, code: error.code }, error.status);
  console.error("Commission request unavailable; details omitted.");
  return json({ error: "The commission service is unavailable." }, 503);
}

export async function GET(request: NextRequest) {
  try {
    const { db } = await admin(request);
    const accountId = new URL(request.url).searchParams.get("accountId") ?? "";
    if (!accountId)
      throw new StudioError(422, "accountId is required.", "VALIDATION");
    return json(await commissionSummary(db, accountId));
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const { db, actor } = await admin(request);
    await rateLimit(db, `admin-commission:${actor.id}`, 30, 60);
    const body = await readJson(request);
    const input =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const accountId = String(input.accountId ?? "");
    if (!accountId)
      throw new StudioError(422, "accountId is required.", "VALIDATION");
    const status = String(input.status ?? "imported") as
      | "estimated"
      | "imported"
      | "settled"
      | "reversed"
      | "submitted"
      | "approved"
      | "rejected";
    if (
      ![
        "estimated",
        "imported",
        "settled",
        "reversed",
        "submitted",
        "approved",
        "rejected",
      ].includes(status)
    )
      throw new StudioError(422, "Invalid commission status.", "VALIDATION");
    return json(
      await recordCommission(
        db,
        accountId,
        input.siteId ? String(input.siteId) : null,
        String(input.period ?? new Date().toISOString().slice(0, 7)),
        Number(input.gross ?? 0),
        status,
        input.reference ? String(input.reference) : undefined,
      ),
    );
  } catch (error) {
    return failure(error);
  }
}
