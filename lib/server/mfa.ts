import { createHmac, randomBytes } from "node:crypto";
import type { StudioDb } from "./studio/types";
import { StudioError } from "./studio/types";
import { scope } from "./studio/database";
import { decryptSecret, encryptSecret } from "./secrets";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Buffer) {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(value: string) {
  let bits = 0;
  let current = 0;
  const output: number[] = [];
  for (const char of value.replace(/=+$/, "").toUpperCase()) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) continue;
    current = (current << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((current >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

function hotp(secret: string, counter: number) {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", base32Decode(secret))
    .update(buffer)
    .digest();
  const offset = digest[digest.length - 1] & 0xf;
  const code =
    (((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff)) %
    1_000_000;
  return String(code).padStart(6, "0");
}

export function currentTotp(secret: string, now = Date.now()) {
  return hotp(secret, Math.floor(now / 30_000));
}

export function verifyTotp(secret: string, code: string, now = Date.now()) {
  const clean = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  const counter = Math.floor(now / 30_000);
  return [-1, 0, 1].some((offset) => hotp(secret, counter + offset) === clean);
}

export async function mfaStatus(db: StudioDb, account: string) {
  return scope(db, account, async (tx) => {
    const row = await tx
      .selectFrom("mfa_credentials")
      .select(["enabled_at"])
      .where("account_id", "=", account)
      .executeTakeFirst();
    return { enabled: Boolean(row?.enabled_at) };
  });
}

export async function beginMfaSetup(
  db: StudioDb,
  account: string,
  email: string,
) {
  const secret = base32Encode(randomBytes(20));
  await scope(db, account, async (tx) => {
    await tx
      .deleteFrom("mfa_credentials")
      .where("account_id", "=", account)
      .execute();
    await tx
      .insertInto("mfa_credentials")
      .values({
        account_id: account,
        secret_encrypted: encryptSecret(secret),
        enabled_at: null,
      })
      .execute();
  });
  const issuer = encodeURIComponent("Tradeintra");
  const label = encodeURIComponent(email);
  return {
    secret,
    otpauth: `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}&digits=6&period=30`,
  };
}

export async function enableMfa(db: StudioDb, account: string, code: string) {
  const result = await scope(db, account, async (tx) => {
    const row = await tx
      .selectFrom("mfa_credentials")
      .select(["secret_encrypted", "enabled_at"])
      .where("account_id", "=", account)
      .executeTakeFirst();
    if (!row)
      throw new StudioError(
        409,
        "Start two-factor setup first.",
        "MFA_NOT_SETUP",
      );
    if (!verifyTotp(decryptSecret(row.secret_encrypted), code))
      throw new StudioError(422, "Invalid authenticator code.", "INVALID_MFA");
    await tx
      .updateTable("mfa_credentials")
      .set({ enabled_at: new Date() })
      .where("account_id", "=", account)
      .execute();
    return { enabled: true };
  });
  return result;
}

export async function disableMfa(db: StudioDb, account: string, code: string) {
  return scope(db, account, async (tx) => {
    const row = await tx
      .selectFrom("mfa_credentials")
      .select(["secret_encrypted", "enabled_at"])
      .where("account_id", "=", account)
      .executeTakeFirst();
    if (!row?.enabled_at)
      throw new StudioError(
        409,
        "Two-factor authentication is not enabled.",
        "MFA_DISABLED",
      );
    if (!verifyTotp(decryptSecret(row.secret_encrypted), code))
      throw new StudioError(422, "Invalid authenticator code.", "INVALID_MFA");
    await tx
      .deleteFrom("mfa_credentials")
      .where("account_id", "=", account)
      .execute();
    return { enabled: false };
  });
}

export async function requireMfa(
  db: StudioDb,
  account: string,
  code: string | undefined,
) {
  const row = await scope(db, account, (tx) =>
    tx
      .selectFrom("mfa_credentials")
      .select(["secret_encrypted", "enabled_at"])
      .where("account_id", "=", account)
      .executeTakeFirst(),
  );
  if (!row?.enabled_at) return;
  if (!code)
    throw new StudioError(
      401,
      "Enter your authenticator code.",
      "MFA_REQUIRED",
    );
  if (!verifyTotp(decryptSecret(row.secret_encrypted), code))
    throw new StudioError(401, "Invalid authenticator code.", "INVALID_MFA");
}
