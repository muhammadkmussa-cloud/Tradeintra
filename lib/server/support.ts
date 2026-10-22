import { randomUUID } from "node:crypto";
import type { StudioDb } from "./studio/types";
import { StudioError } from "./studio/types";
import { scope } from "./studio/database";
import { auditTx } from "./audit";

export async function listTickets(db: StudioDb, account: string) {
  return scope(db, account, async (tx) => {
    const tickets = await tx
      .selectFrom("support_tickets")
      .selectAll()
      .where("account_id", "=", account)
      .orderBy("created_at", "desc")
      .execute();
    const messages = await tx
      .selectFrom("support_messages")
      .selectAll()
      .where("account_id", "=", account)
      .orderBy("created_at")
      .execute();
    return tickets.map((ticket) => ({
      ...ticket,
      messages: messages.filter((message) => message.ticket_id === ticket.id),
    }));
  });
}

export async function createTicket(
  db: StudioDb,
  account: string,
  subject: string,
  category: "account" | "domain" | "site" | "billing" | "abuse",
  body: string,
) {
  const title = subject.trim();
  const message = body.trim();
  if (!title || title.length > 120 || !message || message.length > 4000)
    throw new StudioError(422, "Enter a subject and message.", "VALIDATION");
  return scope(db, account, async (tx) => {
    const id = randomUUID();
    await tx
      .insertInto("support_tickets")
      .values({
        id,
        account_id: account,
        subject: title,
        category,
        status: "open",
      })
      .execute();
    await tx
      .insertInto("support_messages")
      .values({
        id: randomUUID(),
        ticket_id: id,
        account_id: account,
        author: "customer",
        body: message,
      })
      .execute();
    await auditTx(tx, account, account, "support.create", title);
    return { id };
  });
}

export async function replyTicket(
  db: StudioDb,
  account: string,
  ticketId: string,
  body: string,
  author: "customer" | "support" = "customer",
) {
  const message = body.trim();
  if (!message || message.length > 4000)
    throw new StudioError(422, "Enter a message.", "VALIDATION");
  return scope(db, account, async (tx) => {
    const ticket = await tx
      .selectFrom("support_tickets")
      .select(["id", "status"])
      .where("account_id", "=", account)
      .where("id", "=", ticketId)
      .forUpdate()
      .executeTakeFirst();
    if (!ticket) throw new StudioError(404, "Ticket not found.", "NOT_FOUND");
    if (ticket.status === "closed")
      throw new StudioError(409, "This ticket is closed.", "INVALID_STATE");
    await tx
      .insertInto("support_messages")
      .values({
        id: randomUUID(),
        ticket_id: ticketId,
        account_id: account,
        author,
        body: message,
      })
      .execute();
    await tx
      .updateTable("support_tickets")
      .set({ status: author === "support" ? "waiting" : "open" })
      .where("account_id", "=", account)
      .where("id", "=", ticketId)
      .execute();
    await auditTx(tx, account, account, "support.reply", ticketId);
    return { ok: true };
  });
}

export async function closeTicket(
  db: StudioDb,
  account: string,
  ticketId: string,
) {
  return scope(db, account, async (tx) => {
    const result = await tx
      .updateTable("support_tickets")
      .set({ status: "closed" })
      .where("account_id", "=", account)
      .where("id", "=", ticketId)
      .executeTakeFirst();
    if (!result.numUpdatedRows)
      throw new StudioError(404, "Ticket not found.", "NOT_FOUND");
    await auditTx(tx, account, account, "support.close", ticketId);
    return { ok: true };
  });
}
