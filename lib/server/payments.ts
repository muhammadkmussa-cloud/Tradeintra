import { createHash, randomUUID } from "node:crypto";
import type { StudioDb } from "./studio/types";
import { scope, serviceScope } from "./studio/database";
import { StudioError } from "./studio/types";
import { creditBalance, grantCredits } from "./studio/auth";
import { createCheckout } from "./providers/payments";

export const CREDIT_PACKS = [
  { id: "starter", credits: 30, amount: 4.99, currency: "USD" as const },
  { id: "operator", credits: 65, amount: 9.99, currency: "USD" as const },
  { id: "scale", credits: 150, amount: 19.99, currency: "USD" as const },
];

export type CreditPack = (typeof CREDIT_PACKS)[number];

export async function listCreditPurchases(db: StudioDb, account: string) {
  return scope(db, account, (tx) =>
    tx
      .selectFrom("credit_purchases")
      .selectAll()
      .where("account_id", "=", account)
      .orderBy("created_at", "desc")
      .execute(),
  );
}

export async function purchaseCredits(
  db: StudioDb,
  account: string,
  packId: string,
  provider: "mock" | "paystack" | "mpesa",
) {
  const pack = CREDIT_PACKS.find((item) => item.id === packId);
  if (!pack)
    throw new StudioError(422, "Choose a valid credit pack.", "INVALID_PACK");
  const purchaseId = randomUUID();
  const reference = `${provider}-${purchaseId}`;
  const credential = await db
    .selectFrom("credentials")
    .select("email")
    .where("id", "=", account)
    .executeTakeFirst();
  const checkout = await createCheckout({
    provider,
    amount: pack.amount,
    currency: pack.currency,
    reference,
    description: `${pack.credits} AI credits`,
    email: credential?.email,
  });
  const result = await scope(db, account, async (tx) => {
    await tx
      .insertInto("credit_purchases")
      .values({
        id: purchaseId,
        account_id: account,
        pack_credits: pack.credits,
        amount: String(pack.amount),
        currency: pack.currency,
        provider,
        provider_reference: checkout.id,
        status: checkout.status === "paid" ? "paid" : "pending",
        paid_at: checkout.status === "paid" ? new Date() : null,
      })
      .execute();
    if (checkout.status === "paid")
      await tx
        .insertInto("credit_ledger")
        .values({
          id: randomUUID(),
          account_id: account,
          delta: pack.credits,
          reason: "Credit pack",
          reference: purchaseId,
        })
        .execute();
    return {
      purchaseId,
      reference,
      checkoutUrl: checkout.checkoutUrl,
      status: checkout.status,
    };
  });
  return { ...result, credits: await creditBalance(db, account) };
}

export async function settleCreditPurchase(
  db: StudioDb,
  provider: "paystack" | "mpesa" | "mock",
  providerReference: string,
  providerEventId: string,
  payload: string,
) {
  const payloadHash = createHash("sha256").update(payload).digest("hex");
  return serviceScope(db, async (tx) => {
    const existingEvent = await tx
      .selectFrom("payment_events")
      .select("id")
      .where("provider", "=", provider)
      .where("provider_event_id", "=", providerEventId)
      .executeTakeFirst();
    if (existingEvent) return { status: "duplicate" as const };
    const purchase = await tx
      .selectFrom("credit_purchases")
      .selectAll()
      .where("provider_reference", "=", providerReference)
      .forUpdate()
      .executeTakeFirst();
    if (!purchase)
      throw new StudioError(404, "Payment reference not found.", "NOT_FOUND");
    await tx
      .insertInto("payment_events")
      .values({
        id: randomUUID(),
        provider,
        provider_event_id: providerEventId,
        purchase_id: purchase.id,
        payload_hash: payloadHash,
        status: purchase.status === "paid" ? "ignored" : "processed",
      })
      .execute();
    if (purchase.status === "paid") return { status: "already_paid" as const };
    await tx
      .updateTable("credit_purchases")
      .set({ status: "paid", paid_at: new Date() })
      .where("id", "=", purchase.id)
      .execute();
    await tx
      .insertInto("credit_ledger")
      .values({
        id: randomUUID(),
        account_id: purchase.account_id,
        delta: purchase.pack_credits,
        reason: "Credit pack",
        reference: purchase.id,
      })
      .execute();
    return { status: "paid" as const, accountId: purchase.account_id };
  });
}
