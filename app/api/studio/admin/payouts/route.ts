import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import { StudioError } from "@/lib/server/studio/types";
import { sessionActor, SESSION_COOKIE } from "@/lib/server/studio/auth";
import { checkOrigin, readJson } from "@/lib/server/studio/http";
import { setPayoutStatus } from "@/lib/server/marketplace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers });

async function admin(request: NextRequest) {
  if (studioMode() === "disabled")
    throw new StudioError(503, "Payouts are not configured.");
  const db = await getStudioDb();
  const actor = await sessionActor(
    db,
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  if (!actor) throw new StudioError(401, "Sign in first.", "UNAUTHENTICATED");
  if (!["super_admin", "finance"].includes(actor.role))
    throw new StudioError(403, "Finance access is required.", "FORBIDDEN");
  return db;
}
function failure(error: unknown) {
  if (error instanceof StudioError)
    return json({ error: error.message, code: error.code }, error.status);
  console.error("Admin payout request unavailable; details omitted.");
  return json({ error: "The payout service is unavailable." }, 503);
}

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const db = await admin(request);
    const body = await readJson(request);
    const input =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const status = String(input.status ?? "") as
      "review" | "approved" | "paid" | "rejected";
    if (!["review", "approved", "paid", "rejected"].includes(status))
      throw new StudioError(422, "Invalid payout status.", "VALIDATION");
    return json(
      await setPayoutStatus(
        db,
        String(input.accountId ?? ""),
        String(input.payoutId ?? ""),
        status,
      ),
    );
  } catch (error) {
    return failure(error);
  }
}
