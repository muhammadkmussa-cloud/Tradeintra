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
  applySeller,
  buyListing,
  createListing,
  listBuyerOrders,
  listListings,
  releaseEarnings,
} from "@/lib/server/marketplace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers });

async function actor(request: NextRequest) {
  if (studioMode() === "disabled")
    throw new StudioError(503, "Marketplace is not configured.");
  const db = await getStudioDb();
  const session = await sessionActor(
    db,
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  if (!session)
    throw new StudioError(
      401,
      "Sign in to use the marketplace.",
      "UNAUTHENTICATED",
    );
  return { db, session };
}
function failure(error: unknown) {
  if (error instanceof StudioError)
    return json({ error: error.message, code: error.code }, error.status);
  console.error("Marketplace request unavailable; details omitted.");
  return json({ error: "The marketplace service is unavailable." }, 503);
}

export async function GET(request: NextRequest) {
  try {
    const { db, session } = await actor(request);
    return json({
      listings: await listListings(db),
      mine: await listListings(db, session.id),
      purchases: await listBuyerOrders(db, session.id),
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const { db, session } = await actor(request);
    await rateLimit(db, `marketplace:${session.id}`, 40, 60);
    const body = await readJson(request);
    const input =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const action = String(input.action ?? "");
    if (action === "apply")
      return json({
        profile: await applySeller(
          db,
          session.id,
          String(input.displayName ?? ""),
          String(input.kind ?? "seller") as
            "seller" | "signal_provider" | "both",
          String(input.payoutMethod ?? "mpesa") as "mpesa" | "bank" | "crypto",
        ),
      });
    if (action === "create")
      return json({
        listing: await createListing(
          db,
          session.id,
          String(input.title ?? ""),
          String(input.kind ?? "bot") as "bot" | "pdf" | "course" | "signal",
          Number(input.price ?? 0),
        ),
      });
    if (action === "buy")
      return json({
        order: await buyListing(db, session.id, String(input.listingId ?? "")),
      });
    if (action === "release")
      return json(await releaseEarnings(db, session.id));
    throw new StudioError(400, "Unknown marketplace action.", "INVALID_ACTION");
  } catch (error) {
    return failure(error);
  }
}
