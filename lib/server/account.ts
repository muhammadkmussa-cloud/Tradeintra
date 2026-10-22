import { randomUUID } from "node:crypto";
import { StudioError, type StudioDb, type StudioTrx } from "./studio/types";
import { scope, serviceScope } from "./studio/database";
import { creditBalance } from "./studio/auth";
import { loadState } from "./studio/service";
import { listDomains } from "./commerce";
import { listBots } from "./bots";
import { listSignals } from "./signals";
import { earningsSummary, listBuyerOrders } from "./marketplace";
import { listTickets } from "./support";
import { listAnnouncements } from "./announcements";
import { commissionSummary } from "./commerce";
import { auditTx } from "./audit";
import { deleteMarketplaceDelivery } from "./storage";

export async function exportAccount(db: StudioDb, account: string) {
  const [
    studio,
    domains,
    bots,
    signals,
    earnings,
    purchases,
    tickets,
    announcements,
    credits,
    commissions,
  ] = await Promise.all([
    loadState(db, account),
    listDomains(db, account),
    listBots(db, account),
    listSignals(db, account),
    earningsSummary(db, account),
    listBuyerOrders(db, account),
    listTickets(db, account),
    listAnnouncements(db, account),
    creditBalance(db, account),
    commissionSummary(db, account),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    account: { id: account },
    credits,
    studio,
    domains,
    bots,
    signals,
    earnings,
    purchases,
    tickets,
    announcements,
    commissions,
  };
}

export async function requestDeletion(db: StudioDb, account: string) {
  return scope(db, account, async (tx) => {
    const executeAfter = new Date(Date.now() + 30 * 86400000);
    await tx
      .insertInto("deletion_requests")
      .values({
        account_id: account,
        requested_at: new Date(),
        execute_after: executeAfter,
        status: "pending",
      })
      .onConflict((oc) =>
        oc.column("account_id").doUpdateSet({
          requested_at: new Date(),
          execute_after: executeAfter,
          status: "pending",
        }),
      )
      .execute();
    await auditTx(
      tx,
      account,
      account,
      "account.deletion.request",
      "30-day grace period",
    );
    return { executeAfter };
  });
}

export async function cancelDeletion(db: StudioDb, account: string) {
  return scope(db, account, async (tx) => {
    const result = await tx
      .updateTable("deletion_requests")
      .set({ status: "cancelled" })
      .where("account_id", "=", account)
      .where("status", "=", "pending")
      .executeTakeFirst();
    if (!result.numUpdatedRows)
      throw new StudioError(
        409,
        "No pending deletion request.",
        "NO_PENDING_DELETION",
      );
    await auditTx(
      tx,
      account,
      account,
      "account.deletion.cancel",
      "Deletion cancelled",
    );
    return { cancelled: true };
  });
}

async function purgeAccount(tx: StudioTrx, account: string) {
  const [
    purchases,
    payouts,
    earnings,
    invoices,
    domainOrders,
    commissions,
    orders,
    audit,
    deriv,
    telegram,
  ] = await Promise.all([
    tx
      .selectFrom("credit_purchases")
      .selectAll()
      .where("account_id", "=", account)
      .limit(500)
      .execute(),
    tx
      .selectFrom("payouts")
      .selectAll()
      .where("account_id", "=", account)
      .limit(500)
      .execute(),
    tx
      .selectFrom("earnings_ledger")
      .selectAll()
      .where("account_id", "=", account)
      .limit(500)
      .execute(),
    tx
      .selectFrom("invoices")
      .selectAll()
      .where("account_id", "=", account)
      .limit(500)
      .execute(),
    tx
      .selectFrom("domain_orders")
      .selectAll()
      .where("account_id", "=", account)
      .limit(500)
      .execute(),
    tx
      .selectFrom("commission_entries")
      .selectAll()
      .where("account_id", "=", account)
      .limit(500)
      .execute(),
    tx
      .selectFrom("marketplace_orders")
      .selectAll()
      .where("buyer_id", "=", account)
      .limit(500)
      .execute(),
    tx
      .selectFrom("audit_events")
      .selectAll()
      .where("account_id", "=", account)
      .limit(500)
      .execute(),
    tx
      .selectFrom("deriv_links")
      .select("status")
      .where("account_id", "=", account)
      .executeTakeFirst(),
    tx
      .selectFrom("telegram_connections")
      .select("status")
      .where("account_id", "=", account)
      .executeTakeFirst(),
  ]);
  await tx
    .insertInto("deletion_archives")
    .values({
      id: randomUUID(),
      account_id: account,
      payload: {
        purchases,
        payouts,
        earnings,
        invoices,
        domainOrders,
        commissions,
        orders,
        audit,
      },
    })
    .execute();
  if (deriv)
    await tx
      .insertInto("provider_revocation_tasks")
      .values({
        id: randomUUID(),
        account_id: account,
        provider: "deriv",
        status: "pending",
        detail: `revoke Deriv link (${deriv.status})`,
      })
      .execute();
  if (telegram)
    await tx
      .insertInto("provider_revocation_tasks")
      .values({
        id: randomUUID(),
        account_id: account,
        provider: "telegram",
        status: "pending",
        detail: "revoke Telegram bot token",
      })
      .execute();
  const listings = await tx
    .selectFrom("marketplace_listings")
    .select("delivery_asset_key")
    .where("seller_id", "=", account)
    .execute();
  const uploads = await tx
    .selectFrom("marketplace_uploads")
    .select("asset_key")
    .where("account_id", "=", account)
    .execute();
  const storageKeys = [
    ...listings.map((row) => row.delivery_asset_key),
    ...uploads.map((row) => row.asset_key),
  ].filter((key): key is string => Boolean(key));
  await tx
    .updateTable("domains")
    .set({ site_id: null })
    .where("account_id", "=", account)
    .execute();
  await tx
    .updateTable("commission_entries")
    .set({ site_id: null })
    .where("account_id", "=", account)
    .execute();
  await tx
    .updateTable("bots")
    .set({ site_id: null })
    .where("account_id", "=", account)
    .execute();
  await tx
    .deleteFrom("host_mappings")
    .where("account_id", "=", account)
    .execute();
  await tx.deleteFrom("subdomains").where("account_id", "=", account).execute();
  await tx.deleteFrom("versions").where("account_id", "=", account).execute();
  await tx.deleteFrom("sites").where("account_id", "=", account).execute();
  await tx.deleteFrom("operations").where("account_id", "=", account).execute();
  await tx.deleteFrom("sessions").where("account_id", "=", account).execute();
  await tx.deleteFrom("accounts").where("id", "=", account).execute();
  await tx.deleteFrom("credentials").where("id", "=", account).execute();
  await tx
    .insertInto("deletion_tombstones")
    .values({ id: randomUUID(), account_id: account })
    .execute();
  return storageKeys;
}

export async function executeDueDeletions(db: StudioDb) {
  const due = await serviceScope(db, (tx) =>
    tx
      .selectFrom("deletion_requests")
      .select("account_id")
      .where("status", "=", "pending")
      .where("execute_after", "<=", new Date())
      .execute(),
  );
  let deleted = 0;
  const failed: string[] = [];
  for (const request of due) {
    try {
      const keys = await serviceScope(db, (tx) =>
        purgeAccount(tx, request.account_id),
      );
      for (const key of keys) await deleteMarketplaceDelivery(key);
      deleted += 1;
    } catch {
      failed.push(request.account_id);
    }
  }
  return { deleted, failed };
}
