import { randomUUID } from "node:crypto";
import type { StudioDb } from "./studio/types";
import { StudioError } from "./studio/types";
import { scope } from "./studio/database";
import { auditTx } from "./audit";

export async function listAnnouncements(db: StudioDb, account: string) {
  return scope(db, account, (tx) =>
    tx
      .selectFrom("announcements")
      .selectAll()
      .where("account_id", "=", account)
      .orderBy("created_at", "desc")
      .execute(),
  );
}

export async function createAnnouncement(
  db: StudioDb,
  account: string,
  title: string,
  body: string,
  target = "all",
) {
  const name = title.trim();
  const text = body.trim();
  if (!name || name.length > 120 || !text || text.length > 4000)
    throw new StudioError(422, "Enter a title and body.", "VALIDATION");
  return scope(db, account, async (tx) => {
    if (target !== "all") {
      const site = await tx
        .selectFrom("sites")
        .select("id")
        .where("account_id", "=", account)
        .where("id", "=", target)
        .where("archived", "=", false)
        .executeTakeFirst();
      if (!site)
        throw new StudioError(422, "Select one of your sites.", "VALIDATION");
    }
    const id = randomUUID();
    await tx
      .insertInto("announcements")
      .values({
        id,
        account_id: account,
        title: name,
        body: text,
        target,
        status: "draft",
      })
      .execute();
    await auditTx(tx, account, account, "announcement.create", name);
    return { id };
  });
}

export async function publishAnnouncement(
  db: StudioDb,
  account: string,
  announcementId: string,
) {
  return scope(db, account, async (tx) => {
    const result = await tx
      .updateTable("announcements")
      .set({ status: "published" })
      .where("account_id", "=", account)
      .where("id", "=", announcementId)
      .executeTakeFirst();
    if (!result.numUpdatedRows)
      throw new StudioError(404, "Announcement not found.", "NOT_FOUND");
    await auditTx(tx, account, account, "announcement.publish", announcementId);
    return { ok: true };
  });
}
