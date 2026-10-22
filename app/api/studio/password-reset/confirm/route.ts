import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import { StudioError } from "@/lib/server/studio/types";
import { rateLimit, resetPassword } from "@/lib/server/studio/auth";
import { checkOrigin, readJson } from "@/lib/server/studio/http";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const schema = z
  .object({
    token: z.string().min(20).max(100),
    password: z.string().min(8).max(128),
  })
  .strict();

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    if (studioMode() === "disabled")
      throw new StudioError(503, "Password recovery is not configured.");
    const body = await readJson(request);
    const input = schema.parse(body);
    const db = await getStudioDb();
    await rateLimit(db, "reset-confirm", 30, 3600);
    const result = await resetPassword(db, input.token, input.password);
    return NextResponse.json({ reset: true, accountId: result.accountId });
  } catch (error) {
    if (error instanceof StudioError)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    return NextResponse.json(
      { error: "Password reset failed. Request a new link." },
      { status: 400 },
    );
  }
}
