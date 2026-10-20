import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { sql } from "kysely";
import type { StudioDb, StudioTrx, Actor } from "./types";
import { StudioError } from "./types";
import { scope } from "./database";
import { sendEmail } from "../providers/email";

export const SESSION_COOKIE = "tradeintra_session";
export const SESSION_SECONDS = 7 * 24 * 60 * 60;
export const STARTER_CREDITS = 30;
export const REFERRAL_CREDITS = 30;
export const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[0-9]).{8,128}$/;
export const REFERRAL_PATTERN = /^TRD-[A-F0-9]{8}$/;

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
export function validatePasswordPolicy(password: string) {
  if (!PASSWORD_PATTERN.test(password))
    throw new StudioError(
      422,
      "Use at least 8 characters, including one uppercase letter and one number.",
      "WEAK_PASSWORD",
      {
        password:
          "Use at least 8 characters, including one uppercase letter and one number.",
      },
    );
}
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
  await db
    .deleteFrom("rate_limits")
    .where("window_start", "<", String(Math.floor(Date.now() / 1000) - 86400))
    .execute();
}

function referralCode() {
  return `TRD-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function grantCredits(
  db: StudioDb,
  accountId: string,
  delta: number,
  reason: string,
  reference?: string,
) {
  await db
    .insertInto("credit_ledger")
    .values({
      id: randomUUID(),
      account_id: accountId,
      delta,
      reason,
      reference: reference ?? null,
    })
    .execute();
}

export async function creditBalance(db: StudioDb, accountId: string) {
  const row = await db
    .selectFrom("credit_ledger")
    .select(({ fn }) => fn.sum<number>("delta").as("balance"))
    .where("account_id", "=", accountId)
    .executeTakeFirst();
  return Number(row?.balance ?? 0);
}

async function createSession(db: StudioDb, id: string) {
  const token = randomBytes(32).toString("base64url");
  await db.transaction().execute(async (tx) => {
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
          previous.slice(4).map((session) => session.token_hash),
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
  return token;
}

export type RegisterProfile = {
  fullName: string;
  referralCode?: string;
};

export async function authenticate(
  db: StudioDb,
  email: string,
  password: string,
  register: boolean,
  profile?: RegisterProfile,
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
    validatePasswordPolicy(password);
    const fullName = profile?.fullName?.trim() ?? "";
    if (fullName.length < 2 || fullName.length > 80)
      throw new StudioError(422, "Enter your full name.", "VALIDATION", {
        fullName: "Enter your full name.",
      });
    id = randomUUID();
    const passwordHash = await hashPassword(password);
    const code = referralCode();
    try {
      await scope(db, id, async (tx) => {
        await tx
          .insertInto("credentials")
          .values({
            id: id as string,
            email,
            password_hash: passwordHash,
            full_name: fullName,
            email_verified_at: null,
            referral_code: code,
            referred_by: null,
            role: "user",
          })
          .execute();
        await tx
          .insertInto("accounts")
          .values({
            id: id as string,
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
    const supplied = profile?.referralCode?.trim().toUpperCase();
    if (supplied && supplied !== code) {
      const referrer = await db
        .selectFrom("credentials")
        .select("id")
        .where("referral_code", "=", supplied)
        .executeTakeFirst();
      if (referrer && referrer.id !== id) {
        await db
          .insertInto("referrals")
          .values({
            id: randomUUID(),
            referrer_id: referrer.id,
            referee_id: id,
            code: supplied,
            status: "pending",
            rewarded_at: null,
          })
          .execute();
      }
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
  const token = await createSession(db, id as string);
  const actor = await sessionActor(db, token);
  if (!actor) throw new StudioError(503, "Unable to create a session.");
  return { actor, token };
}

export async function createEmailVerification(db: StudioDb, accountId: string) {
  const token = randomBytes(24).toString("base64url");
  await db
    .deleteFrom("email_verifications")
    .where("account_id", "=", accountId)
    .where("used_at", "is", null)
    .execute();
  await db
    .insertInto("email_verifications")
    .values({
      token_hash: digest(token),
      account_id: accountId,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      used_at: null,
    })
    .execute();
  return token;
}

async function markVerifiedAndGrant(tx: StudioTrx, accountId: string) {
  const row = await tx
    .selectFrom("credentials")
    .select("email_verified_at")
    .where("id", "=", accountId)
    .forUpdate()
    .executeTakeFirstOrThrow();
  if (row.email_verified_at) return;
  const now = new Date();
  await tx
    .updateTable("credentials")
    .set({ email_verified_at: now })
    .where("id", "=", accountId)
    .execute();
  const starter = await tx
    .selectFrom("credit_ledger")
    .select("id")
    .where("account_id", "=", accountId)
    .where("reason", "=", "Starter credits")
    .executeTakeFirst();
  if (!starter)
    await tx
      .insertInto("credit_ledger")
      .values({
        id: randomUUID(),
        account_id: accountId,
        delta: STARTER_CREDITS,
        reason: "Starter credits",
        reference: "starter",
      })
      .execute();
  const referral = await tx
    .selectFrom("referrals")
    .select(["id", "referrer_id", "reward_credits"])
    .where("referee_id", "=", accountId)
    .where("status", "=", "pending")
    .forUpdate()
    .executeTakeFirst();
  if (referral) {
    await tx
      .updateTable("referrals")
      .set({ status: "rewarded", rewarded_at: now })
      .where("id", "=", referral.id)
      .execute();
    await tx
      .insertInto("credit_ledger")
      .values({
        id: randomUUID(),
        account_id: referral.referrer_id,
        delta: referral.reward_credits,
        reason: "Referral reward",
        reference: referral.id,
      })
      .execute();
  }
}

export async function verifyEmail(db: StudioDb, token: string) {
  const now = new Date();
  return db.transaction().execute(async (tx) => {
    const row = await tx
      .selectFrom("email_verifications")
      .select(["account_id"])
      .where("token_hash", "=", digest(token))
      .where("used_at", "is", null)
      .where("expires_at", ">", now)
      .forUpdate()
      .executeTakeFirst();
    if (!row)
      throw new StudioError(
        400,
        "This verification link is invalid or expired.",
      );
    await tx
      .updateTable("email_verifications")
      .set({ used_at: now })
      .where("token_hash", "=", digest(token))
      .execute();
    await markVerifiedAndGrant(tx, row.account_id);
    return { accountId: row.account_id };
  });
}

export async function createPasswordReset(db: StudioDb, accountId: string) {
  const token = randomBytes(24).toString("base64url");
  await db
    .insertInto("password_resets")
    .values({
      token_hash: digest(token),
      account_id: accountId,
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
      used_at: null,
    })
    .execute();
  return token;
}

export async function resetPassword(
  db: StudioDb,
  token: string,
  password: string,
) {
  validatePasswordPolicy(password);
  const passwordHash = await hashPassword(password);
  const now = new Date();
  return db.transaction().execute(async (tx) => {
    const row = await tx
      .selectFrom("password_resets")
      .select(["account_id"])
      .where("token_hash", "=", digest(token))
      .where("used_at", "is", null)
      .where("expires_at", ">", now)
      .forUpdate()
      .executeTakeFirst();
    if (!row)
      throw new StudioError(400, "This reset link is invalid or expired.");
    await tx
      .updateTable("password_resets")
      .set({ used_at: now })
      .where("token_hash", "=", digest(token))
      .execute();
    await tx
      .updateTable("credentials")
      .set({ password_hash: passwordHash })
      .where("id", "=", row.account_id)
      .execute();
    await tx
      .deleteFrom("sessions")
      .where("account_id", "=", row.account_id)
      .execute();
    return { accountId: row.account_id };
  });
}

export async function sessionActor(
  db: StudioDb,
  token: string | undefined,
): Promise<Actor | null> {
  if (!token || !/^[a-zA-Z0-9_-]{43}$/.test(token)) return null;
  const actor = await db
    .selectFrom("sessions")
    .innerJoin("credentials", "credentials.id", "sessions.account_id")
    .select([
      "credentials.id",
      "credentials.email",
      "credentials.full_name",
      "credentials.email_verified_at",
      "credentials.role",
    ])
    .where("sessions.token_hash", "=", digest(token))
    .where("sessions.expires_at", ">", new Date())
    .executeTakeFirst();
  if (!actor) return null;
  const adminEmails = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return {
    id: actor.id,
    email: actor.email,
    fullName: actor.full_name,
    emailVerified: Boolean(actor.email_verified_at),
    role: adminEmails.includes(actor.email.toLowerCase())
      ? "super_admin"
      : actor.role,
  };
}

export async function logout(db: StudioDb, token: string | undefined) {
  if (token)
    await db
      .deleteFrom("sessions")
      .where("token_hash", "=", digest(token))
      .execute();
}

export async function googleSignIn(
  db: StudioDb,
  profile: {
    providerAccountId: string;
    email: string;
    fullName: string;
    emailVerified: boolean;
  },
): Promise<{ actor: Actor; token: string }> {
  if (!profile.emailVerified)
    throw new StudioError(
      403,
      "Verify your Google email before continuing.",
      "EMAIL_UNVERIFIED",
    );
  const email = profile.email.trim().toLowerCase();
  const existingIdentity = await db
    .selectFrom("auth_identities")
    .select("account_id")
    .where("provider", "=", "google")
    .where("provider_account_id", "=", profile.providerAccountId)
    .executeTakeFirst();
  let id = existingIdentity?.account_id;
  if (!id) {
    const existingAccount = await db
      .selectFrom("credentials")
      .select("id")
      .where("email", "=", email)
      .executeTakeFirst();
    if (existingAccount) {
      id = existingAccount.id;
      if (profile.emailVerified)
        await db
          .updateTable("credentials")
          .set({ email_verified_at: new Date() })
          .where("id", "=", id)
          .where("email_verified_at", "is", null)
          .execute();
    } else {
      id = randomUUID();
      const passwordHash = await hashPassword(
        randomBytes(32).toString("base64url"),
      );
      await scope(db, id, async (tx) => {
        await tx
          .insertInto("credentials")
          .values({
            id: id as string,
            email,
            password_hash: passwordHash,
            full_name: profile.fullName,
            email_verified_at: null,
            referral_code: referralCode(),
            referred_by: null,
            role: "user",
          })
          .execute();
        await tx
          .insertInto("accounts")
          .values({
            id: id as string,
            workspace: "My workspace",
            deriv_linked: false,
            revision: 0,
          })
          .execute();
      });
    }
    const accountId = id as string;
    await db
      .insertInto("auth_identities")
      .values({
        provider: "google",
        provider_account_id: profile.providerAccountId,
        account_id: accountId,
        email,
      })
      .onConflict((oc) =>
        oc.columns(["provider", "provider_account_id"]).doNothing(),
      )
      .execute();
  }
  await db
    .transaction()
    .execute((tx) => markVerifiedAndGrant(tx, id as string));
  const token = await createSession(db, id as string);
  const actor = await sessionActor(db, token);
  if (!actor) throw new StudioError(503, "Unable to create a session.");
  return { actor, token };
}

export async function googleMockSignIn(db: StudioDb) {
  return googleSignIn(db, {
    providerAccountId: "mock-google-account",
    email: "mock-google@example.test",
    fullName: "Mock Google Operator",
    emailVerified: true,
  });
}
