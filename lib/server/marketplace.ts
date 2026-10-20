import { randomUUID } from "node:crypto";
import type { StudioDb } from "./studio/types";
import { StudioError } from "./studio/types";
import { adminScope, scope } from "./studio/database";
import { readMarketplaceDelivery, writeMarketplaceDelivery } from "./storage";

export const PLATFORM_FEE = 0.15;

export async function applySeller(
  db: StudioDb,
  account: string,
  displayName: string,
  kind: "seller" | "signal_provider" | "both",
  payoutMethod: "mpesa" | "bank" | "crypto",
) {
  const name = displayName.trim();
  if (name.length < 2 || name.length > 80)
    throw new StudioError(422, "Enter a seller display name.", "VALIDATION");
  return scope(db, account, async (tx) => {
    await tx
      .insertInto("seller_profiles")
      .values({
        account_id: account,
        display_name: name,
        kind,
        status: "pending",
        payout_method: payoutMethod,
      })
      .onConflict((oc) =>
        oc.column("account_id").doUpdateSet({
          display_name: name,
          kind,
          payout_method: payoutMethod,
        }),
      )
      .execute();
    return tx
      .selectFrom("seller_profiles")
      .selectAll()
      .where("account_id", "=", account)
      .executeTakeFirstOrThrow();
  });
}

export async function approveSeller(
  db: StudioDb,
  account: string,
  status: "approved" | "suspended",
) {
  return scope(db, account, async (tx) => {
    await tx
      .updateTable("seller_profiles")
      .set({ status })
      .where("account_id", "=", account)
      .execute();
    return tx
      .selectFrom("seller_profiles")
      .selectAll()
      .where("account_id", "=", account)
      .executeTakeFirst();
  });
}

export async function listListings(db: StudioDb, seller?: string) {
  return seller
    ? scope(db, seller, (tx) =>
        tx
          .selectFrom("marketplace_listings")
          .selectAll()
          .where("seller_id", "=", seller)
          .orderBy("created_at", "desc")
          .execute(),
      )
    : db
        .selectFrom("marketplace_listings")
        .selectAll()
        .where("status", "=", "live")
        .orderBy("created_at", "desc")
        .execute();
}

export async function createListing(
  db: StudioDb,
  seller: string,
  title: string,
  kind: "bot" | "pdf" | "course" | "signal",
  price: number,
  deliveryContent?: string,
  deliveryFilename?: string,
  uploadId?: string,
) {
  const name = title.trim();
  if (!name) throw new StudioError(422, "Enter a listing title.", "VALIDATION");
  return scope(db, seller, async (tx) => {
    const profile = await tx
      .selectFrom("seller_profiles")
      .select("status")
      .where("account_id", "=", seller)
      .executeTakeFirst();
    if (profile?.status !== "approved")
      throw new StudioError(
        403,
        "Seller approval is required before listing an item.",
        "SELLER_NOT_APPROVED",
      );
    const upload = uploadId
      ? await tx
          .selectFrom("marketplace_uploads")
          .selectAll()
          .where("id", "=", uploadId)
          .where("account_id", "=", seller)
          .executeTakeFirst()
      : null;
    if (uploadId && !upload)
      throw new StudioError(404, "Upload not found.", "NOT_FOUND");
    const asset = upload
      ? { key: upload.asset_key, size: upload.size, mime: upload.mime }
      : deliveryContent
        ? await writeMarketplaceDelivery(
            seller,
            deliveryFilename ?? `${kind}-delivery.txt`,
            Buffer.from(deliveryContent, "utf8"),
            deliveryFilename?.endsWith(".xml")
              ? "application/xml"
              : "text/plain",
          )
        : null;
    const listing = {
      id: randomUUID(),
      seller_id: seller,
      title: name,
      kind,
      price: String(Math.max(0, price)),
      status: "live" as const,
      delivery_content: null,
      delivery_filename: deliveryFilename?.slice(0, 120) ?? null,
      delivery_asset_key: asset?.key ?? null,
      delivery_size: asset?.size ?? null,
      delivery_mime: asset?.mime ?? null,
      delivery_upload_id: upload?.id ?? null,
    };
    await tx.insertInto("marketplace_listings").values(listing).execute();
    return listing;
  });
}

export async function buyListing(
  db: StudioDb,
  buyer: string,
  listingId: string,
) {
  return adminScope(db, async (tx) => {
    const listing = await tx
      .selectFrom("marketplace_listings")
      .selectAll()
      .where("id", "=", listingId)
      .where("status", "=", "live")
      .forUpdate()
      .executeTakeFirst();
    if (!listing)
      throw new StudioError(
        404,
        "Listing not found or unavailable.",
        "NOT_FOUND",
      );
    if (listing.seller_id === buyer)
      throw new StudioError(
        422,
        "You cannot buy your own listing.",
        "SELF_PURCHASE",
      );
    const amount = Number(listing.price);
    const platformFee = +(amount * PLATFORM_FEE).toFixed(2);
    const sellerShare = +(amount - platformFee).toFixed(2);
    const order = {
      id: randomUUID(),
      listing_id: listing.id,
      buyer_id: buyer,
      seller_id: listing.seller_id,
      amount: String(amount),
      platform_fee: String(platformFee),
      seller_share: String(sellerShare),
      status: "paid" as const,
    };
    await tx.insertInto("marketplace_orders").values(order).execute();
    await tx
      .updateTable("marketplace_listings")
      .set({ status: "sold" })
      .where("id", "=", listing.id)
      .execute();
    await tx
      .insertInto("earnings_ledger")
      .values({
        id: randomUUID(),
        account_id: listing.seller_id,
        source: "marketplace",
        amount: String(sellerShare),
        status: "pending",
        reference: order.id,
      })
      .execute();
    return order;
  });
}

