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
  getTelegramConnection,
  removeTelegramConnection,
  testTelegramConnection,
  upsertTelegramConnection,
} from "@/lib/server/telegram";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers });

async function actor(request: NextRequest) {
  if (studioMode() === "disabled")
    throw new StudioError(503, "Telegram is not configured.");
  const db = await getStudioDb();
  const session = await sessionActor(
    db,
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  if (!session)
    throw new StudioError(
      401,
      "Sign in to manage Telegram.",
      "UNAUTHENTICATED",
    );
  return { db, session };
}
function failure(error: unknown) {
  if (error instanceof StudioError)
    return json({ error: error.message, code: error.code }, error.status);
  console.error("Telegram request unavailable; details omitted.");
  return json({ error: "The Telegram service is unavailable." }, 503);
}

export async function GET(request: NextRequest) {
  try {
    const { db, session } = await actor(request);
    const connection = await getTelegramConnection(db, session.id);
    return json({
      connected: Boolean(connection),
      chatId: connection?.chatId ?? null,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const { db, session } = await actor(request);
    await rateLimit(db, `telegram:${session.id}`, 20, 60);
    const body = await readJson(request);
    const input =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const action = String(input.action ?? "");
    if (action === "connect")
      return json(
        await upsertTelegramConnection(
          db,
          session.id,
          String(input.botToken ?? ""),
          String(input.chatId ?? ""),
        ),
      );
    if (action === "test")
      return json(await testTelegramConnection(db, session.id));
    if (action === "remove")
      return json(await removeTelegramConnection(db, session.id));
    throw new StudioError(400, "Unknown Telegram action.", "INVALID_ACTION");
  } catch (error) {
    return failure(error);
  }
}
