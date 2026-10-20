import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { getStudioDb } from "../lib/server/studio/database";
import type { StudioDb, Actor } from "../lib/server/studio/types";
import { authenticate } from "../lib/server/studio/auth";
import {
  applySeller,
  approveSeller,
  buyListing,
  createListing,
  earningsSummary,
  getBuyerDelivery,
  listBuyerOrders,
  listSellerProfiles,
  releaseEarnings,
  requestPayout,
  setPayoutStatus,
} from "../lib/server/marketplace";

let db: StudioDb;
let directory: string;
let seller: Actor;
let buyer: Actor;

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "tradeintra-marketplace-"));
  process.env.STUDIO_DB_MODE = "local";
  process.env.STUDIO_ENV = "local";
  process.env.STUDIO_DATA_DIR = directory;
  process.env.STORAGE_ROOT = path.join(directory, "storage");
  db = await getStudioDb();
  seller = (
    await authenticate(db, "seller@example.test", "SellerPass1", true, {
      fullName: "Seller",
    })
  ).actor;
  buyer = (
    await authenticate(db, "buyer@example.test", "BuyerPass1", true, {
      fullName: "Buyer",
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

describe("marketplace seller earnings and payouts", () => {
  it("requires seller approval, splits 15%, releases earnings, and pays out", async () => {
    await applySeller(db, seller.id, "Seller Studio", "seller", "mpesa");
    await expect(
      createListing(db, seller.id, "Bot", "bot", 20),
    ).rejects.toMatchObject({ status: 403, code: "SELLER_NOT_APPROVED" });
    await approveSeller(db, seller.id, "approved");
    const listing = await createListing(
      db,
      seller.id,
      "Bot",
      "bot",
      20,
      "<xml>delivery</xml>",
      "bot.xml",
    );
    await expect(buyListing(db, seller.id, listing.id)).rejects.toMatchObject({
      status: 422,
      code: "SELF_PURCHASE",
    });
    const order = await buyListing(db, buyer.id, listing.id);
    const purchases = await listBuyerOrders(db, buyer.id);
    expect(purchases[0]).toMatchObject({
      title: "Bot",
      delivery_filename: "bot.xml",
    });
    expect(purchases[0].delivery_asset_key).toMatch(/^marketplace\//);
    const delivery = await getBuyerDelivery(db, buyer.id, purchases[0].id);
    expect(delivery.content.toString()).toBe("<xml>delivery</xml>");
    expect((await listSellerProfiles(db))[0]).toMatchObject({
      account_id: seller.id,
      status: "approved",
    });
    expect(order).toMatchObject({
      amount: "20",
      platform_fee: "3",
      seller_share: "17",
    });
    const pending = await earningsSummary(db, seller.id);
    expect(pending.pending).toBe(17);
    expect(pending.available).toBe(0);
    const released = await releaseEarnings(db, seller.id);
    expect(released.available).toBe(17);
    await expect(
      requestPayout(db, seller.id, 5, "mpesa"),
    ).rejects.toMatchObject({
      status: 422,
      code: "MINIMUM_PAYOUT",
    });
    const payout = await requestPayout(db, seller.id, 10, "mpesa");
    expect(payout.status).toBe("requested");
    const paid = await setPayoutStatus(db, seller.id, payout.id, "paid");
    expect(paid?.status).toBe("paid");
    const summary = await earningsSummary(db, seller.id);
    expect(summary.available).toBe(0);
    expect(summary.paid).toBe(17);
  });
});
