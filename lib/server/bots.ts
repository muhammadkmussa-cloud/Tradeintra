import { randomUUID } from "node:crypto";
import type { StudioDb, StudioTrx } from "./studio/types";
import { StudioError } from "./studio/types";
import { scope } from "./studio/database";
export async function listBots(db: StudioDb, account: string) {
  return scope(db, account, (tx) =>
    tx
      .selectFrom("bots")
      .selectAll()
      .where("account_id", "=", account)
      .orderBy("created_at", "desc")
      .execute(),
  );
}

export async function createBot(
  db: StudioDb,
  account: string,
  name: string,
  xml: string,
) {
  const title = name.trim();
  const document = xml.trim();
  if (!title || title.length > 80)
    throw new StudioError(422, "Enter a bot name.", "VALIDATION");
  if (!document.startsWith("<xml") || document.length > 200_000)
    throw new StudioError(
      422,
      "Upload a valid XML bot document.",
      "VALIDATION",
    );
  return scope(db, account, async (tx) => {
    const bot = {
      id: randomUUID(),
      account_id: account,
      name: title,
      xml: document,
      compatibility: document.includes("tradeintra")
        ? ("tradeintra-only" as const)
        : ("standard-dbot" as const),
      status: "draft" as const,
      site_id: null,
    };
    await tx.insertInto("bots").values(bot).execute();
    return bot;
  });
}

export async function validateBot(
  db: StudioDb,
  account: string,
  botId: string,
) {
  return scope(db, account, async (tx) => {
    const bot = await tx
      .selectFrom("bots")
      .selectAll()
      .where("account_id", "=", account)
      .where("id", "=", botId)
      .executeTakeFirst();
    if (!bot) throw new StudioError(404, "Bot not found.", "NOT_FOUND");
    const valid =
      bot.xml.trim().startsWith("<xml") &&
      (/<strategy[\s/>]/.test(bot.xml) || /<block[\s>]/.test(bot.xml)) &&
      !/<script|javascript:/i.test(bot.xml);
    await tx
      .updateTable("bots")
      .set({ status: valid ? "validated" : "failed" })
      .where("account_id", "=", account)
      .where("id", "=", botId)
      .execute();
    return { valid };
  });
}

export async function assignBot(
  db: StudioDb,
  account: string,
  botId: string,
  siteId: string,
) {
  return scope(db, account, async (tx) => {
    const site = await tx
      .selectFrom("sites")
      .select("id")
      .where("account_id", "=", account)
      .where("id", "=", siteId)
      .where("archived", "=", false)
      .executeTakeFirst();
    if (!site) throw new StudioError(404, "Site not found.", "NOT_FOUND");
    const bot = await tx
      .selectFrom("bots")
      .select("id")
      .where("account_id", "=", account)
      .where("id", "=", botId)
      .executeTakeFirst();
    if (!bot) throw new StudioError(404, "Bot not found.", "NOT_FOUND");
    await tx
      .updateTable("bots")
      .set({ site_id: siteId, status: "assigned" })
      .where("account_id", "=", account)
      .where("id", "=", botId)
      .execute();
    return { ok: true };
  });
}

export async function removeBot(db: StudioDb, account: string, botId: string) {
  return scope(db, account, async (tx) => {
    await tx
      .deleteFrom("bots")
      .where("account_id", "=", account)
      .where("id", "=", botId)
      .execute();
    return { ok: true };
  });
}

export async function verifyBot(db: StudioDb, account: string, botId: string) {
  const bot = await scope(db, account, (tx) =>
    tx
      .selectFrom("bots")
      .selectAll()
      .where("account_id", "=", account)
      .where("id", "=", botId)
      .executeTakeFirst(),
  );
  if (!bot) throw new StudioError(404, "Bot not found.", "NOT_FOUND");
  let xml = bot.xml.trim();
  const fixes: string[] = [];
  if (!xml.startsWith("<xml")) {
    xml = `<xml>${xml}</xml>`;
    fixes.push("wrapped in xml root");
  }
  if (!/<strategy[\s/>]/.test(xml) && !/<block[\s>]/.test(xml)) {
    xml = xml.replace("</xml>", "<strategy/></xml>");
    fixes.push("added strategy block");
  }
  if (/<script|javascript:/i.test(xml)) {
    await scope(db, account, (tx) =>
      tx
        .updateTable("bots")
        .set({ status: "failed" })
        .where("account_id", "=", account)
        .where("id", "=", botId)
        .execute(),
    );
    throw new StudioError(
      422,
      "The bot contains unsafe script content.",
      "UNSAFE_BOT",
    );
  }
  const valid =
    xml.startsWith("<xml") &&
    (/<strategy[\s/>]/.test(xml) || /<block[\s>]/.test(xml));
  await scope(db, account, (tx) =>
    tx
      .updateTable("bots")
      .set({ xml, status: valid ? "validated" : "failed" })
      .where("account_id", "=", account)
      .where("id", "=", botId)
      .execute(),
  );
  return { valid, fixes, xml };
}

export function sandboxBot(xml: string) {
  const checks = [
    { name: "xml root", ok: xml.trim().startsWith("<xml") },
    {
      name: "strategy block",
      ok: /<strategy[\s/>]/.test(xml) || /<block[\s>]/.test(xml),
    },
    { name: "no script", ok: !/<script|javascript:/i.test(xml) },
    { name: "size limit", ok: xml.length <= 200_000 },
  ];
  return { ok: checks.every((check) => check.ok), checks };
}
