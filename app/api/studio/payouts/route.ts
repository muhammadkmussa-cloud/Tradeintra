import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import { StudioError } from "@/lib/server/studio/types";
import {
  rateLimit,
  sessionActor,
  SESSION_COOKIE,
} from "@/lib/server/studio/auth";
import { checkOrigin, readJson } from "@/lib/server/studio/http";
import {
  earningsSummary,
  releaseEarnings,
  requestPayout,
} from "@/lib/server/marketplace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers });

async function actor(request: NextRequest) {
  if (studioMode() === "disabled")
    throw new StudioError(503, "Payouts are not configured.");
  const db = await getStudioDb();
  const session = await sessionActor(
    db,
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  if (!session)
    throw new StudioError(401, "Sign in to manage payouts.", "UNAUTHENTICATED");
  return { db, session };
}
function failure(error: unknown) {
  if (error instanceof StudioError)
    return json({ error: error.message, code: error.code }, error.status);
  console.error("Payout request unavailable; details omitted.");
  return json({ error: "The payout service is unavailable." }, 503);
}

export async function GET(request: NextRequest) {
  try {
    const { db, session } = await actor(request);
    return json(await earningsSummary(db, session.id));
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const { db, session } = await actor(request);
    await rateLimit(db, `payouts:${session.id}`, 20, 60);
    const body = await readJson(request);
    const input =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const action = String(input.action ?? "request");
    if (action === "release")
      return json(await releaseEarnings(db, session.id));
    if (action === "request")
      return json({
        payout: await requestPayout(
          db,
          session.id,
          Number(input.amount ?? 0),
          String(input.method ?? "mpesa") as "mpesa" | "bank" | "crypto",
        ),
      });
    throw new StudioError(400, "Unknown payout action.", "INVALID_ACTION");
  } catch (error) {
    return failure(error);
  }
}
