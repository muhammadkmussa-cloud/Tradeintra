import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { getStudioDb } from "../lib/server/studio/database";
import type { StudioDb, Actor } from "../lib/server/studio/types";
import { authenticate } from "../lib/server/studio/auth";
import {
  closeTicket,
  createTicket,
  listTickets,
  replyTicket,
} from "../lib/server/support";
import {
  createAnnouncement,
  listAnnouncements,
  publishAnnouncement,
} from "../lib/server/announcements";
import {
  cancelDeletion,
  exportAccount,
  requestDeletion,
} from "../lib/server/account";

let db: StudioDb;
let directory: string;
let actor: Actor;

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "tradeintra-support-"));
  process.env.STUDIO_DB_MODE = "local";
  process.env.STUDIO_ENV = "local";
  process.env.STUDIO_DATA_DIR = directory;
  process.env.STORAGE_ROOT = path.join(directory, "storage");
  db = await getStudioDb();
  actor = (
    await authenticate(db, "support@example.test", "SupportPass1", true, {
      fullName: "Support Operator",
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

describe("support, announcements, and account lifecycle", () => {
  it("creates, replies to, and closes a ticket", async () => {
    const created = await createTicket(
      db,
      actor.id,
      "Domain issue",
      "domain",
      "DNS is pending.",
    );
    let tickets = await listTickets(db, actor.id);
    expect(tickets[0]).toMatchObject({
      subject: "Domain issue",
      status: "open",
    });
    await replyTicket(db, actor.id, created.id, "Support is checking.");
    tickets = await listTickets(db, actor.id);
    expect(tickets[0].messages).toHaveLength(2);
    await closeTicket(db, actor.id, created.id);
    expect((await listTickets(db, actor.id))[0].status).toBe("closed");
  });

  it("drafts and publishes an announcement", async () => {
    const created = await createAnnouncement(
      db,
      actor.id,
      "Notice",
      "Body",
      "all",
    );
    await publishAnnouncement(db, actor.id, created.id);
    expect((await listAnnouncements(db, actor.id))[0].status).toBe("published");
  });

  it("exports account data and supports deletion grace/cancel", async () => {
    const exported = await exportAccount(db, actor.id);
    expect(exported.account.id).toBe(actor.id);
    expect(exported.tickets.length).toBeGreaterThan(0);
    const deletion = await requestDeletion(db, actor.id);
    expect(deletion.executeAfter.getTime()).toBeGreaterThan(Date.now());
    await cancelDeletion(db, actor.id);
  });
});
