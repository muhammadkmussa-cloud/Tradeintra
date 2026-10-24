import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import { StudioError } from "@/lib/server/studio/types";
import { sessionActor, SESSION_COOKIE } from "@/lib/server/studio/auth";
import { getCommissionStatement, sanitizeCsv } from "@/lib/server/commerce";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (studioMode() === "disabled")
      throw new StudioError(503, "Commissions are not configured.");
    const db = await getStudioDb();
    const actor = await sessionActor(
      db,
      request.cookies.get(SESSION_COOKIE)?.value,
    );
    if (!actor) throw new StudioError(401, "Sign in first.", "UNAUTHENTICATED");
    if (!["super_admin", "finance"].includes(actor.role))
      throw new StudioError(403, "Finance access is required.", "FORBIDDEN");
    const { id } = await params;
    const statement = await getCommissionStatement(db, id);
    return new NextResponse(sanitizeCsv(statement.statement_csv ?? ""), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${(statement.statement_name ?? "commission.csv").replace(/[^a-z0-9._-]/gi, "-")}"`,
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    if (error instanceof StudioError)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    console.error("Commission statement unavailable; details omitted.");
    return NextResponse.json(
      { error: "The commission statement is unavailable." },
      { status: 503 },
    );
  }
}
