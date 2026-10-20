import { NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import { StudioError } from "@/lib/server/studio/types";
import {
  createEmailVerification,
  rateLimit,
  sessionActor,
  SESSION_COOKIE,
} from "@/lib/server/studio/auth";
import { NextRequest } from "next/server";
import { checkOrigin } from "@/lib/server/studio/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const mode = studioMode();
    if (mode === "disabled")
      throw new StudioError(503, "Verification is not configured.");
    const db = await getStudioDb();
    const actor = await sessionActor(
      db,
      request.cookies.get(SESSION_COOKIE)?.value,
    );
    if (!actor)
      throw new StudioError(
        401,
        "Sign in to resend verification.",
        "UNAUTHENTICATED",
      );
    if (actor.emailVerified) return NextResponse.json({ verified: true });
    await rateLimit(db, `verify-resend:${actor.id}`, 5, 900);
    const token = await createEmailVerification(db, actor.id);
    return NextResponse.json({
      sent: true,
      ...(mode === "local" ? { devVerificationToken: token } : {}),
    });
  } catch (error) {
    if (error instanceof StudioError)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    console.error("Verification resend unavailable; details omitted.");
    return NextResponse.json(
      { error: "Verification resend is unavailable." },
      { status: 503 },
    );
  }
}
