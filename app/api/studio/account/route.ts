import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import { StudioError } from "@/lib/server/studio/types";
import { sessionActor, SESSION_COOKIE } from "@/lib/server/studio/auth";
import { checkOrigin, readJson } from "@/lib/server/studio/http";
import {
  cancelDeletion,
  exportAccount,
  requestDeletion,
} from "@/lib/server/account";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers });
async function actor(request: NextRequest) {
  if (studioMode() === "disabled")
    throw new StudioError(503, "Account tools are not configured.");
  const db = await getStudioDb();
  const session = await sessionActor(
    db,
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  if (!session) throw new StudioError(401, "Sign in first.", "UNAUTHENTICATED");
  return { db, session };
}
function failure(error: unknown) {
  if (error instanceof StudioError)
    return json({ error: error.message, code: error.code }, error.status);
  console.error("Account request unavailable; details omitted.");
  return json({ error: "Account tools are unavailable." }, 503);
}
export async function GET(request: NextRequest) {
  try {
    const { db, session } = await actor(request);
    return json(await exportAccount(db, session.id));
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const { db, session } = await actor(request);
    const input = (await readJson(request)) as Record<string, unknown>;
    if (input.action === "request-deletion")
      return json(await requestDeletion(db, session.id));
    if (input.action === "cancel-deletion")
      return json(await cancelDeletion(db, session.id));
    throw new StudioError(400, "Unknown account action.", "INVALID_ACTION");
  } catch (error) {
    return failure(error);
  }
}
