import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import { StudioError } from "@/lib/server/studio/types";
import { sessionActor, SESSION_COOKIE } from "@/lib/server/studio/auth";
import { checkOrigin, readJson } from "@/lib/server/studio/http";
import {
  approveSeller,
  listAllPayouts,
  listSellerProfiles,
  setPayoutStatus,
} from "@/lib/server/marketplace";
import { listAllCommissions, recordCommission } from "@/lib/server/commerce";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers });

async function admin(request: NextRequest) {
  if (studioMode() === "disabled")
    throw new StudioError(503, "Admin commerce is not configured.");
  const db = await getStudioDb();
  const actor = await sessionActor(
    db,
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  if (!actor) throw new StudioError(401, "Sign in first.", "UNAUTHENTICATED");
  if (actor.role !== "super_admin")
    throw new StudioError(403, "Super Admin access is required.", "FORBIDDEN");
  return db;
}
function failure(error: unknown) {
  if (error instanceof StudioError)
    return json({ error: error.message, code: error.code }, error.status);
  console.error("Admin commerce unavailable; details omitted.");
  return json({ error: "The admin commerce service is unavailable." }, 503);
}

export async function GET(request: NextRequest) {
  try {
    const db = await admin(request);
    return json({
      sellers: await listSellerProfiles(db),
      payouts: await listAllPayouts(db),
      commissions: await listAllCommissions(db),
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const db = await admin(request);
    const body = await readJson(request);
    const input =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const action = String(input.action ?? "");
    if (action === "seller-status") {
      const status = String(input.status ?? "") as "approved" | "suspended";
      if (!["approved", "suspended"].includes(status))
        throw new StudioError(422, "Invalid seller status.", "VALIDATION");
      return json({
        seller: await approveSeller(db, String(input.accountId ?? ""), status),
      });
    }
    if (action === "payout-status") {
      const status = String(input.status ?? "") as
        "review" | "approved" | "paid" | "rejected";
      if (!["review", "approved", "paid", "rejected"].includes(status))
        throw new StudioError(422, "Invalid payout status.", "VALIDATION");
      return json({
        payout: await setPayoutStatus(
          db,
          String(input.accountId ?? ""),
          String(input.payoutId ?? ""),
          status,
        ),
      });
    }
    if (action === "commission") {
      return json(
        await recordCommission(
          db,
          String(input.accountId ?? ""),
          input.siteId ? String(input.siteId) : null,
          String(input.period ?? new Date().toISOString().slice(0, 7)),
          Number(input.gross ?? 0),
          String(input.status ?? "imported") as
            "estimated" | "imported" | "settled" | "reversed",
          input.reference ? String(input.reference) : undefined,
        ),
      );
    }
    throw new StudioError(
      400,
      "Unknown admin commerce action.",
      "INVALID_ACTION",
    );
  } catch (error) {
    return failure(error);
  }
}
