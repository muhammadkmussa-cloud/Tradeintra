import { randomUUID } from "node:crypto";
import type { StudioDb } from "./studio/types";
import { StudioError } from "./studio/types";
import { scope } from "./studio/database";
import { decryptSecret, encryptSecret } from "./secrets";

export async function upsertTelegramConnection(
  db: StudioDb,
  account: string,
  botToken: string,
  chatId: string,
) {
  const token = botToken.trim();
  const chat = chatId.trim();
  if (!/^\d{6,}:[A-Za-z0-9_-]{20,}$/.test(token))
    throw new StudioError(
      422,
      "Enter a valid Telegram bot token.",
      "VALIDATION",
    );
  if (!chat)
    throw new StudioError(
      422,
      "Enter a Telegram chat or channel.",
      "VALIDATION",
    );
  return scope(db, account, async (tx) => {
    const encrypted = encryptSecret(token);
    await tx
      .insertInto("telegram_connections")
      .values({
        account_id: account,
        bot_token_encrypted: encrypted,
        chat_id: chat,
        status: "linked",
      })
      .onConflict((oc) =>
        oc.column("account_id").doUpdateSet({
          bot_token_encrypted: encrypted,
          chat_id: chat,
          status: "linked",
        }),
      )
      .execute();
    return { chatId: chat, status: "linked" as const };
  });
}

export async function getTelegramConnection(db: StudioDb, account: string) {
  return scope(db, account, async (tx) => {
    const row = await tx
      .selectFrom("telegram_connections")
      .selectAll()
      .where("account_id", "=", account)
      .where("status", "=", "linked")
      .executeTakeFirst();
    return row
      ? {
          chatId: row.chat_id,
          botToken: decryptSecret(row.bot_token_encrypted),
        }
      : null;
  });
}

export async function removeTelegramConnection(db: StudioDb, account: string) {
  return scope(db, account, async (tx) => {
    await tx
      .deleteFrom("telegram_connections")
      .where("account_id", "=", account)
      .execute();
    return { status: "revoked" as const };
  });
}

export async function testTelegramConnection(db: StudioDb, account: string) {
  const connection = await getTelegramConnection(db, account);
  if (!connection)
    throw new StudioError(
      404,
      "No Telegram connection is linked.",
      "NOT_FOUND",
    );
  const response = await fetch(
    `https://api.telegram.org/bot${connection.botToken}/getMe`,
    { signal: AbortSignal.timeout(15000) },
  );
  const body = (await response.json()) as {
    ok?: boolean;
    description?: string;
  };
  if (!response.ok || !body.ok)
    throw new StudioError(
      502,
      body.description ?? "Telegram connection failed.",
      "TELEGRAM_FAILED",
    );
  return { ok: true, chatId: connection.chatId };
}
