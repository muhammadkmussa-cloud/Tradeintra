import { randomUUID } from "node:crypto";
import type { StudioDb } from "./studio/types";
import { StudioError } from "./studio/types";
import { scope } from "./studio/database";
import { sendTelegramMessage } from "./providers/telegram";
import { decryptSecret } from "./secrets";

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
    };
    await tx.insertInto("signal_orders").values(order).execute();
    return order;
  });
}

export async function setSignalStatus(
  db: StudioDb,
  account: string,
  orderId: string,
  status: "trial" | "active" | "paused" | "cancelled" | "expired",
) {
  return scope(db, account, async (tx) => {
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
    if (!["trial", "active", "paused"].includes(order.status))
      throw new StudioError(
        409,
        "This signal order cannot deliver.",
        "INVALID_STATE",
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
