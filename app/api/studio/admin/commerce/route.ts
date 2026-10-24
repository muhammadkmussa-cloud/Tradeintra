import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import { StudioError } from "@/lib/server/studio/types";
import { sessionActor, SESSION_COOKIE } from "@/lib/server/studio/auth";
import { checkOrigin, readJson } from "@/lib/server/studio/http";
import {
  approveSeller,
  executePayout,
  listAllPayouts,
  listSellerProfiles,
  setPayoutStatus,
} from "@/lib/server/marketplace";
import { listAllAudit } from "@/lib/server/audit";
import {
  domainPriceRules,
  listAllCommissions,
  listAllTransferRequests,
  setTransferStatus,
  recordCommission,
  reviewCommission,
  updateDomainPriceRule,
} from "@/lib/server/commerce";

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
  if (!["super_admin", "finance", "support"].includes(actor.role))
    throw new StudioError(403, "Admin access is required.", "FORBIDDEN");
  return { db, role: actor.role, actorId: actor.id };
}
function requireRole(role: string, allowed: string[]) {
  if (!allowed.includes(role))
    throw new StudioError(
      403,
      "Your admin role cannot perform this action.",
      "FORBIDDEN",
    );
}
function failure(error: unknown) {
  if (error instanceof StudioError)
    return json({ error: error.message, code: error.code }, error.status);
  console.error("Admin commerce unavailable; details omitted.");
  return json({ error: "The admin commerce service is unavailable." }, 503);
}

export async function GET(request: NextRequest) {
  try {
    const { db, role, actorId } = await admin(request);
    if (role === "support")
      return json({
        sellers: await listSellerProfiles(db),
        payouts: [],
        commissions: [],
        domainPrices: [],
        transfers: await listAllTransferRequests(db),
        audit: [],
      });
    if (role === "finance")
      return json({
        sellers: [],
        payouts: await listAllPayouts(db),
        commissions: await listAllCommissions(db),
        domainPrices: [],
        transfers: [],
        audit: [],
      });
    return json({
      sellers: await listSellerProfiles(db),
      payouts: await listAllPayouts(db),
      commissions: await listAllCommissions(db),
      domainPrices: await domainPriceRules(db),
      transfers: await listAllTransferRequests(db),
      audit: role === "super_admin" ? await listAllAudit(db) : [],
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const { db, role, actorId } = await admin(request);
    const body = await readJson(request);
    const input =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const action = String(input.action ?? "");
    if (action === "seller-status") {
      requireRole(role, ["super_admin", "support"]);
      const status = String(input.status ?? "") as "approved" | "suspended";
      if (!["approved", "suspended"].includes(status))
        throw new StudioError(422, "Invalid seller status.", "VALIDATION");
      return json({
        seller: await approveSeller(db, String(input.accountId ?? ""), status),
      });
    }
    if (action === "payout-pay") {
      requireRole(role, ["super_admin", "finance"]);
      return json({
        payout: await executePayout(
          db,
          String(input.accountId ?? ""),
          String(input.payoutId ?? ""),
        ),
      });
    }
    if (action === "payout-status") {
      requireRole(role, ["super_admin", "finance"]);
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
    if (action === "transfer-status") {
      requireRole(role, ["super_admin", "support"]);
      const status = String(input.status ?? "") as
        "requested" | "approved" | "rejected" | "completed";
      if (!["requested", "approved", "rejected", "completed"].includes(status))
        throw new StudioError(422, "Invalid transfer status.", "VALIDATION");
      return json({
        transfer: await setTransferStatus(db, String(input.id ?? ""), status),
      });
    }
    if (action === "domain-price") {
      requireRole(role, ["super_admin"]);
      return json({
        rule: await updateDomainPriceRule(
          db,
          String(input.tld ?? ""),
          Number(input.registrationPrice ?? 0),
          Number(input.renewalPrice ?? 0),
          Number(input.markupPercent ?? 15),
        ),
      });
    }
    if (action === "commission") {
      requireRole(role, ["super_admin", "finance"]);
      return json(
        await recordCommission(
          db,
          String(input.accountId ?? ""),
          input.siteId ? String(input.siteId) : null,
          String(input.period ?? new Date().toISOString().slice(0, 7)),
          Number(input.gross ?? 0),
          String(input.status ?? "imported") as
            | "estimated"
            | "imported"
            | "settled"
            | "reversed"
            | "submitted"
            | "approved"
            | "rejected",
          input.reference ? String(input.reference) : undefined,
        ),
      );
    }
    if (action === "review-commission") {
      requireRole(role, ["super_admin", "finance"]);
      const status = String(input.status ?? "") as
        "approved" | "rejected" | "settled";
      if (!["approved", "rejected", "settled"].includes(status))
        throw new StudioError(422, "Invalid commission status.", "VALIDATION");
      return json({
        commissions: await reviewCommission(
          db,
          String(input.id ?? ""),
          status,
          String(input.note ?? ""),
          actorId,
        ),
      });
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
