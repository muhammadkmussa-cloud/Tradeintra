import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { getStudioDb, scope } from "../lib/server/studio/database";
import type { StudioDb, Actor } from "../lib/server/studio/types";
import { authenticate } from "../lib/server/studio/auth";
import {
  createSignalOrder,
  deliverSignal,
  listDeliveries,
  listSignals,
  resumeSignal,
  setSignalStatus,
  subscribeSignal,
} from "../lib/server/signals";
import { failPayment, settlePayment } from "../lib/server/payments";

let db: StudioDb;
let directory: string;
let actor: Actor;

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "tradeintra-signals-"));
  process.env.STUDIO_DB_MODE = "local";
  process.env.STUDIO_ENV = "local";
  process.env.STUDIO_DATA_DIR = directory;
  db = await getStudioDb();
  actor = (
    await authenticate(db, "signals@example.test", "SignalsPass1", true, {
      fullName: "Signals Operator",
    })
  ).actor;
}, 30000);

afterAll(async () => {
  await db?.destroy();
  await rm(directory, { recursive: true, force: true });
  delete process.env.STUDIO_DB_MODE;
  delete process.env.STUDIO_ENV;
  delete process.env.STUDIO_DATA_DIR;
});

describe("signal order lifecycle", () => {
  it("creates a trial, delivers, pauses, and blocks cancelled delivery", async () => {
    const order = await createSignalOrder(
      db,
      actor.id,
      "Momentum",
      "5m",
      "@test",
    );
    expect(order.status).toBe("trial");
    const delivery = await deliverSignal(db, actor.id, order.id, "Mock signal");
    expect(delivery.status).toBe("sent");
    expect(await listDeliveries(db, actor.id, order.id)).toHaveLength(1);
    const paused = await setSignalStatus(db, actor.id, order.id, "paused");
    expect(paused?.status).toBe("paused");
    await setSignalStatus(db, actor.id, order.id, "cancelled");
    await expect(
      deliverSignal(db, actor.id, order.id, "Blocked"),
    ).rejects.toMatchObject({ status: 402, code: "PAYMENT_REQUIRED" });
    expect(await listSignals(db, actor.id)).toHaveLength(1);
  });

  it("blocks delivery while paused and resume requires coverage", async () => {
    const order = await createSignalOrder(
      db,
      actor.id,
      "Paused entitlement",
      "5m",
      "@test",
    );
    await setSignalStatus(db, actor.id, order.id, "paused");
    await expect(
      deliverSignal(db, actor.id, order.id, "Blocked while paused"),
    ).rejects.toMatchObject({ status: 402, code: "PAYMENT_REQUIRED" });
    const resumed = await resumeSignal(db, actor.id, order.id);
    expect(resumed?.status).toBe("trial");
  });

  it("activates a 30-day subscription and records the 15% platform split", async () => {
    const order = await createSignalOrder(
      db,
      actor.id,
      "Breakout",
      "15m",
      "@test",
    );
    const subscription = await subscribeSignal(db, actor.id, order.id, "mock");
    expect(subscription.status).toBe("active");
    const [updated] = await listSignals(db, actor.id);
    expect(updated.status).toBe("active");
    expect(updated.platform_fee).toBe("1.35");
    expect(updated.seller_share).toBe("7.64");
    expect(updated.paid_until).toBeTruthy();
  });

  it("extends an early renewal from the existing paid date", async () => {
    const order = await createSignalOrder(
      db,
      actor.id,
      "Renewal",
      "1h",
      "@test",
    );
    const first = await subscribeSignal(db, actor.id, order.id, "mock");
    const second = await subscribeSignal(db, actor.id, order.id, "mock");
    if (first.status !== "active" || second.status !== "active")
      throw new Error("Expected immediate mock activation.");
    const extension =
      new Date(second.paidUntil).getTime() -
      new Date(first.paidUntil).getTime();
    expect(extension).toBeGreaterThan(29 * 24 * 60 * 60 * 1000);
  });

  it("rejects a provider amount that does not match the order", async () => {
    const order = await createSignalOrder(
      db,
      actor.id,
      "Amount check",
      "1h",
      "@test",
    );
    await scope(db, actor.id, (tx) =>
      tx
        .updateTable("signal_orders")
        .set({ provider_reference: "signal-amount-ref" })
        .where("id", "=", order.id)
        .execute(),
    );
    const mismatch = await settlePayment(
      db,
      "mock",
      "signal-amount-ref",
      "signal-amount-event",
      "{}",
      { amount: 1, currency: "USD" },
    );
    expect(mismatch.status).toBe("amount_mismatch");
    const unchanged = (await listSignals(db, actor.id)).find(
      (item) => item.id === order.id,
    );
    expect(unchanged?.status).toBe("trial");
  });

  it("settles a pending provider payment and pauses on failure", async () => {
    const pending = await createSignalOrder(
      db,
      actor.id,
      "Webhook pending",
      "1h",
      "@test",
    );
    await scope(db, actor.id, (tx) =>
      tx
        .updateTable("signal_orders")
        .set({ provider_reference: "signal-pending-ref" })
        .where("id", "=", pending.id)
        .execute(),
    );
    const settled = await settlePayment(
      db,
      "mock",
      "signal-pending-ref",
      "signal-event-1",
      "{}",
    );
    expect(settled.status).toBe("paid");
    const afterPaid = (await listSignals(db, actor.id)).find(
      (order) => order.id === pending.id,
    );
    expect(afterPaid?.status).toBe("active");

    const failed = await createSignalOrder(
      db,
      actor.id,
      "Webhook failed",
      "1h",
      "@test",
    );
    await scope(db, actor.id, (tx) =>
      tx
        .updateTable("signal_orders")
        .set({ provider_reference: "signal-failed-ref" })
        .where("id", "=", failed.id)
        .execute(),
    );
    await failPayment(db, "mock", "signal-failed-ref", "signal-event-2", "{}");
    const afterFailed = (await listSignals(db, actor.id)).find(
      (order) => order.id === failed.id,
    );
    expect(afterFailed?.status).toBe("paused");
  });
});
