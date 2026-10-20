import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { Kysely, PostgresDialect, sql } from "kysely";
import type { Pool } from "pg";
import {
  assertSafeDatabaseRole,
  loadPublishedTenant,
  seedPoc,
  withAccount,
  runPocCron,
  type PocDatabase,
  type PocDb,
} from "../lib/server/poc-db";
import { tenantAccounts } from "../lib/server/poc-config";

// PostgreSQL-in-WASM exercises SQL semantics locally, not pg/network or PG 10 compatibility.
let engine: PGlite;
let db: PocDb;
const hosts = {
  "aurora.staging.example.test": "aurora",
  "nova.staging.example.test": "nova",
  "orbit.staging.example.test": "orbit",
  "custom.example.test": "aurora",
};
beforeAll(async () => {
  process.env.POC_ENABLED = "true";
  process.env.POC_HOSTS = JSON.stringify(hosts);
  engine = new PGlite();
  await engine.waitReady;
  await engine.exec(
    "CREATE ROLE poc_app NOSUPERUSER NOBYPASSRLS; GRANT CREATE ON DATABASE postgres TO poc_app; CREATE SCHEMA tradeintra_poc AUTHORIZATION poc_app; SET ROLE poc_app;",
  );
  await engine.exec(
    await readFile(new URL("../database/001-poc.sql", import.meta.url), "utf8"),
  );
  const client = {
    query: async (text: string, parameters: unknown[]) => {
      const result = await engine.query(text, parameters);
      return {
        rows: result.rows,
        rowCount: result.affectedRows,
        command: text.split(" ")[0].toUpperCase(),
      };
    },
    release: () => {},
  };
  const pool = {
    connect: async () => client,
    end: async () => {},
  } as unknown as Pool;
  db = new Kysely<PocDatabase>({
    dialect: new PostgresDialect({ pool }),
  }).withSchema("tradeintra_poc");
  await seedPoc(db);
}, 30000);
afterAll(async () => {
  await db?.destroy();
  await engine?.close();
  delete process.env.POC_ENABLED;
  delete process.env.POC_HOSTS;
});
describe("staging SQL and account boundaries (PGlite, not a host certification)", () => {
  it("migration and seeding are repeatable without mutating published snapshots", async () => {
    await engine.exec(
      await readFile(
        new URL("../database/001-poc.sql", import.meta.url),
        "utf8",
      ),
    );
    await seedPoc(db);
    expect(
      await db.selectFrom("host_mappings").selectAll().execute(),
    ).toHaveLength(4);
    expect(
      await loadPublishedTenant(db, "custom.example.test", "aurora"),
    ).toMatchObject({ name: "Aurora Markets" });
  });
  it("accepts a least-privilege role and rejects superuser/BYPASSRLS", async () => {
    await expect(assertSafeDatabaseRole(db)).resolves.toBeUndefined();
    await engine.exec("RESET ROLE");
    try {
      await expect(assertSafeDatabaseRole(db)).rejects.toThrow("non-superuser");
    } finally {
      await engine.exec("SET ROLE poc_app");
    }
  });
  it("denies missing scope and isolates both accounts despite shared pooling", async () => {
    expect(await db.selectFrom("sites").selectAll().execute()).toEqual([]);
    const a = await withAccount(db, tenantAccounts.aurora, (trx) =>
      trx.selectFrom("sites").selectAll().execute(),
    );
    const b = await withAccount(db, tenantAccounts.nova, (trx) =>
      trx.selectFrom("sites").selectAll().execute(),
    );
    expect(a).toHaveLength(1);
    expect(a[0].slug).toBe("aurora");
    expect(b).toHaveLength(1);
    expect(b[0].slug).toBe("nova");
    expect(await db.selectFrom("sites").selectAll().execute()).toEqual([]);
    expect(
      await withAccount(db, tenantAccounts.aurora, (trx) =>
        trx
          .selectFrom("sites")
          .selectAll()
          .where("account_id", "=", tenantAccounts.nova)
          .execute(),
      ),
    ).toEqual([]);
  });
  it("rejects cross-account inserts and reassignment via PostgreSQL WITH CHECK", async () => {
    await expect(
      withAccount(db, tenantAccounts.aurora, (trx) =>
        trx
          .insertInto("accounts")
          .values({
            id: "10000000-0000-4000-8000-000000000099",
            name: "forbidden",
          })
          .execute(),
      ),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      withAccount(db, tenantAccounts.aurora, (trx) =>
        trx
          .updateTable("sites")
          .set({ account_id: tenantAccounts.nova })
          .where("slug", "=", "aurora")
          .execute(),
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("loads only the published snapshot, never a changed draft or another hostname", async () => {
    const original = await loadPublishedTenant(
      db,
      "aurora.staging.example.test",
      "aurora",
    );
    expect(original?.name).toBe("Aurora Markets");
    await withAccount(db, tenantAccounts.aurora, (trx) =>
      trx
        .updateTable("sites")
        .set({ draft: { ...original!, name: "Private unfinished draft" } })
        .where("slug", "=", "aurora")
        .execute(),
    );
    expect(
      (await loadPublishedTenant(db, "aurora.staging.example.test", "aurora"))
        ?.name,
    ).toBe("Aurora Markets");
    expect(
      await loadPublishedTenant(db, "aurora.staging.example.test", "nova"),
    ).toBeNull();
    expect(
      await loadPublishedTenant(db, "unknown.example.test", "aurora"),
    ).toBeNull();
  });
  it("refuses modification or deletion of an existing published version", async () => {
    await expect(
      withAccount(db, tenantAccounts.aurora, (trx) =>
        trx
          .updateTable("versions")
          .set({ version: 2 })
          .where("slug", "=", "aurora")
          .execute(),
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      withAccount(db, tenantAccounts.aurora, (trx) =>
        trx.deleteFrom("versions").where("slug", "=", "aurora").execute(),
      ),
    ).rejects.toMatchObject({ code: "23514" });
  });
  it("supports a scoped session/account query and rolls it back without persistent data", async () => {
    const id = "20000000-0000-4000-8000-000000000001";
    const rollback = new Error("rollback");
    await expect(
      withAccount(db, tenantAccounts.aurora, async (trx) => {
        await trx
          .insertInto("sessions")
          .values({
            id,
            account_id: tenantAccounts.aurora,
            expires_at: new Date(Date.now() + 60000),
          })
          .execute();
        const result = await trx
          .selectFrom("sessions")
          .innerJoin("accounts", "accounts.id", "sessions.account_id")
          .select("sessions.id")
          .where("sessions.id", "=", id)
          .where("sessions.expires_at", ">", new Date())
          .execute();
        expect(result).toHaveLength(1);
        throw rollback;
      }),
    ).rejects.toBe(rollback);
    expect(
      await withAccount(db, tenantAccounts.aurora, (trx) =>
        trx.selectFrom("sessions").selectAll().execute(),
      ),
    ).toEqual([]);
  });
  it("processes a bounded diagnostic job exactly once and returns idle on the next tick", async () => {
    await db
      .insertInto("jobs")
      .values({ type: "poc-tick", status: "pending" })
      .execute();
    expect(await runPocCron(db)).toEqual({ status: "completed", processed: 1 });
    expect(await runPocCron(db)).toEqual({ status: "idle", processed: 0 });
    expect((await db.selectFrom("jobs").selectAll().execute())[0].status).toBe(
      "completed",
    );
  });
  it("SQL statements remain parameterized for account scope", async () => {
    const compiled =
      sql`SELECT set_config('tradeintra.account_id', ${tenantAccounts.aurora}, true)`.compile(
        db,
      );
    expect(compiled.sql).toContain("$1");
    expect(compiled.sql).not.toContain(tenantAccounts.aurora);
  });
});
