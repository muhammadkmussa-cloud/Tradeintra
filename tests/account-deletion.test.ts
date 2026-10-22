import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  getStudioDb,
  scope,
  serviceScope,
} from "../lib/server/studio/database";
import type { StudioDb, Actor } from "../lib/server/studio/types";
import { authenticate } from "../lib/server/studio/auth";
import { requestDeletion, executeDueDeletions } from "../lib/server/account";
import { writeMarketplaceDelivery } from "../lib/server/storage";
import { defaultConfig } from "../lib/studio";

let db: StudioDb;
let directory: string;
let actor: Actor;

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "tradeintra-deletion-"));
  process.env.STUDIO_DB_MODE = "local";
  process.env.STUDIO_ENV = "local";
  process.env.STUDIO_DATA_DIR = directory;
  process.env.STORAGE_ROOT = path.join(directory, "storage");
  db = await getStudioDb();
  actor = (
    await authenticate(db, "delete@example.test", "DeletePass1", true, {
      fullName: "Delete Operator",
    })
  ).actor;
}, 30000);

afterAll(async () => {
  await db?.destroy();
  await rm(directory, { recursive: true, force: true });
  delete process.env.STUDIO_DB_MODE;
  delete process.env.STUDIO_ENV;
  delete process.env.STUDIO_DATA_DIR;
  delete process.env.STORAGE_ROOT;
});

describe("account deletion sweep", () => {
  it("purges due accounts with their site and version data", async () => {
    const siteId = crypto.randomUUID();
    await scope(db, actor.id, async (tx) => {
      await tx
        .insertInto("sites")
        .values({
          account_id: actor.id,
          id: siteId,
          draft: { ...defaultConfig, headline: "Delete me" },
        })
        .execute();
      await tx
        .insertInto("versions")
        .values({
          account_id: actor.id,
          site_id: siteId,
          id: crypto.randomUUID(),
          number: 1,
          config: { ...defaultConfig, headline: "Delete me" },
        })
        .execute();
      await tx
        .insertInto("domains")
        .values({
          id: crypto.randomUUID(),
          account_id: actor.id,
          site_id: siteId,
          name: "delete-me.example",
          mode: "connected",
          status: "active",
          registration_price: "0",
          renewal_price: "0",
          currency: "USD",
          premium: false,
          auto_renew: false,
          expires_at: new Date(Date.now() + 86400000),
          dns_verified: true,
          ssl_status: "active",
        })
        .execute();
      await tx
        .insertInto("bots")
        .values({
          id: crypto.randomUUID(),
          account_id: actor.id,
          name: "Delete bot",
          xml: "<xml />",
          compatibility: "standard-dbot",
          status: "draft",
          site_id: siteId,
        })
        .execute();
      await tx
        .insertInto("commission_entries")
        .values({
          id: crypto.randomUUID(),
          account_id: actor.id,
          site_id: siteId,
          period: "2026-10",
          gross_commission: "10",
          platform_share: "1.5",
          status: "imported",
        })
        .execute();
    });
    const file = await writeMarketplaceDelivery(
      actor.id,
      "purge.txt",
      Buffer.from("purge me"),
    );
    await scope(db, actor.id, async (tx) => {
      await tx
        .insertInto("seller_profiles")
        .values({
          account_id: actor.id,
          display_name: "Delete Seller",
          kind: "seller",
          status: "approved",
          payout_method: "mpesa",
        })
        .execute();
      await tx
        .insertInto("marketplace_listings")
        .values({
          id: crypto.randomUUID(),
          seller_id: actor.id,
          title: "Purge listing",
          kind: "pdf",
          price: "5",
          status: "live",
          delivery_filename: "purge.txt",
          delivery_asset_key: file.key,
          delivery_size: file.size,
          delivery_mime: file.mime,
        })
        .execute();
    });
    await scope(db, actor.id, (tx) =>
      tx
        .insertInto("deriv_links")
        .values({
          account_id: actor.id,
          mode: "mock",
          status: "linked",
          linked_at: new Date(),
        })
        .execute(),
    );
    await requestDeletion(db, actor.id);
    await scope(db, actor.id, (tx) =>
      tx
        .updateTable("deletion_requests")
        .set({ execute_after: new Date(Date.now() - 1000) })
        .where("account_id", "=", actor.id)
        .execute(),
    );
    const result = await executeDueDeletions(db);
    expect(result.deleted).toBe(1);
    expect(result.failed).toEqual([]);
    await expect(
      access(path.join(directory, "storage", file.key)),
    ).rejects.toThrow();
    expect(
      await db
        .selectFrom("credentials")
        .select("id")
        .where("id", "=", actor.id)
        .executeTakeFirst(),
    ).toBeUndefined();
    const archive = await serviceScope(db, (tx) =>
      tx
        .selectFrom("deletion_archives")
        .select("payload")
        .where("account_id", "=", actor.id)
        .executeTakeFirst(),
    );
    expect(archive?.payload).toMatchObject({ domainOrders: expect.any(Array) });
    const tasks = await serviceScope(db, (tx) =>
      tx
        .selectFrom("provider_revocation_tasks")
        .select(["provider", "status"])
        .where("account_id", "=", actor.id)
        .execute(),
    );
    expect(tasks).toContainEqual({ provider: "deriv", status: "pending" });
  });
});
