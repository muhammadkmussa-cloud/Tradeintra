import {
  getStudioDb,
  scope,
  serviceScope,
} from "../lib/server/studio/database";
import { deliverSignal } from "../lib/server/signals";

const intervalMs = (value: string) => {
  const match = /^(\d+)(m|h|d)$/.exec(value.trim());
  if (!match) return 5 * 60 * 1000;
  const amount = Number(match[1]);
  return (
    amount * (match[2] === "d" ? 86400000 : match[2] === "h" ? 3600000 : 60000)
  );
};

const db = await getStudioDb();
try {
  const orders = await serviceScope(db, (tx) =>
    tx
      .selectFrom("signal_orders")
      .selectAll()
      .where("status", "in", ["trial", "active"])
      .limit(100)
      .execute(),
  );
  let sent = 0;
  for (const order of orders) {
    const now = Date.now();
    const entitled =
      (order.status === "trial" &&
        new Date(order.trial_ends_at).getTime() > now) ||
      (order.status === "active" &&
        Boolean(order.paid_until) &&
        new Date(order.paid_until as Date).getTime() > now);
    if (!entitled) continue;
    const last = await scope(db, order.account_id, (tx) =>
      tx
        .selectFrom("signal_deliveries")
        .select("created_at")
        .where("signal_order_id", "=", order.id)
        .where("status", "=", "sent")
        .orderBy("created_at", "desc")
        .executeTakeFirst(),
    );
    if (
      last &&
      Date.now() - new Date(last.created_at).getTime() <
        intervalMs(order.interval)
    )
      continue;
    try {
      await deliverSignal(
        db,
        order.account_id,
        order.id,
        process.env.SIGNAL_DELIVERY_MESSAGE ?? `${order.name} cron signal`,
      );
      sent += 1;
    } catch {
      console.error(`Signal delivery failed for ${order.id}; details omitted.`);
    }
  }
  console.log(`Signal delivery sweep complete: ${sent} sent.`);
} finally {
  await db.destroy();
}
