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
  verifyEmail,
} from "../lib/server/studio/auth";
import {
  assignBot,
  createBot,
  listBots,
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
  await db?.destroy();
  await rm(directory, { recursive: true, force: true });
  delete process.env.STUDIO_DB_MODE;
  delete process.env.STUDIO_ENV;
  delete process.env.STUDIO_DATA_DIR;
});

describe("server bot preset library", () => {
  it("stores, validates, verifies, and assigns a Deriv preset", async () => {
    const bot = await createBot(
      db,
      actor.id,
      "1-3-2-6",
      '<xml is_dbot="true"><block type="trade_definition"></block></xml>',
    );
    await expect(validateBot(db, actor.id, bot.id)).resolves.toMatchObject({
      valid: true,
    });
    await expect(verifyBot(db, actor.id, bot.id)).resolves.toMatchObject({
      valid: true,
    });
    await expect(
      assignBot(db, actor.id, bot.id, siteId),
    ).resolves.toMatchObject({ ok: true });
    expect(await listBots(db, actor.id)).toHaveLength(1);
  });

  it("accepts official block XML without adding a fake strategy block", async () => {
    const bot = await createBot(
      db,
      actor.id,
      "D’Alembert",
      '<xml is_dbot="true"><block type="trade_definition"></block></xml>',
    );
    const verified = await verifyBot(db, actor.id, bot.id);
    expect(verified.fixes).not.toContain("added strategy block");
    expect(verified.valid).toBe(true);
  });

  it("rejects unsafe XML and removes stored bots", async () => {
    const bot = await createBot(
      db,
      actor.id,
      "Unsafe bot",
      '<xml><block type="trade_definition"></block><script>bad()</script></xml>',
    );
    await expect(verifyBot(db, actor.id, bot.id)).rejects.toMatchObject({
      code: "UNSAFE_BOT",
    });
    expect(
      sandboxBot("<xml><block /><script>bad()</script></xml>"),
    ).toMatchObject({ ok: false });
    await removeBot(db, actor.id, bot.id);
    expect(
      (await listBots(db, actor.id)).some((item) => item.id === bot.id),
    ).toBe(false);
  });
});
