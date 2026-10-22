import { randomUUID } from "node:crypto";
import type { StudioDb, StudioTrx } from "./studio/types";
import { scope } from "./studio/database";

export async function issueInvoiceTx(
  tx: StudioTrx,
  account: string,
  kind: "credits" | "domain" | "marketplace" | "signal",
  reference: string,
  description: string,
  subtotal: number,
  currency = "USD",
) {
  const rate = Math.min(
    100,
    Math.max(0, Number(process.env.TAX_RATE_PERCENT) || 0),
  );
  const tax = +(subtotal * (rate / 100)).toFixed(2);
  const invoice = {
    id: randomUUID(),
    account_id: account,
    kind,
    reference,
    description: description.slice(0, 200),
    subtotal: String(subtotal.toFixed(2)),
    tax: String(tax.toFixed(2)),
    total: String((subtotal + tax).toFixed(2)),
    currency,
    status: "issued" as const,
  };
  await tx
    .insertInto("invoices")
    .values(invoice)
    .onConflict((oc) => oc.columns(["kind", "reference"]).doNothing())
    .execute();
  return invoice;
}

export async function listInvoices(db: StudioDb, account: string) {
  return scope(db, account, (tx) =>
    tx
      .selectFrom("invoices")
      .selectAll()
      .where("account_id", "=", account)
      .orderBy("created_at", "desc")
      .execute(),
  );
}
