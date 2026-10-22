import { randomUUID } from "node:crypto";
import type { StudioDb } from "./studio/types";
import { StudioError } from "./studio/types";
import { scope } from "./studio/database";
import { sendTelegramMessage } from "./providers/telegram";
import { decryptSecret } from "./secrets";
import { createCheckout } from "./providers/payments";

export async function listSignals(db: StudioDb, account: string) {
  return scope(db, account, (tx) =>
    tx
      .selectFrom("signal_orders")
      .selectAll()
      .where("account_id", "=", account)
      .orderBy("created_at", "desc")
      .execute(),
  );
}

export async function createSignalOrder(
  db: StudioDb,
  account: string,
  name: string,
  interval: string,
  telegram: string,
) {
  const title = name.trim();
  if (!title)
    throw new StudioError(422, "Enter a strategy name.", "VALIDATION");
  return scope(db, account, async (tx) => {
    const order = {
      id: randomUUID(),
      account_id: account,
      provider_id: null,
      name: title,
      interval: interval.trim() || "5m",
      telegram: telegram.trim() || "@mock_channel",
      status: "trial" as const,
      trial_ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      price: "8.99",
      paid_until: null,
      platform_fee: "0",
      seller_share: "0",
      provider_reference: null,
    };
    await tx.insertInto("signal_orders").values(order).execute();
    return order;
  });
}

export async function subscribeSignal(
  db: StudioDb,
  account: string,
  orderId: string,
  provider: "mock" | "paystack" | "mpesa",
) {
  const credential = await db
    .selectFrom("credentials")
    .select("email")
    .where("id", "=", account)
    .executeTakeFirst();
  const order = await scope(db, account, (tx) =>
    tx
      .selectFrom("signal_orders")
      .selectAll()
      .where("account_id", "=", account)
      .where("id", "=", orderId)
      .executeTakeFirst(),
  );
  if (!order)
    throw new StudioError(404, "Signal order not found.", "NOT_FOUND");
  if (order.status === "cancelled")
    throw new StudioError(
      409,
      "Resume the signal before subscribing.",
      "INVALID_STATE",
    );
  const price = Number(order.price);
  const platformFee = +(price * 0.15).toFixed(2);
  const sellerShare = +(price - platformFee).toFixed(2);
  const reference = `signal-${randomUUID()}`;
  await scope(db, account, (tx) =>
    tx
      .insertInto("signal_checkout_attempts")
      .values({
        reference,
        provider_reference: null,
        signal_order_id: order.id,
        account_id: account,
        provider,
        amount: String(price),
        currency: "USD",
        status: "pending",
        checkout_url: null,
      })
      .execute(),
  );
  let checkout;
  try {
    checkout = await createCheckout({
      provider,
      amount: price,
      currency: "USD",
      reference,
      description: `${order.name} signal · 30 days`,
      email: credential?.email,
    });
  } catch (error) {
    await scope(db, account, (tx) =>
      tx
        .updateTable("signal_checkout_attempts")
        .set({ status: "failed" })
        .where("reference", "=", reference)
        .execute(),
    );
    throw error;
  }
  return scope(db, account, async (tx) => {
    await tx
      .updateTable("signal_checkout_attempts")
      .set({
        provider_reference: checkout.id,
        status: checkout.status === "paid" ? "paid" : "pending",
        checkout_url: checkout.checkoutUrl,
      })
      .where("reference", "=", reference)
      .execute();
    if (checkout.status !== "paid") {
      await tx
        .updateTable("signal_orders")
        .set({ provider_reference: checkout.id })
        .where("account_id", "=", account)
        .where("id", "=", order.id)
        .execute();
      return { status: "pending" as const, checkoutUrl: checkout.checkoutUrl };
    }
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
        provider_reference: checkout.id,
      })
      .where("account_id", "=", account)
      .where("id", "=", order.id)
      .execute();
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
    return {
      status: "active" as const,
      paidUntil: paidUntil.toISOString(),
      platformFee,
      sellerShare,
    };
  });
}

