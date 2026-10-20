import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { getStudioDb } from "../lib/server/studio/database";
import type { StudioDb, Actor } from "../lib/server/studio/types";
import { authenticate } from "../lib/server/studio/auth";
import {
  createSignalOrder,
  deliverSignal,
  listDeliveries,
  listSignals,
  setSignalStatus,
} from "../lib/server/signals";

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
    ).rejects.toMatchObject({ status: 409, code: "INVALID_STATE" });
    expect(await listSignals(db, actor.id)).toHaveLength(1);
  });
});
