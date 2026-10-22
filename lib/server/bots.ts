import { randomUUID } from "node:crypto";
import type { StudioDb, StudioTrx } from "./studio/types";
import { StudioError } from "./studio/types";
import { scope } from "./studio/database";
import { generateBotXml } from "./providers/ai";
import { creditBalance } from "./studio/auth";

export const GENERATION_COST = 10;
export const REFINE_COST = 3;
export const VERIFY_COST = 3;

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

async function debit(
  tx: StudioTrx,
  account: string,
  amount: number,
  reason: string,
  reference: string,
) {
  const row = await tx
    .selectFrom("credit_ledger")
    .select(({ fn }) => fn.sum<number>("delta").as("balance"))
    .where("account_id", "=", account)
    .executeTakeFirst();
  if (Number(row?.balance ?? 0) < amount)
    throw new StudioError(
      402,
      "Insufficient AI credits. Buy a credit pack to continue.",
      "INSUFFICIENT_CREDITS",
    );
  await tx
    .insertInto("credit_ledger")
    .values({
      id: randomUUID(),
      account_id: account,
      delta: -amount,
      reason,
      reference,
    })
    .execute();
}

export async function generateBot(
  db: StudioDb,
  account: string,
  prompt: string,
) {
  const clean = prompt.trim();
  if (clean.length < 8 || clean.length > 4000)
    throw new StudioError(
      422,
      "Describe the strategy in 8–4000 characters.",
      "VALIDATION",
    );
  const jobId = randomUUID();
  await scope(db, account, async (tx) => {
    await debit(tx, account, GENERATION_COST, "AI bot generation", jobId);
    await tx
      .insertInto("bot_generation_jobs")
      .values({
        id: jobId,
        account_id: account,
        prompt: clean,
        status: "generating",
        credits: GENERATION_COST,
        provider: null,
        model: null,
        bot_id: null,
        error: null,
      })
      .execute();
  });
  try {
    const generated = await generateBotXml(clean, GENERATION_COST);
    const botId = randomUUID();
    await scope(db, account, async (tx) => {
      await tx
        .insertInto("bots")
        .values({
          id: botId,
          account_id: account,
          name: clean.slice(0, 60),
          xml: generated.xml,
          compatibility: generated.xml.includes("tradeintra")
            ? "tradeintra-only"
            : "standard-dbot",
          status: "draft",
          site_id: null,
        })
        .execute();
      await tx
        .updateTable("bot_generation_jobs")
        .set({
          status: "succeeded",
          provider: generated.provider,
          model: generated.model,
          bot_id: botId,
        })
        .where("account_id", "=", account)
        .where("id", "=", jobId)
        .execute();
    });
    return {
      ...generated,
      botId,
      jobId,
      credits: await creditBalance(db, account),
    };
  } catch (error) {
    await scope(db, account, async (tx) => {
      await tx
        .updateTable("bot_generation_jobs")
        .set({
          status: "failed",
          error:
            error instanceof Error
              ? error.message.slice(0, 200)
              : "generation failed",
        })
        .where("account_id", "=", account)
        .where("id", "=", jobId)
        .execute();
      await tx
        .insertInto("credit_ledger")
        .values({
          id: randomUUID(),
          account_id: account,
          delta: GENERATION_COST,
          reason: "AI generation refund",
          reference: jobId,
        })
        .execute();
    });
    throw new StudioError(
      502,
      "Bot generation failed. Credits were refunded.",
      "AI_FAILED",
    );
  }
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
      bot.xml.includes("<strategy") &&
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

export async function refineBot(
  db: StudioDb,
  account: string,
  botId: string,
  instruction: string,
) {
  const clean = instruction.trim();
  if (clean.length < 8 || clean.length > 2000)
    throw new StudioError(
      422,
      "Describe the refinement in 8–2000 characters.",
      "VALIDATION",
    );
  const bot = await scope(db, account, (tx) =>
    tx
      .selectFrom("bots")
      .selectAll()
      .where("account_id", "=", account)
      .where("id", "=", botId)
      .executeTakeFirst(),
  );
  if (!bot) throw new StudioError(404, "Bot not found.", "NOT_FOUND");
  const jobId = randomUUID();
  await scope(db, account, (tx) =>
    debit(tx, account, REFINE_COST, "AI bot refinement", jobId),
  );
  try {
    const generated = await generateBotXml(
      `${clean}\n\nRefine this existing bot XML:\n${bot.xml}`,
      REFINE_COST,
    );
    await scope(db, account, async (tx) => {
      await tx
        .updateTable("bots")
        .set({
          xml: generated.xml,
          compatibility: generated.xml.includes("tradeintra")
            ? "tradeintra-only"
            : "standard-dbot",
          status: "draft",
        })
        .where("account_id", "=", account)
        .where("id", "=", botId)
        .execute();
    });
    return {
      bot: {
        ...bot,
        xml: generated.xml,
      },
      provider: generated.provider,
      credits: await creditBalance(db, account),
    };
  } catch (error) {
    await scope(db, account, (tx) =>
      tx
        .insertInto("credit_ledger")
        .values({
          id: randomUUID(),
          account_id: account,
          delta: REFINE_COST,
          reason: "AI refinement refund",
          reference: jobId,
        })
        .execute(),
    );
    throw new StudioError(
      502,
      "Bot refinement failed. Credits were refunded.",
      "AI_FAILED",
    );
  }
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
  await scope(db, account, (tx) =>
    debit(tx, account, VERIFY_COST, "Bot verification", botId),
  );
  let xml = bot.xml.trim();
  const fixes: string[] = [];
  if (!xml.startsWith("<xml")) {
    xml = `<xml>${xml}</xml>`;
    fixes.push("wrapped in xml root");
  }
  if (!xml.includes("</strategy>") && !xml.includes("<strategy/>")) {
    xml = xml.replace("</xml>", "<strategy/></xml>");
    fixes.push("added strategy block");
  }
  if (/<script|javascript:/i.test(xml)) {
    await scope(db, account, (tx) =>
      tx
        .insertInto("credit_ledger")
        .values({
          id: randomUUID(),
          account_id: account,
          delta: VERIFY_COST,
          reason: "Bot verification refund",
          reference: botId,
        })
        .execute(),
    );
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
  const valid = xml.startsWith("<xml") && xml.includes("<strategy");
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
    { name: "strategy block", ok: xml.includes("<strategy") },
    { name: "no script", ok: !/<script|javascript:/i.test(xml) },
    { name: "size limit", ok: xml.length <= 200_000 },
  ];
  return { ok: checks.every((check) => check.ok), checks };
}
