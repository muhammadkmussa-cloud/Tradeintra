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
  advanceDomain,
  buyDomain,
  connectDomain,
  listDomainOrders,
  listDomains,
  listTransferRequests,
  quoteDomain,
  requestTransfer,
  removeDomain,
  renewDomain,
  searchDomains,
} from "@/lib/server/commerce";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers });

async function actor(request: NextRequest) {
  const mode = studioMode();
  if (mode === "disabled")
    throw new StudioError(503, "Server domains are not configured.");
  const db = await getStudioDb();
  const session = await sessionActor(
    db,
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  if (!session)
    throw new StudioError(401, "Sign in to manage domains.", "UNAUTHENTICATED");
  return { db, session };
}

function failure(error: unknown) {
  if (error instanceof StudioError)
    return json(
      { error: error.message, code: error.code, fields: error.fields },
      error.status,
    );
  console.error("Domain request unavailable; details omitted.");
  return json({ error: "The domain service is unavailable. Try again." }, 503);
}

export async function GET(request: NextRequest) {
  try {
    const { db, session } = await actor(request);
    return json({
      domains: await listDomains(db, session.id),
      orders: await listDomainOrders(db, session.id),
      transfers: await listTransferRequests(db, session.id),
      kesRate: Number(process.env.MPESA_USD_KES_RATE) || 130,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const { db, session } = await actor(request);
    await rateLimit(db, `domains:${session.id}`, 60, 60);
    const body = await readJson(request);
    const input =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const action = String(input.action ?? "");
    if (action === "search") {
      const query = String(input.query ?? "");
      const owned = (await listDomains(db, session.id)).map(
        (domain) => domain.name,
      );
      return json({ results: await searchDomains(db, query, owned) });
    }
    if (action === "quote") {
      return json({
        quote: await quoteDomain(
          db,
          String(input.name ?? ""),
          Number(input.years ?? 1),
        ),
      });
    }
    if (action === "buy") {
      const contactInput =
        input.contact && typeof input.contact === "object"
          ? (input.contact as Record<string, unknown>)
          : null;
      const contact = contactInput
        ? {
            firstName: String(contactInput.firstName ?? ""),
            lastName: String(contactInput.lastName ?? ""),
            address1: String(contactInput.address1 ?? ""),
            city: String(contactInput.city ?? ""),
            state: String(contactInput.state ?? ""),
            postalCode: String(contactInput.postalCode ?? ""),
            country: String(contactInput.country ?? "").toUpperCase(),
            phone: String(contactInput.phone ?? ""),
            email: String(contactInput.email ?? ""),
          }
        : undefined;
      if (contact && Object.values(contact).some((value) => !value.trim()))
        throw new StudioError(
          422,
          "Complete all registrant contact fields.",
          "VALIDATION",
        );
      const domains = await buyDomain(
        db,
        session.id,
        String(input.siteId ?? ""),
        String(input.name ?? ""),
        Number(input.years ?? 1),
        String(input.idempotencyKey ?? crypto.randomUUID()),
        contact,
        input.expectedPrice === undefined
          ? undefined
          : Number(input.expectedPrice),
      );
      return json({ domains, orders: await listDomainOrders(db, session.id) });
    }
    if (action === "connect") {
      const domains = await connectDomain(
        db,
        session.id,
        String(input.siteId ?? ""),
        String(input.name ?? ""),
      );
      return json({ domains });
    }
    if (action === "transfer") {
      const direction = String(input.direction ?? "out");
      if (!["in", "out"].includes(direction))
        throw new StudioError(422, "Invalid transfer direction.", "VALIDATION");
      return json({
        transfer: await requestTransfer(
          db,
          session.id,
          direction as "in" | "out",
          String(input.name ?? ""),
          String(input.note ?? ""),
          String(input.authCode ?? ""),
        ),
        transfers: await listTransferRequests(db, session.id),
      });
    }
    if (action === "verify") {
      return json({
        domains: await advanceDomain(
          db,
          session.id,
          String(input.domainId ?? ""),
        ),
      });
    }
    if (action === "renew") {
      return json({
        domains: await renewDomain(
          db,
          session.id,
          String(input.domainId ?? ""),
          Number(input.years ?? 1),
        ),
      });
    }
    if (action === "remove") {
      return json({
        domains: await removeDomain(
          db,
          session.id,
          String(input.domainId ?? ""),
        ),
      });
    }
    throw new StudioError(400, "Unknown domain action.", "INVALID_ACTION");
  } catch (error) {
    return failure(error);
  }
}
