import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { sql } from "kysely";
import type { StudioDb, Actor } from "./types";
import { StudioError } from "./types";
import { scope } from "./database";
export const SESSION_COOKIE = "tradeintra_session";
export const SESSION_SECONDS = 7 * 24 * 60 * 60;
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const derive = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(
      password,
      salt,
      64,
      { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt-v1:${salt}:${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [version, salt, hex] = stored.split(":");
  if (
    version !== "scrypt-v1" ||
    !/^[a-f0-9]{32}$/.test(salt || "") ||
    !/^[a-f0-9]{128}$/.test(hex || "")
  )
    return false;
  const actual = await derive(password, salt);
  return timingSafeEqual(actual, Buffer.from(hex, "hex"));
}
const dummy = `scrypt-v1:${"0".repeat(32)}:${"0".repeat(128)}`;
export async function rateLimit(
  db: StudioDb,
  key: string,
  limit: number,
  windowSeconds: number,
) {
  const windowStart =
    Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds;
  const result = await sql<{
    attempts: number;
  }>`INSERT INTO tradeintra_studio.rate_limits(key,window_start,attempts) VALUES(${digest(key)},${String(windowStart)},1) ON CONFLICT(key,window_start) DO UPDATE SET attempts=tradeintra_studio.rate_limits.attempts+1 RETURNING attempts`.execute(
    db,
  );
  if (result.rows[0].attempts > limit)
    throw new StudioError(
      429,
      "Too many attempts. Please wait before trying again.",
      "RATE_LIMITED",
    );
  // Bound old windows; never store IPs or raw email addresses in limiter keys.
  await db
    .deleteFrom("rate_limits")
    .where("window_start", "<", String(Math.floor(Date.now() / 1000) - 86400))
    .execute();
}
export async function authenticate(
  db: StudioDb,
  email: string,
  password: string,
  register: boolean,
): Promise<{ actor: Actor; token: string }> {
  await rateLimit(
    db,
    register ? "register-global" : "login-global",
    register ? 30 : 200,
    3600,
  );
  await rateLimit(db, `auth:${email}`, 8, 900);
  let id: string;
  if (register) {
    id = randomUUID();
    const passwordHash = await hashPassword(password);
    try {
      await scope(db, id, async (tx) => {
        await tx
          .insertInto("credentials")
          .values({ id, email, password_hash: passwordHash })
          .execute();
        await tx
          .insertInto("accounts")
          .values({
            id,
            workspace: "My workspace",
            deriv_linked: false,
            revision: 0,
          })
          .execute();
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "23505"
      )
        throw new StudioError(
          409,
          "Unable to create this account. Try signing in instead.",
          "ACCOUNT_EXISTS",
        );
      throw error;
    }
  } else {
    const credential = await db
      .selectFrom("credentials")
      .select(["id", "password_hash"])
      .where("email", "=", email)
      .executeTakeFirst();
    const valid = await verifyPassword(
      password,
      credential?.password_hash ?? dummy,
    );
    if (!credential || !valid)
      throw new StudioError(
        401,
        "Email or password is incorrect.",
        "INVALID_CREDENTIALS",
      );
    id = credential.id;
  }
  const token = randomBytes(32).toString("base64url");
  await db.transaction().execute(async (tx) => {
    // Serialize sign-ins for this identity so concurrent logins cannot exceed the cap.
    await tx
      .selectFrom("credentials")
      .select("id")
      .where("id", "=", id)
      .forUpdate()
      .executeTakeFirstOrThrow();
    await tx
      .deleteFrom("sessions")
      .where("expires_at", "<", new Date())
      .execute();
    // Keep five most recent sign-ins per account. Tokens are never stored in plaintext.
    const previous = await tx
      .selectFrom("sessions")
      .select("token_hash")
      .where("account_id", "=", id)
      .orderBy("created_at", "desc")
      .execute();
    if (previous.length >= 5)
      await tx
        .deleteFrom("sessions")
        .where(
          "token_hash",
          "in",
          previous.slice(4).map((s) => s.token_hash),
        )
        .execute();
    await tx
      .insertInto("sessions")
      .values({
        token_hash: digest(token),
        account_id: id,
        expires_at: new Date(Date.now() + SESSION_SECONDS * 1000),
      })
      .execute();
  });
  return { actor: { id, email, emailVerified: false }, token };
}
export async function sessionActor(
  db: StudioDb,
  token: string | undefined,
): Promise<Actor | null> {
  if (!token || !/^[a-zA-Z0-9_-]{43}$/.test(token)) return null;
  const actor = await db
    .selectFrom("sessions")
    .innerJoin("credentials", "credentials.id", "sessions.account_id")
    .select(["credentials.id", "credentials.email"])
    .where("sessions.token_hash", "=", digest(token))
    .where("sessions.expires_at", ">", new Date())
    .executeTakeFirst();
  return actor ? { ...actor, emailVerified: false } : null;
}
export async function logout(db: StudioDb, token: string | undefined) {
  if (token)
    await db
      .deleteFrom("sessions")
      .where("token_hash", "=", digest(token))
      .execute();
}
