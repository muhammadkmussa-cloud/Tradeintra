import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getStudioDb, serviceScope } from "../lib/server/studio/database";
import type { StudioDb, Actor } from "../lib/server/studio/types";
import {
  authenticate,
  creditBalance,
  sessionActor,
} from "../lib/server/studio/auth";
import { listInvoices } from "../lib/server/invoices";
import {
  listCreditPurchases,
  purchaseCredits,
  settlePayment,
} from "../lib/server/payments";

let db: StudioDb;
let directory: string;
let actor: Actor;
let token: string;

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "tradeintra-payments-"));
  process.env.STUDIO_DB_MODE = "local";
  process.env.STUDIO_ENV = "local";
  process.env.STUDIO_DATA_DIR = directory;
  db = await getStudioDb();
  const auth = await authenticate(
    db,
    "payments@example.test",
    "PaymentsPass1",
    true,
    { fullName: "Payments Operator" },
  );
  actor = auth.actor;
  token = auth.token;
}, 30000);

afterAll(async () => {
  delete process.env.SUPER_ADMIN_EMAILS;
  await db?.destroy();
  await rm(directory, { recursive: true, force: true });
  delete process.env.STUDIO_DB_MODE;
  delete process.env.STUDIO_ENV;
  delete process.env.STUDIO_DATA_DIR;
});

describe("credit checkout and webhooks", () => {
  it("grants credits for a mock purchase and lists the purchase", async () => {
    const result = await purchaseCredits(db, actor.id, "starter", "mock");
    expect(result.status).toBe("paid");
    expect(result.credits).toBe(30);
    const purchases = await listCreditPurchases(db, actor.id);
    expect(purchases[0]).toMatchObject({
      pack_credits: 30,
      provider: "mock",
      status: "paid",
    });
  });

  it("settles a pending purchase once and ignores a duplicate event", async () => {
    const purchaseId = randomUUID();
    const reference = `paystack-${purchaseId}`;
    await serviceScope(db, (tx) =>
      tx
        .insertInto("credit_purchases")
        .values({
          id: purchaseId,
          account_id: actor.id,
          pack_credits: 65,
          amount: "9.99",
          currency: "USD",
          provider: "paystack",
          provider_reference: reference,
          status: "pending",
          paid_at: null,
        })
        .execute(),
    );
    const first = await settlePayment(
      db,
      "paystack",
      reference,
      "event-1",
      "{}",
    );
    expect(first.status).toBe("paid");
    expect(await creditBalance(db, actor.id)).toBe(95);
    const duplicate = await settlePayment(
      db,
      "paystack",
      reference,
      "event-1",
      "{}",
    );
    expect(duplicate.status).toBe("duplicate");
    expect(await creditBalance(db, actor.id)).toBe(95);
  });

  it("records an invoice with separately calculated tax", async () => {
    process.env.TAX_RATE_PERCENT = "10";
    await purchaseCredits(db, actor.id, "operator", "mock");
    const invoices = await listInvoices(db, actor.id);
    const invoice = invoices.find((item) => item.kind === "credits");
    expect(invoice).toMatchObject({
      subtotal: "9.99",
      tax: "1.00",
      total: "10.99",
      currency: "USD",
      status: "issued",
    });
    delete process.env.TAX_RATE_PERCENT;
  });

  it("promotes the allowlisted Super Admin email at session time", async () => {
    process.env.SUPER_ADMIN_EMAILS = "payments@example.test";
    expect((await sessionActor(db, token))?.role).toBe("super_admin");
    delete process.env.SUPER_ADMIN_EMAILS;
    expect((await sessionActor(db, token))?.role).toBe("user");
  });
});