export async function setSignalStatus(
  db: StudioDb,
  account: string,
  orderId: string,
  status: "paused" | "cancelled",
) {
  if (!["paused", "cancelled"].includes(status))
    throw new StudioError(422, "Invalid signal status.", "VALIDATION");
  return scope(db, account, async (tx) => {
    const order = await tx
      .selectFrom("signal_orders")
      .select(["id", "status"])
      .where("account_id", "=", account)
      .where("id", "=", orderId)
      .forUpdate()
      .executeTakeFirst();
    if (!order)
      throw new StudioError(404, "Signal order not found.", "NOT_FOUND");
    if (order.status === "cancelled")
      throw new StudioError(
        409,
        "Cancelled signals cannot be changed.",
        "INVALID_STATE",
      );
    await tx
      .updateTable("signal_orders")
      .set({ status })
      .where("account_id", "=", account)
      .where("id", "=", orderId)
      .execute();
    return tx
      .selectFrom("signal_orders")
      .selectAll()
      .where("account_id", "=", account)
      .where("id", "=", orderId)
      .executeTakeFirst();
  });
}

export async function resumeSignal(
  db: StudioDb,
  account: string,
  orderId: string,
) {
  return scope(db, account, async (tx) => {
    const order = await tx
      .selectFrom("signal_orders")
      .selectAll()
      .where("account_id", "=", account)
      .where("id", "=", orderId)
      .forUpdate()
      .executeTakeFirst();
    if (!order)
      throw new StudioError(404, "Signal order not found.", "NOT_FOUND");
    if (order.status === "cancelled")
      throw new StudioError(
        409,
        "Cancelled signals cannot resume.",
        "INVALID_STATE",
      );
    const now = new Date();
    const trial = new Date(order.trial_ends_at) > now;
    const paid = Boolean(order.paid_until && new Date(order.paid_until) > now);
    if (!trial && !paid)
      throw new StudioError(
        402,
        "Subscribe before resuming this signal.",
        "PAYMENT_REQUIRED",
      );
    await tx
      .updateTable("signal_orders")
      .set({ status: trial && !paid ? "trial" : "active" })
      .where("account_id", "=", account)
      .where("id", "=", order.id)
      .execute();
    return tx
      .selectFrom("signal_orders")
      .selectAll()
      .where("account_id", "=", account)
      .where("id", "=", order.id)
      .executeTakeFirst();
  });
}

export async function deliverSignal(
  db: StudioDb,
  account: string,
  orderId: string,
  message: string,
) {
  return scope(db, account, async (tx) => {
    const order = await tx
      .selectFrom("signal_orders")
      .selectAll()
      .where("account_id", "=", account)
      .where("id", "=", orderId)
      .forUpdate()
      .executeTakeFirst();
    if (!order)
      throw new StudioError(404, "Signal order not found.", "NOT_FOUND");
    const now = new Date();
    const entitled =
      (order.status === "trial" && new Date(order.trial_ends_at) > now) ||
      (order.status === "active" &&
        Boolean(order.paid_until) &&
        new Date(order.paid_until as Date) > now);
    if (!entitled)
      throw new StudioError(
        402,
        "An active trial or subscription is required.",
        "PAYMENT_REQUIRED",
      );
    const text = message.trim() || `${order.name} · ${order.interval} · signal`;
    const connection = await tx
      .selectFrom("telegram_connections")
      .select(["bot_token_encrypted", "status"])
      .where("account_id", "=", account)
      .where("status", "=", "linked")
      .executeTakeFirst();
    let telegram;
    try {
      telegram = await sendTelegramMessage(
        order.telegram,
        text,
        connection ? decryptSecret(connection.bot_token_encrypted) : undefined,
      );
    } catch {
      await tx
        .insertInto("signal_deliveries")
        .values({
          id: randomUUID(),
          signal_order_id: order.id,
          account_id: account,
          status: "failed",
          message: text,
        })
        .execute();
      throw new StudioError(
        503,
        "Telegram delivery failed. The delivery was recorded as failed.",
        "TELEGRAM_FAILED",
      );
    }
    const delivery = {
      id: randomUUID(),
      signal_order_id: order.id,
      account_id: account,
      status: "sent" as const,
      message: text,
    };
    await tx.insertInto("signal_deliveries").values(delivery).execute();
    return { ...delivery, telegram };
  });
}

export async function listDeliveries(
  db: StudioDb,
  account: string,
  orderId: string,
) {
  return scope(db, account, async (tx) => {
    const order = await tx
      .selectFrom("signal_orders")
      .select("id")
      .where("account_id", "=", account)
      .where("id", "=", orderId)
      .executeTakeFirst();
    if (!order)
      throw new StudioError(404, "Signal order not found.", "NOT_FOUND");
    return tx
      .selectFrom("signal_deliveries")
      .selectAll()
      .where("signal_order_id", "=", orderId)
      .orderBy("created_at", "desc")
      .execute();
  });
}
