import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { statfs } from "node:fs/promises";
import { sql } from "kysely";
import {
  createPocDb,
  assertSafeDatabaseRole,
  withAccount,
  loadPublishedTenant,
} from "../lib/server/poc-db";
import {
  requirePoc,
  PocConfigurationError,
  getPocHosts,
  tenantAccounts,
  safeDiagnosticError,
} from "../lib/server/poc-config";
import { PocStorage, MAX_PROBE_BYTES } from "../lib/server/poc-storage";

async function main() {
  requirePoc();
  if (!process.argv.includes("--probe"))
    throw new PocConfigurationError(
      "Temporary database/file probes require an explicit --probe flag.",
    );
  const db = createPocDb();
  try {
    await assertSafeDatabaseRole(db);
    const version = await sql<{
      server_version: string;
    }>`SHOW server_version`.execute(db);
    console.log(
      JSON.stringify({
        check: "postgres-connect",
        status: "passed",
        version: version.rows[0]?.server_version,
      }),
    );
    const [a, b] = [tenantAccounts.aurora, tenantAccounts.nova];
    const visible = await withAccount(db, a, (trx) =>
      trx.selectFrom("sites").selectAll().execute(),
    );
    assert(visible.length > 0 && visible.every((row) => row.account_id === a));
    assert.equal(
      (
        await withAccount(db, a, (trx) =>
          trx
            .selectFrom("sites")
            .selectAll()
            .where("account_id", "=", b)
            .execute(),
        )
      ).length,
      0,
    );
    assert.equal(
      (await db.selectFrom("sites").selectAll().execute()).length,
      0,
      "RLS must deny missing account scope",
    );
    let writeDenied = false;
    try {
      await withAccount(db, a, async (trx) => {
        await trx
          .updateTable("sites")
          .set({ account_id: b })
          .where("account_id", "=", a)
          .execute();
        throw new Error("Unexpected cross-account write allowed; rolled back.");
      });
    } catch (error) {
      writeDenied =
        !!error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "42501";
    }
    assert(
      writeDenied,
      "Cross-account write must be rejected by PostgreSQL RLS",
    );
    console.log(
      JSON.stringify({ check: "database-tenant-isolation", status: "passed" }),
    );
    const sessionId = randomUUID();
    const rollback = new Error("intentional probe rollback");
    try {
      await withAccount(db, a, async (trx) => {
        await trx
          .insertInto("sessions")
          .values({
            id: sessionId,
            account_id: a,
            expires_at: new Date(Date.now() + 60000),
          })
          .execute();
        const session = await trx
          .selectFrom("sessions")
          .innerJoin("accounts", "accounts.id", "sessions.account_id")
          .select("sessions.id")
          .where("sessions.id", "=", sessionId)
          .where("sessions.expires_at", ">", new Date())
          .executeTakeFirst();
        assert(session);
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
    const session = await withAccount(db, a, (trx) =>
      trx
        .selectFrom("sessions")
        .select("id")
        .where("id", "=", sessionId)
        .executeTakeFirst(),
    );
    assert.equal(session, undefined);
    console.log(
      JSON.stringify({
        check: "session-query-and-transaction-rollback",
        status: "passed",
        authenticationImplemented: false,
      }),
    );
    for (const [hostname, slug] of Object.entries(getPocHosts())) {
      const config = await loadPublishedTenant(db, hostname, slug);
      assert(config, "Seeded published tenant must resolve");
    }
    console.log(
      JSON.stringify({
        check: "published-host-mappings",
        status: "passed",
        dnsAndSslVerified: false,
      }),
    );
    if (!process.env.STORAGE_ROOT)
      throw new PocConfigurationError("STORAGE_ROOT required.");
    const store = new PocStorage(process.env.STORAGE_ROOT);
    const filename = `${randomUUID()}.txt`;
    let created = false;
    try {
      await store.writeProbe(
        a,
        filename,
        Buffer.from("Tradeintra staging isolation probe"),
      );
      created = true;
      assert.equal(
        (await store.readProbe(a, filename)).toString(),
        "Tradeintra staging isolation probe",
      );
      await assert.rejects(() => store.readProbe(b, filename), {
        code: "ENOENT",
      });
      await assert.rejects(() =>
        store.writeProbe(
          a,
          `${randomUUID()}.txt`,
          Buffer.alloc(MAX_PROBE_BYTES + 1),
        ),
      );
    } finally {
      if (created) await store.deleteProbe(a, filename);
    }
    const disk = await statfs(process.env.STORAGE_ROOT);
    console.log(
      JSON.stringify({
        check: "private-file-isolation-and-size-limit",
        status: "passed",
        freeBytes: disk.bavail * disk.bsize,
        freeInodes: disk.ffree,
      }),
    );
    const latest = await db
      .selectFrom("jobs")
      .select(["status", "completed_at"])
      .where("status", "=", "completed")
      .orderBy("id", "desc")
      .executeTakeFirst();
    console.log(
      JSON.stringify({
        check: "cron-evidence",
        status: latest ? "completion-record-found" : "pending",
        note: "A completed row alone does not verify the cPanel cron scheduler.",
      }),
    );
    console.log(
      JSON.stringify({
        runtime: process.version,
        memory: process.memoryUsage(),
        note: "Point-in-time process measurements are not shared-host resource limits.",
      }),
    );
  } finally {
    await db.destroy();
  }
}
main().catch((error) => {
  console.error(safeDiagnosticError(error));
  process.exitCode = 1;
});
