import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getStudioDb, scope } from "../lib/server/studio/database";
import type { StudioDb, Actor } from "../lib/server/studio/types";
import {
  authenticate,
  createEmailVerification,
  creditBalance,
  verifyEmail,
} from "../lib/server/studio/auth";
import {
  assignBot,
  createBot,
  generateBot,
  listBots,
  refineBot,
  removeBot,
  sandboxBot,
  validateBot,
  verifyBot,
} from "../lib/server/bots";
import { defaultConfig } from "../lib/studio";

let db: StudioDb;
let directory: string;
let actor: Actor;
let siteId: string;

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "tradeintra-bots-"));
  process.env.STUDIO_DB_MODE = "local";
  process.env.STUDIO_ENV = "local";
  process.env.STUDIO_DATA_DIR = directory;
  process.env.DEEPSEEK_MODE = "mock";
  db = await getStudioDb();
  actor = (
    await authenticate(db, "bots@example.test", "BotsPass1", true, {
      fullName: "Bot Operator",
    })
  ).actor;
  const token = await createEmailVerification(db, actor.id);
  await verifyEmail(db, token);
  await db
    .updateTable("credentials")
    .set({ email_verified_at: new Date() })
    .where("id", "=", actor.id)
    .execute();
  siteId = randomUUID();
  await scope(db, actor.id, (tx) =>
    tx
      .insertInto("sites")
      .values({
        account_id: actor.id,
        id: siteId,
        draft: { ...defaultConfig, name: "Bot Site", slug: "bot-site" },
        published_version: null,
        archived: false,
      })
      .execute(),
  );
}, 30000);

afterAll(async () => {
  delete process.env.DEEPSEEK_MODE;
  await db?.destroy();
  await rm(directory, { recursive: true, force: true });
  delete process.env.STUDIO_DB_MODE;
  delete process.env.STUDIO_ENV;
  delete process.env.STUDIO_DATA_DIR;
});

describe("server bot generation and library", () => {
  it("generates a mock bot, debits credits, validates, and assigns it", async () => {
    const generated = await generateBot(
      db,
      actor.id,
      "A cautious volatility breakout with a fixed stake and stop loss.",
    );
    expect(generated.provider).toBe("mock");
    expect(generated.credits).toBe(20);
    const bots = await listBots(db, actor.id);
    expect(bots[0].xml).toContain("<xml");
    await expect(
      validateBot(db, actor.id, generated.botId),
    ).resolves.toMatchObject({
      valid: true,
    });
    await expect(
      assignBot(db, actor.id, generated.botId, siteId),
    ).resolves.toMatchObject({ ok: true });
    expect(await creditBalance(db, actor.id)).toBe(20);
  });

  it("verifies unsafe XML, refines a bot, and runs sandbox checks", async () => {
    const bot = await createBot(
      db,
      actor.id,
      "Fixable bot",
      '<xml><strategy name="fixable"></xml>',
    );
    const verified = await verifyBot(db, actor.id, bot.id);
    expect(verified.valid).toBe(true);
    expect(verified.fixes).toContain("added strategy block");
    const refined = await refineBot(
      db,
      actor.id,
      bot.id,
      "Tighten the stop loss and add a session filter.",
    );
    expect(refined.bot.xml).toContain("<xml>");
    expect(refined.credits).toBe(14);
    expect(
      sandboxBot("<xml><strategy /><script>bad()</script></xml>"),
    ).toMatchObject({ ok: false });
  });

  it("stores, validates, and removes a manually supplied bot", async () => {
    const bot = await createBot(
      db,
      actor.id,
      "Manual bot",
      '<xml><strategy name="manual" /></xml>',
    );
    expect(bot.compatibility).toBe("standard-dbot");
    await validateBot(db, actor.id, bot.id);
    await removeBot(db, actor.id, bot.id);
    expect(
      (await listBots(db, actor.id)).some((item) => item.id === bot.id),
    ).toBe(false);
  });
});
