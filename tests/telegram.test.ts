import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { getStudioDb } from "../lib/server/studio/database";
import type { StudioDb, Actor } from "../lib/server/studio/types";
import { authenticate } from "../lib/server/studio/auth";
import {
  getTelegramConnection,
  removeTelegramConnection,
  upsertTelegramConnection,
} from "../lib/server/telegram";
import { decryptSecret, encryptSecret } from "../lib/server/secrets";

let db: StudioDb;
let directory: string;
let actor: Actor;

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "tradeintra-telegram-"));
  process.env.STUDIO_DB_MODE = "local";
  process.env.STUDIO_ENV = "local";
  process.env.STUDIO_DATA_DIR = directory;
  db = await getStudioDb();
  actor = (
    await authenticate(db, "telegram@example.test", "TelegramPass1", true, {
      fullName: "Telegram Provider",
    })
  ).actor;
}, 30000);

afterAll(async () => {
  await db?.destroy();
  await rm(directory, { recursive: true, force: true });
  delete process.env.STUDIO_DB_MODE;
  delete process.env.STUDIO_ENV;
  delete process.env.STUDIO_DATA_DIR;
});

describe("per-provider Telegram connections", () => {
  it("encrypts, stores, returns, and removes a Telegram connection", async () => {
    const encrypted = encryptSecret("123456:ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    expect(encrypted).not.toContain("ABCDEF");
    expect(decryptSecret(encrypted)).toBe("123456:ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    await upsertTelegramConnection(
      db,
      actor.id,
      "123456:ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      "@mock_channel",
    );
    const connection = await getTelegramConnection(db, actor.id);
    expect(connection?.chatId).toBe("@mock_channel");
    expect(connection?.botToken).toContain("ABCDEF");
    await removeTelegramConnection(db, actor.id);
    expect(await getTelegramConnection(db, actor.id)).toBeNull();
  });
});
