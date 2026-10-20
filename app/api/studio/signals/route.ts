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
  createSignalOrder,
  deliverSignal,
  listDeliveries,
  listSignals,
  setSignalStatus,
} from "@/lib/server/signals";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers });

async function actor(request: NextRequest) {
  if (studioMode() === "disabled")
    throw new StudioError(503, "Signals are not configured.");
  const db = await getStudioDb();
  const session = await sessionActor(
    db,
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  if (!session)
    throw new StudioError(401, "Sign in to manage signals.", "UNAUTHENTICATED");
  return { db, session };
}
function failure(error: unknown) {
  if (error instanceof StudioError)
    return json({ error: error.message, code: error.code }, error.status);
  console.error("Signal request unavailable; details omitted.");
  return json({ error: "The signal service is unavailable." }, 503);
}

export async function GET(request: NextRequest) {
  try {
    const { db, session } = await actor(request);
    const orderId = new URL(request.url).searchParams.get("orderId");
    return json({
      orders: await listSignals(db, session.id),
      ...(orderId
        ? { deliveries: await listDeliveries(db, session.id, orderId) }
        : {}),
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const { db, session } = await actor(request);
    await rateLimit(db, `signals:${session.id}`, 40, 60);
    const body = await readJson(request);
    const input =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const action = String(input.action ?? "");
    if (action === "create")
      return json({
        order: await createSignalOrder(
          db,
          session.id,
          String(input.name ?? ""),
          String(input.interval ?? "5m"),
          String(input.telegram ?? ""),
        ),
      });
    if (action === "status")
      return json({
        order: await setSignalStatus(
          db,
          session.id,
          String(input.orderId ?? ""),
          String(input.status ?? "paused") as
            "trial" | "active" | "paused" | "cancelled" | "expired",
        ),
      });
    if (action === "deliver")
      return json({
        delivery: await deliverSignal(
          db,
          session.id,
          String(input.orderId ?? ""),
          String(input.message ?? ""),
        ),
      });
    throw new StudioError(400, "Unknown signal action.", "INVALID_ACTION");
  } catch (error) {
    return failure(error);
  }
}
