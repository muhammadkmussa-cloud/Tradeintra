import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import { StudioError } from "@/lib/server/studio/types";
import {
  creditBalance,
  rateLimit,
  sessionActor,
  SESSION_COOKIE,
} from "@/lib/server/studio/auth";
import { checkOrigin, readJson } from "@/lib/server/studio/http";
import { listInvoices } from "@/lib/server/invoices";
import {
  CREDIT_PACKS,
  listCreditPurchases,
  purchaseCredits,
} from "@/lib/server/payments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers });

async function actor(request: NextRequest) {
  if (studioMode() === "disabled")
    throw new StudioError(503, "Server billing is not configured.");
  const db = await getStudioDb();
  const session = await sessionActor(
    db,
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  if (!session)
    throw new StudioError(401, "Sign in to manage credits.", "UNAUTHENTICATED");
  return { db, session };
}

function failure(error: unknown) {
  if (error instanceof StudioError)
    return json({ error: error.message, code: error.code }, error.status);
  console.error("Credit request unavailable; details omitted.");
  return json({ error: "The credit service is unavailable." }, 503);
}

export async function GET(request: NextRequest) {
  try {
    const { db, session } = await actor(request);
    return json({
      packs: CREDIT_PACKS,
      credits: await creditBalance(db, session.id),
      purchases: await listCreditPurchases(db, session.id),
      invoices: await listInvoices(db, session.id),
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const { db, session } = await actor(request);
    await rateLimit(db, `credits:${session.id}`, 20, 60);
    const body = await readJson(request);
    const input =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const provider = String(input.provider ?? "mock") as
      "mock" | "paystack" | "mpesa";
    if (!["mock", "paystack", "mpesa"].includes(provider))
      throw new StudioError(
        422,
        "Choose a supported payment provider.",
        "INVALID_PROVIDER",
      );
    const result = await purchaseCredits(
      db,
      session.id,
      String(input.packId ?? ""),
      provider,
    );
    return json({
      ...result,
      purchases: await listCreditPurchases(db, session.id),
      invoices: await listInvoices(db, session.id),
    });
  } catch (error) {
    return failure(error);
  }
}
