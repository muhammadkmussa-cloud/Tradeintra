import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import { StudioError } from "@/lib/server/studio/types";
import { sessionActor, SESSION_COOKIE } from "@/lib/server/studio/auth";
import { checkOrigin, readJson } from "@/lib/server/studio/http";
import {
  createAnnouncement,
  listAnnouncements,
  publishAnnouncement,
} from "@/lib/server/announcements";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers });
async function actor(request: NextRequest) {
  if (studioMode() === "disabled")
    throw new StudioError(503, "Announcements are not configured.");
  const db = await getStudioDb();
  const session = await sessionActor(
    db,
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  if (!session)
    throw new StudioError(
      401,
      "Sign in to manage announcements.",
      "UNAUTHENTICATED",
    );
  return { db, session };
}
function failure(error: unknown) {
  if (error instanceof StudioError)
    return json({ error: error.message, code: error.code }, error.status);
  console.error("Announcement request unavailable; details omitted.");
  return json({ error: "Announcements are unavailable." }, 503);
}
export async function GET(request: NextRequest) {
  try {
    const { db, session } = await actor(request);
    return json({ announcements: await listAnnouncements(db, session.id) });
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
    const announcementId = String(input.announcementId ?? "");
    if (announcementId && !/^[0-9a-f-]{36}$/i.test(announcementId))
      throw new StudioError(422, "Invalid announcement ID.", "VALIDATION");
    if (action === "create")
      return json({
        announcement: await createAnnouncement(
          db,
          session.id,
          String(input.title ?? ""),
          String(input.body ?? ""),
          String(input.target ?? "all"),
        ),
      });
    if (action === "publish")
      return json({
        ok: await publishAnnouncement(
          db,
          session.id,
          String(input.announcementId ?? ""),
        ),
      });
    throw new StudioError(
      400,
      "Unknown announcement action.",
      "INVALID_ACTION",
    );
  } catch (error) {
    return failure(error);
  }
}
