import { readFile } from "node:fs/promises";
import { sql } from "kysely";
import { createPocDb, assertSafeDatabaseRole } from "../lib/server/poc-db";
import {
  requirePoc,
  PocConfigurationError,
  safeDiagnosticError,
} from "../lib/server/poc-config";
async function main() {
  requirePoc();
  if (!process.argv.includes("--apply"))
    throw new PocConfigurationError(
      "Migration requires the explicit --apply flag after approval.",
    );
  const db = createPocDb();
  try {
    await assertSafeDatabaseRole(db);
    const migration = await readFile(
      new URL("../database/001-poc.sql", import.meta.url),
      "utf8",
    );
    await db.transaction().execute(async (trx) => {
      await sql.raw(migration).execute(trx);
    });
    console.log(
      "Staging POC schema applied. No production tables or provider resources were changed.",
    );
  } finally {
    await db.destroy();
  }
}
main().catch((error) => {
  console.error(safeDiagnosticError(error));
  process.exitCode = 1;
});
