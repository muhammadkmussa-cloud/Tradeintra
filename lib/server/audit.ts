import { randomUUID } from "node:crypto";
import type { StudioDb, StudioTrx } from "./studio/types";
import { adminScope, scope } from "./studio/database";

export async function auditTx(
  tx: StudioTrx,
  account: string,
  actor: string,
  action: string,
  detail: string,
) {
  await tx
    .insertInto("audit_events")
    .values({
      id: randomUUID(),
      account_id: account,
      actor_id: actor,
      action,
      detail: detail.slice(0, 500),
    })
    .execute();
}

export async function listAllAudit(db: StudioDb, limit = 100) {
  return adminScope(db, (tx) =>
    tx
      .selectFrom("audit_events")
      .selectAll()
      .orderBy("created_at", "desc")
      .limit(Math.min(limit, 200))
      .execute(),
  );
}

export async function listAudit(db: StudioDb, account: string, limit = 50) {
  return scope(db, account, (tx) =>
    tx
      .selectFrom("audit_events")
      .selectAll()
      .where("account_id", "=", account)
      .orderBy("created_at", "desc")
      .limit(limit)
      .execute(),
  );
}
