import { createHash, randomUUID } from "node:crypto";
import type { StudioDb, StudioTrx } from "./studio/types";
import { scope, serviceScope } from "./studio/database";
import { StudioError } from "./studio/types";
import { creditBalance, grantCredits } from "./studio/auth";
import { createCheckout } from "./providers/payments";
import { issueInvoiceTx } from "./invoices";

export const CREDIT_PACKS = [
  { id: "starter", credits: 30, amount: 4.99, currency: "USD" as const },
  { id: "operator", credits: 65, amount: 9.99, currency: "USD" as const },
  { id: "scale", credits: 150, amount: 19.99, currency: "USD" as const },
];

export type CreditPack = (typeof CREDIT_PACKS)[number];
type PaymentConfirmation = { amount: number; currency: string };

function expectedProviderAmount(
  provider: "paystack" | "mpesa" | "mock",
  amount: number,
  currency: string,
) {
  if (provider === "mpesa")
    return {
      amount: Math.round(
        amount * (Number(process.env.MPESA_USD_KES_RATE) || 130),
      ),
      currency: "KES",
    };
  if (provider === "paystack")
    return { amount: Math.round(amount * 100), currency };
  return { amount: Math.round(amount), currency };
}

function amountMatches(
  provider: "paystack" | "mpesa" | "mock",
  amount: number,
  currency: string,
  confirmation: PaymentConfirmation | undefined,
) {
  if (!confirmation) return true;
  const expected = expectedProviderAmount(provider, amount, currency);
  return (
    expected.currency.toUpperCase() === confirmation.currency.toUpperCase() &&
    expected.amount === Math.round(confirmation.amount)
  );
}

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
    if (checkout.status === "paid") {
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
      await issueInvoiceTx(
        tx,
        account,
        "credits",
        purchaseId,
        `${pack.credits} AI credits`,
        pack.amount,
        pack.currency,
      );
    }
    return {
      purchaseId,
      reference,
      checkoutUrl: checkout.checkoutUrl,
      status: checkout.status,
    };
  });
  return { ...result, credits: await creditBalance(db, account) };
}

async function settleSignalPayment(
  tx: StudioTrx,
  provider: "paystack" | "mpesa" | "mock",
  providerReference: string,
  providerEventId: string,
  payloadHash: string,
  confirmation?: PaymentConfirmation,
) {
  const duplicate = await tx
    .selectFrom("payment_events")
    .select("id")
    .where("provider", "=", provider)
    .where("provider_event_id", "=", providerEventId)
    .executeTakeFirst();
  if (duplicate) return { status: "duplicate" as const };
  const attempt = await tx
    .selectFrom("signal_checkout_attempts")
    .selectAll()
    .where((eb) =>
      eb.or([
        eb("provider_reference", "=", providerReference),
        eb("reference", "=", providerReference),
      ]),
    )
    .forUpdate()
    .executeTakeFirst();
  const order = attempt
    ? await tx
        .selectFrom("signal_orders")
        .selectAll()
        .where("id", "=", attempt.signal_order_id)
        .forUpdate()
        .executeTakeFirst()
    : await tx
        .selectFrom("signal_orders")
        .selectAll()
        .where("provider_reference", "=", providerReference)
        .forUpdate()
        .executeTakeFirst();
  if (!order)
    throw new StudioError(404, "Payment reference not found.", "NOT_FOUND");
  if (order.status === "cancelled")
    throw new StudioError(
      409,
      "This signal is cancelled; payment needs Finance review.",
      "INVALID_STATE",
    );
  const expectedAmount = attempt ? Number(attempt.amount) : Number(order.price);
  const expectedCurrency = attempt?.currency ?? "USD";
  if (
    !amountMatches(provider, expectedAmount, expectedCurrency, confirmation)
  ) {
    await tx
      .insertInto("payment_events")
      .values({
        id: randomUUID(),
        provider,
        provider_event_id: providerEventId,
        purchase_id: null,
        payload_hash: payloadHash,
        status: "failed",
      })
      .execute();
    return { status: "amount_mismatch" as const };
  }
  if (attempt)
    await tx
      .updateTable("signal_checkout_attempts")
      .set({ status: "paid" })
      .where("reference", "=", attempt.reference)
      .execute();
  await tx
    .insertInto("payment_events")
    .values({
      id: randomUUID(),
      provider,
      provider_event_id: providerEventId,
      purchase_id: null,
      payload_hash: payloadHash,
      status: "processed",
    })
    .execute();
  const price = Number(order.price);
  const platformFee = +(price * 0.15).toFixed(2);
  const sellerShare = +(price - platformFee).toFixed(2);
  const base =
    order.paid_until && new Date(order.paid_until) > new Date()
      ? new Date(order.paid_until)
      : new Date();
  const paidUntil = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
  await tx
    .updateTable("signal_orders")
    .set({
      status: "active",
      paid_until: paidUntil,
      platform_fee: String(platformFee),
      seller_share: String(sellerShare),
    })
    .where("id", "=", order.id)
    .execute();
  await issueInvoiceTx(
    tx,
    order.account_id,
    "signal",
    `${order.id}:${paidUntil.toISOString()}`,
    `${order.name} signal · 30 days`,
    price,
  );
  if (order.provider_id)
    await tx
      .insertInto("earnings_ledger")
      .values({
        id: randomUUID(),
        account_id: order.provider_id,
        source: "signals",
        amount: String(sellerShare),
        status: "pending",
        reference: order.id,
      })
      .execute();
  return { status: "paid" as const, accountId: order.account_id };
}