export async function listBuyerOrders(db: StudioDb, buyer: string) {
  return scope(db, buyer, (tx) =>
    tx
      .selectFrom("marketplace_orders")
      .innerJoin(
        "marketplace_listings",
        "marketplace_listings.id",
        "marketplace_orders.listing_id",
      )
      .select([
        "marketplace_orders.id",
        "marketplace_orders.amount",
        "marketplace_orders.status",
        "marketplace_orders.created_at",
        "marketplace_listings.title",
        "marketplace_listings.kind",
        "marketplace_listings.delivery_filename",
        "marketplace_listings.delivery_asset_key",
        "marketplace_listings.delivery_size",
        "marketplace_listings.delivery_mime",
      ])
      .where("marketplace_orders.buyer_id", "=", buyer)
      .orderBy("marketplace_orders.created_at", "desc")
      .execute(),
  );
}

export async function getBuyerDelivery(
  db: StudioDb,
  buyer: string,
  orderId: string,
) {
  return scope(db, buyer, async (tx) => {
    const order = await tx
      .selectFrom("marketplace_orders")
      .innerJoin(
        "marketplace_listings",
        "marketplace_listings.id",
        "marketplace_orders.listing_id",
      )
      .select([
        "marketplace_orders.id",
        "marketplace_orders.status",
        "marketplace_listings.title",
        "marketplace_listings.delivery_filename",
        "marketplace_listings.delivery_asset_key",
        "marketplace_listings.delivery_mime",
      ])
      .where("marketplace_orders.id", "=", orderId)
      .where("marketplace_orders.buyer_id", "=", buyer)
      .where("marketplace_orders.status", "=", "paid")
      .executeTakeFirst();
    if (!order || !order.delivery_asset_key)
      throw new StudioError(404, "Delivery not found.", "NOT_FOUND");
    return {
      ...order,
      content: await readMarketplaceDelivery(order.delivery_asset_key),
    };
  });
}

export async function listSellerProfiles(db: StudioDb) {
  return adminScope(db, (tx) =>
    tx
      .selectFrom("seller_profiles")
      .selectAll()
      .orderBy("created_at", "desc")
      .execute(),
  );
}

export async function listAllPayouts(db: StudioDb) {
  return adminScope(db, (tx) =>
    tx
      .selectFrom("payouts")
      .selectAll()
      .orderBy("created_at", "desc")
      .execute(),
  );
}

export async function releaseEarnings(db: StudioDb, account: string) {
  await scope(db, account, async (tx) => {
    await tx
      .updateTable("earnings_ledger")
      .set({ status: "available" })
      .where("account_id", "=", account)
      .where("status", "=", "pending")
      .execute();
  });
  return earningsSummary(db, account);
}

export async function earningsSummary(db: StudioDb, account: string) {
  return scope(db, account, async (tx) => {
    const earnings = await tx
      .selectFrom("earnings_ledger")
      .selectAll()
      .where("account_id", "=", account)
      .orderBy("created_at", "desc")
      .execute();
    const payouts = await tx
      .selectFrom("payouts")
      .selectAll()
      .where("account_id", "=", account)
      .orderBy("created_at", "desc")
      .execute();
    return {
      earnings,
      payouts,
      available: earnings
        .filter((entry) => entry.status === "available")
        .reduce((sum, entry) => sum + Number(entry.amount), 0),
      pending: earnings
        .filter((entry) => entry.status === "pending")
        .reduce((sum, entry) => sum + Number(entry.amount), 0),
      paid: earnings
        .filter((entry) => entry.status === "paid")
        .reduce((sum, entry) => sum + Number(entry.amount), 0),
    };
  });
}

export async function requestPayout(
  db: StudioDb,
  account: string,
  amount: number,
  method: "mpesa" | "bank" | "crypto",
) {
  const requested = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  if (requested < 10)
    throw new StudioError(422, "Minimum payout is $10.", "MINIMUM_PAYOUT");
  const summary = await earningsSummary(db, account);
  if (requested > summary.available)
    throw new StudioError(
      422,
      "Payout exceeds available earnings.",
      "INSUFFICIENT_EARNINGS",
    );
  return scope(db, account, async (tx) => {
    const payout = {
      id: randomUUID(),
      account_id: account,
      amount: String(requested),
      method,
      status: "requested" as const,
      paid_at: null,
    };
    await tx.insertInto("payouts").values(payout).execute();
    return payout;
  });
}

export async function setPayoutStatus(
  db: StudioDb,
  account: string,
  payoutId: string,
  status: "review" | "approved" | "paid" | "rejected",
) {
  return scope(db, account, async (tx) => {
    await tx
      .updateTable("payouts")
      .set({ status, paid_at: status === "paid" ? new Date() : null })
      .where("account_id", "=", account)
      .where("id", "=", payoutId)
      .execute();
    if (status === "paid") {
      const payout = await tx
        .selectFrom("payouts")
        .select("amount")
        .where("account_id", "=", account)
        .where("id", "=", payoutId)
        .executeTakeFirst();
      let remaining = Number(payout?.amount ?? 0);
      const available = await tx
        .selectFrom("earnings_ledger")
        .select(["id", "amount"])
        .where("account_id", "=", account)
        .where("status", "=", "available")
        .orderBy("created_at")
        .execute();
      for (const entry of available) {
        if (remaining <= 0) break;
        const value = Number(entry.amount);
        await tx
          .updateTable("earnings_ledger")
          .set({ status: "paid" })
          .where("id", "=", entry.id)
          .execute();
        remaining -= value;
      }
    }
    return tx
      .selectFrom("payouts")
      .selectAll()
      .where("account_id", "=", account)
      .where("id", "=", payoutId)
      .executeTakeFirst();
  });
}
