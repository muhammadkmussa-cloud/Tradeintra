import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import { StudioError } from "@/lib/server/studio/types";
import { sessionActor, SESSION_COOKIE } from "@/lib/server/studio/auth";
import { getBuyerDelivery } from "@/lib/server/marketplace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    if (studioMode() === "disabled")
      throw new StudioError(503, "Marketplace delivery is not configured.");
    const db = await getStudioDb();
    const actor = await sessionActor(
      db,
      request.cookies.get(SESSION_COOKIE)?.value,
    );
    if (!actor)
      throw new StudioError(
        401,
        "Sign in to download a delivery.",
        "UNAUTHENTICATED",
      );
    const orderId = new URL(request.url).searchParams.get("orderId") ?? "";
    const delivery = await getBuyerDelivery(db, actor.id, orderId);
    return new NextResponse(delivery.content, {
      headers: {
        "Content-Type": delivery.delivery_mime ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${(delivery.delivery_filename ?? "delivery.txt").replace(/[^a-z0-9._-]/gi, "-")}"`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    if (error instanceof StudioError)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    console.error("Marketplace delivery unavailable; details omitted.");
    return NextResponse.json(
      { error: "Delivery unavailable." },
      { status: 503 },
    );
  }
}
