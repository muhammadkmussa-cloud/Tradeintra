import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import { StudioError } from "@/lib/server/studio/types";
import { createPasswordReset, rateLimit } from "@/lib/server/studio/auth";
import { checkOrigin, readJson } from "@/lib/server/studio/http";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const schema = z
  .object({ email: z.string().trim().toLowerCase().email().max(254) })
  .strict();

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const mode = studioMode();
    if (mode === "disabled")
      throw new StudioError(503, "Password recovery is not configured.");
    const body = await readJson(request);
    const input = schema.parse(body);
    const db = await getStudioDb();
    await rateLimit(db, `reset:${input.email}`, 3, 900);
    await rateLimit(db, "reset-global", 1000, 3600);
    const account = await db
      .selectFrom("credentials")
      .select("id")
      .where("email", "=", input.email)
      .executeTakeFirst();
    const token = account ? await createPasswordReset(db, account.id) : null;
    await new Promise((resolve) => setTimeout(resolve, 120));
    return NextResponse.json({
      sent: true,
      ...(mode === "local" && token ? { devResetToken: token } : {}),
    });
  } catch (error) {
    if (error instanceof StudioError)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    // Never disclose whether an address exists.
    return NextResponse.json({ sent: true });
  }
}