export async function failPayment(
  db: StudioDb,
  provider: "paystack" | "mpesa" | "mock",
  providerReference: string,
  providerEventId: string,
  payload: string,
  confirmation?: PaymentConfirmation,
) {
  const payloadHash = createHash("sha256").update(payload).digest("hex");
  return serviceScope(db, async (tx) => {
    const existing = await tx
      .selectFrom("payment_events")
      .select("id")
      .where("provider", "=", provider)
      .where("provider_event_id", "=", providerEventId)
      .executeTakeFirst();
    if (existing) return { status: "duplicate" as const };
    const attempt = await tx
      .selectFrom("signal_checkout_attempts")
      .selectAll()
      .where((eb) =>
        eb.or([
          eb("provider_reference", "=", providerReference),
          eb("reference", "=", providerReference),
        ]),
      )
      .forUpdate()
      .executeTakeFirst();
    const order = attempt
      ? await tx
          .selectFrom("signal_orders")
          .selectAll()
          .where("id", "=", attempt.signal_order_id)
          .forUpdate()
          .executeTakeFirst()
      : await tx
          .selectFrom("signal_orders")
          .selectAll()
          .where("provider_reference", "=", providerReference)
          .forUpdate()
          .executeTakeFirst();
    if (!order) return { status: "ignored" as const };
    if (attempt)
      await tx
        .updateTable("signal_checkout_attempts")
        .set({ status: "failed" })
        .where("reference", "=", attempt.reference)
        .execute();
    await tx
      .insertInto("payment_events")
      .values({
        id: randomUUID(),
        provider,
        provider_event_id: providerEventId,
        purchase_id: null,
        payload_hash: payloadHash,
        status: "failed",
      })
      .execute();
    const covered =
      order.status === "active" &&
      Boolean(order.paid_until) &&
      new Date(order.paid_until as Date) > new Date();
    if (covered) return { status: "ignored" as const };
    if (["active", "trial"].includes(order.status))
      await tx
        .updateTable("signal_orders")
        .set({ status: "paused" })
        .where("id", "=", order.id)
        .execute();
    return { status: "paused" as const };
  });
}

export async function settlePayment(
  db: StudioDb,
  provider: "paystack" | "mpesa" | "mock",
  providerReference: string,
  providerEventId: string,
  payload: string,
  confirmation?: PaymentConfirmation,
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
      return settleSignalPayment(
        tx,
        provider,
        providerReference,
        providerEventId,
        payloadHash,
        confirmation,
      );
    if (
      !amountMatches(
        provider,
        Number(purchase.amount),
        purchase.currency,
        confirmation,
      )
    ) {
      await tx
        .insertInto("payment_events")
        .values({
          id: randomUUID(),
          provider,
          provider_event_id: providerEventId,
          purchase_id: purchase.id,
          payload_hash: payloadHash,
          status: "failed",
        })
        .execute();
      return { status: "amount_mismatch" as const };
    }
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
