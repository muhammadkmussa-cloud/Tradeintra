import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getStudioDb, scope } from "../lib/server/studio/database";
import type { StudioDb, Actor } from "../lib/server/studio/types";
import {
  authenticate,
  createEmailVerification,
  createPasswordReset,
  creditBalance,
  googleMockSignIn,
  resetPassword,
  sessionActor,
  hashPassword,
  verifyPassword,
  validatePasswordPolicy,
  verifyEmail,
  digest,
  logout,
  rateLimit,
} from "../lib/server/studio/auth";
import {
  loadState,
  applyAction,
  publishedConfig,
  publishedConfigByHost,
} from "../lib/server/studio/service";
import {
  actionSchema,
  configSchema,
  loginSchema,
  registerSchema,
} from "../lib/server/studio/input";
import { defaultConfig } from "../lib/studio";
let db: StudioDb;
let directory: string;
let a: Actor;
let b: Actor;
let token: string;
const config = (slug: string) => ({
  ...structuredClone(defaultConfig),
  name: "Test Markets",
  slug,
});
beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "tradeintra-studio-db-"));
  process.env.STUDIO_DB_MODE = "local";
  process.env.STUDIO_ENV = "local";
  process.env.STUDIO_DATA_DIR = directory;
  db = await getStudioDb();
  const auth = await authenticate(
    db,
    "account-a@example.test",
    "UniquePass1",
    true,
    { fullName: "Account A" },
  );
  a = auth.actor;
  token = auth.token;
  b = (
    await authenticate(db, "account-b@example.test", "AnotherPass1", true, {
      fullName: "Account B",
    })
  ).actor;
  for (const account of [a.id, b.id]) {
    await db
      .updateTable("credentials")
      .set({ email_verified_at: new Date() })
      .where("id", "=", account)
      .execute();
    await scope(db, account, (tx) =>
      tx
        .insertInto("deriv_links")
        .values({
          account_id: account,
          mode: "mock",
          status: "linked",
          external_account_id: `mock-${account.slice(0, 8)}`,
          encrypted_token: null,
          revoked_at: null,
        })
        .onConflict((oc) => oc.column("account_id").doNothing())
        .execute(),
    );
  }
}, 30000);
afterAll(async () => {
  await db?.destroy();
  await rm(directory, { recursive: true, force: true });
  delete process.env.STUDIO_DB_MODE;
  delete process.env.STUDIO_ENV;
  delete process.env.STUDIO_DATA_DIR;
});
async function action(actor: Actor, input: Record<string, unknown>) {
  const { revision } = await loadState(db, actor.id);
  return applyAction(
    db,
    actor.id,
    actionSchema.parse({ ...input, revision, operationId: randomUUID() }),
  );
}
describe("authenticated local MVP database and service", () => {
  it("hashes passwords with individual salts, verifies them, and never stores session tokens in plaintext", async () => {
    const hashed = await hashPassword("a unique testing password");
    expect(hashed).not.toContain("a unique testing password");
    expect(await verifyPassword("a unique testing password", hashed)).toBe(
      true,
    );
    expect(await verifyPassword("wrong password", hashed)).toBe(false);
    expect(await verifyPassword("password", "malformed")).toBe(false);
    const sessions = await db
      .selectFrom("sessions")
      .select("token_hash")
      .where("account_id", "=", a.id)
      .execute();
    expect(sessions.some((s) => s.token_hash === digest(token))).toBe(true);
    expect(sessions.some((s) => s.token_hash === token)).toBe(false);
    expect(await sessionActor(db, token)).toMatchObject({
      id: a.id,
      emailVerified: true,
    });
    expect(await sessionActor(db, "forged")).toBeNull();
  });
  it("enforces the password policy and awards verified starter/referral credits", async () => {
    expect(() => validatePasswordPolicy("weakpass")).toThrow();
    expect(() => validatePasswordPolicy("NoNumberHere")).toThrow();
    expect(() => validatePasswordPolicy("GoodPass1")).not.toThrow();
    const referrerCode = (
      await db
        .selectFrom("credentials")
        .select("referral_code")
        .where("id", "=", a.id)
        .executeTakeFirstOrThrow()
    ).referral_code;
    const referredEmail = "referred@example.test";
    const referred = await authenticate(
      db,
      referredEmail,
      "ReferredPass1",
      true,
      {
        fullName: "Referred Operator",
        referralCode: referrerCode ?? undefined,
      },
    );
    expect(referred.actor.emailVerified).toBe(false);
    expect(await creditBalance(db, referred.actor.id)).toBe(0);
    const token = await createEmailVerification(db, referred.actor.id);
    await verifyEmail(db, token);
    expect(await creditBalance(db, referred.actor.id)).toBe(30);
    expect(await creditBalance(db, a.id)).toBe(30);
    await expect(verifyEmail(db, token)).rejects.toMatchObject({
      status: 400,
    });
  });
  it("requires email verification and a Deriv link before site creation", async () => {
    const gated = (
      await authenticate(db, "gated@example.test", "GatedPass1", true, {
        fullName: "Gated Operator",
      })
    ).actor;
    await expect(
      action(gated, {
        kind: "save",
        config: config("gated-site"),
        publish: false,
      }),
    ).rejects.toMatchObject({ status: 403, code: "EMAIL_UNVERIFIED" });
    const token = await createEmailVerification(db, gated.id);
    await verifyEmail(db, token);
    await expect(
      action(gated, {
        kind: "save",
        config: config("gated-site"),
        publish: false,
      }),
    ).rejects.toMatchObject({ status: 422, code: "DERIV_REQUIRED" });
    await action(gated, {
      kind: "settings",
      workspace: "Gated workspace",
      derivLinked: true,
    });
    await expect(
      action(gated, {
        kind: "save",
        config: config("gated-site"),
        publish: false,
      }),
    ).resolves.toMatchObject({ revision: expect.any(Number) });
  });
  it("creates a verified mock Google account with starter credits", async () => {
    const google = await googleMockSignIn(db);
    expect(google.actor.emailVerified).toBe(true);
    expect(await creditBalance(db, google.actor.id)).toBe(30);
  });
  it("supports password reset tokens without weakening the policy", async () => {
    const token = await createPasswordReset(db, a.id);
    await expect(resetPassword(db, token, "weak")).rejects.toMatchObject({
      status: 422,
    });
    await resetPassword(db, token, "ResetPass1");
    expect(
      (await authenticate(db, a.email, "ResetPass1", false)).actor.id,
    ).toBe(a.id);
  });
  it("authenticates the correct password and rejects the wrong password or unknown identity", async () => {
    expect(
      (await authenticate(db, a.email, "ResetPass1", false)).actor.id,
    ).toBe(a.id);
    await expect(
      authenticate(db, a.email, "incorrect password", false),
    ).rejects.toMatchObject({ status: 401, code: "INVALID_CREDENTIALS" });
    await expect(
      authenticate(db, "missing@example.test", "incorrect password", false),
    ).rejects.toMatchObject({ status: 401, code: "INVALID_CREDENTIALS" });
  });
  it("new accounts have no fabricated sites, financial data, or verification", async () => {
    expect((await loadState(db, b.id)).studio).toEqual({
      workspace: "My workspace",
      derivLinked: false,
      sites: [],
    });
    expect(b.emailVerified).toBe(false);
  });
  it("requires strict safe configuration and rejects account override or unknown executable fields", () => {
    expect(
      loginSchema.safeParse({ email: "bad", password: "short" }).success,
    ).toBe(false);
    expect(
      configSchema.safeParse({ ...config("safe-test"), risk: "removed" })
        .success,
    ).toBe(false);
    expect(
      configSchema.safeParse({
        ...config("safe-test"),
        color: "url(javascript:alert(1))",
      }).success,
    ).toBe(false);
    expect(
      actionSchema.safeParse({
        kind: "settings",
        revision: 0,
        operationId: randomUUID(),
        workspace: "W",
        derivLinked: false,
        account_id: a.id,
      }).success,
    ).toBe(false);
  });
  it("saves a private draft and denies reads/edits from another account or missing RLS scope", async () => {
    const saved = await action(a, {
      kind: "save",
      config: config("private-draft"),
      publish: false,
    });
    const site = saved.studio.sites[0];
    expect(await publishedConfig(db, "private-draft")).toBeNull();
    expect((await loadState(db, b.id)).studio.sites).toHaveLength(0);
    expect(await db.selectFrom("sites").selectAll().execute()).toEqual([]);
    await expect(
      action(b, {
        kind: "save",
        id: site.id,
        config: config("stolen-draft"),
        publish: false,
      }),
    ).rejects.toMatchObject({ status: 404 });
    expect(
      await scope(db, b.id, (tx) =>
        tx
          .selectFrom("sites")
          .selectAll()
          .where("account_id", "=", a.id)
          .execute(),
      ),
    ).toEqual([]);
  });
  it("enforces globally unique names and rolls back all parts of a rejected save", async () => {
    const revision = (await loadState(db, b.id)).revision;
    await expect(
      action(b, {
        kind: "save",
        config: config("private-draft"),
        publish: true,
      }),
    ).rejects.toMatchObject({ status: 409, code: "SLUG_TAKEN" });
    expect((await loadState(db, b.id)).revision).toBe(revision);
    expect((await loadState(db, b.id)).studio.sites).toHaveLength(0);
  });
  it("publishes immutable snapshots, keeps changed drafts private, and restores by appending a version", async () => {
    let state = await loadState(db, a.id);
    const site = state.studio.sites[0];
    state = await action(a, { kind: "publish", id: site.id });
    expect((await publishedConfig(db, "private-draft"))?.headline).toBe(
      defaultConfig.headline,
    );
    state = await action(a, {
      kind: "save",
      id: site.id,
      config: { ...site.draft, headline: "A private next chapter" },
      publish: false,
    });
    expect((await publishedConfig(db, "private-draft"))?.headline).toBe(
      defaultConfig.headline,
    );
    state = await action(a, { kind: "publish", id: site.id });
    expect((await publishedConfig(db, "private-draft"))?.headline).toBe(
      "A private next chapter",
    );
    state = await action(a, { kind: "restore", id: site.id, number: 1 });
    const versions = state.studio.sites[0].versions;
    expect(versions).toHaveLength(3);
    expect(versions[2].restoredFrom).toBe(1);
    expect(versions[1].config.headline).toBe("A private next chapter");
    expect((await publishedConfig(db, "private-draft"))?.headline).toBe(
      defaultConfig.headline,
    );
    await expect(
      scope(db, a.id, (tx) =>
        tx
          .updateTable("versions")
          .set({ number: 99 })
          .where("site_id", "=", site.id)
          .execute(),
      ),
    ).rejects.toMatchObject({ code: "23514" });
  });
  it("serves only active custom host mappings", async () => {
    const state = await loadState(db, a.id);
    const site = state.studio.sites[0];
    await action(a, { kind: "publish", id: site.id });
    await expect(
      scope(db, a.id, (tx) =>
        tx
          .insertInto("host_mappings")
          .values({
            hostname: "Custom.Example",
            account_id: a.id,
            site_id: site.id,
            status: "active",
          })
          .execute(),
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await scope(db, a.id, (tx) =>
      tx
        .insertInto("host_mappings")
        .values({
          hostname: "custom.example.test",
          account_id: a.id,
          site_id: site.id,
          status: "pending",
        })
        .onConflict((oc) => oc.column("hostname").doNothing())
        .execute(),
    );
    expect(await publishedConfigByHost(db, "custom.example.test")).toBeNull();
    await expect(
      scope(db, b.id, (tx) =>
        tx
          .insertInto("host_mappings")
          .values({
            hostname: "other.example.test",
            account_id: a.id,
            site_id: site.id,
            status: "active",
          })
          .execute(),
      ),
    ).rejects.toMatchObject({ code: "42501" });
    await scope(db, a.id, (tx) =>
      tx
        .updateTable("host_mappings")
        .set({ status: "active" })
        .where("hostname", "=", "custom.example.test")
        .execute(),
    );
    expect((await publishedConfigByHost(db, "custom.example.test"))?.name).toBe(
      site.draft.name,
    );
    await scope(db, a.id, (tx) =>
      tx
        .updateTable("host_mappings")
        .set({ status: "suspended" })
        .where("hostname", "=", "custom.example.test")
        .execute(),
    );
    expect(await publishedConfigByHost(db, "custom.example.test")).toBeNull();
  });
  it("rejects stale concurrent writes and accepts identical idempotent retries without duplicate versions", async () => {
    const before = await loadState(db, a.id);
    const id = before.studio.sites[0].id;
    const publish = actionSchema.parse({
      kind: "publish",
      id,
      revision: before.revision,
      operationId: randomUUID(),
    });
    const [one, two] = await Promise.all([
      applyAction(db, a.id, publish),
      applyAction(db, a.id, publish),
    ]);
    expect(one.revision).toBe(two.revision);
    expect(one.studio.sites[0].versions.length).toBe(
      before.studio.sites[0].versions.length + 1,
    );
    await expect(
      applyAction(
        db,
        a.id,
        actionSchema.parse({ ...publish, operationId: randomUUID() }),
      ),
    ).rejects.toMatchObject({ status: 409, code: "STALE_WORKSPACE" });
    await expect(
      applyAction(
        db,
        a.id,
        actionSchema.parse({ ...publish, kind: "archive" }),
      ),
    ).rejects.toMatchObject({ status: 409, code: "OPERATION_CONFLICT" });
  });
  it("refuses a reserved slug on the server, not only in browser validation", async () => {
    await expect(
      action(b, { kind: "save", config: config("admin"), publish: false }),
    ).rejects.toMatchObject({ status: 422, code: "VALIDATION" });
    expect(() =>
      actionSchema.parse({
        kind: "save",
        config: config("a--b"),
        publish: false,
        revision: 0,
        operationId: randomUUID(),
      }),
    ).toThrow();
  });
  it("enforces the slug format at the database boundary", async () => {
    const state = await loadState(db, a.id);
    const site = state.studio.sites[0];
    await expect(
      scope(db, a.id, (tx) =>
        tx
          .insertInto("subdomains")
          .values({ slug: "a--b", account_id: a.id, site_id: site.id })
          .execute(),
      ),
    ).rejects.toMatchObject({ code: "23514" });
  });
  it("archives a site, removes public access, and preserves immutable history privately", async () => {
    const before = await loadState(db, a.id);
    const site = before.studio.sites[0];
    await action(a, { kind: "archive", id: site.id });
    expect((await loadState(db, a.id)).studio.sites).toHaveLength(0);
    expect(await publishedConfig(db, "private-draft")).toBeNull();
    expect(
      (
        await scope(db, a.id, (tx) =>
          tx
            .selectFrom("versions")
            .selectAll()
            .where("site_id", "=", site.id)
            .execute(),
        )
      ).length,
    ).toBeGreaterThan(0);
    await expect(
      action(a, { kind: "publish", id: site.id }),
    ).rejects.toMatchObject({ status: 404 });
  });
  it("persists mock settings and invalidates a signed-out session", async () => {
    const updated = await action(b, {
      kind: "settings",
      workspace: "Account B workspace",
      derivLinked: true,
    });
    expect(updated.studio).toMatchObject({
      workspace: "Account B workspace",
      derivLinked: true,
    });
    await logout(db, token);
    expect(await sessionActor(db, token)).toBeNull();
  });
  it("enforces active-site and version limits without partial writes", async () => {
    await action(b, {
      kind: "save",
      config: config("limit-site-0"),
      publish: true,
    });
    const before = await loadState(db, b.id);
    await expect(
      action(b, {
        kind: "save",
        config: config("sixth-active-site"),
        publish: false,
      }),
    ).rejects.toMatchObject({ status: 422, code: "LIMIT_REACHED" });
    expect((await loadState(db, b.id)).revision).toBe(before.revision);
    const site = before.studio.sites[0];
    await scope(db, b.id, async (tx) => {
      await tx
        .insertInto("versions")
        .values({
          account_id: b.id,
          site_id: site.id,
          id: randomUUID(),
          number: 50,
          config: site.draft,
          restored_from: null,
        })
        .execute();
      await tx
        .updateTable("sites")
        .set({ published_version: 50 })
        .where("account_id", "=", b.id)
        .where("id", "=", site.id)
        .execute();
    });
    await expect(
      action(b, { kind: "publish", id: site.id }),
    ).rejects.toMatchObject({ status: 422, code: "LIMIT_REACHED" });
  });
  it("keeps at most five sessions even when sign-ins arrive concurrently", async () => {
    const email = "session-cap@example.test",
      password = "UniquePass1";
    const created = await authenticate(db, email, password, true, {
      fullName: "Session Cap",
    });
    await Promise.all(
      Array.from({ length: 6 }, () => authenticate(db, email, password, false)),
    );
    expect(
      await db
        .selectFrom("sessions")
        .select("token_hash")
        .where("account_id", "=", created.actor.id)
        .execute(),
    ).toHaveLength(5);
  });
  it("uses a persistent bounded rate limiter rather than trusting forwarded IP headers", async () => {
    await rateLimit(db, "unit-test-rate-limit", 2, 60);
    await rateLimit(db, "unit-test-rate-limit", 2, 60);
    await expect(
      rateLimit(db, "unit-test-rate-limit", 2, 60),
    ).rejects.toMatchObject({ status: 429 });
  });
});
