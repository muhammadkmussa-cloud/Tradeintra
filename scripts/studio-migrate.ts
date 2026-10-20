import { readFile } from "node:fs/promises";
import { sql } from "kysely";
import { getStudioDb, studioMode } from "../lib/server/studio/database";
async function main() {
  if (!process.argv.includes("--apply") || studioMode() !== "postgres")
    throw new Error(
      "Explicit --apply and an owner-approved staging PostgreSQL configuration are required.",
    );
  const db = await getStudioDb();
  try {
    const migration = await readFile(
      new URL("../database/002-studio.sql", import.meta.url),
      "utf8",
    );
    await db.transaction().execute((tx) => sql.raw(migration).execute(tx));
    console.log(
      "Dedicated staging studio schema applied. No provider resources changed.",
    );
  } finally {
    await db.destroy();
  }
}
main().catch(() => {
  console.error(
    "Studio schema setup refused or failed. Check the staging runbook; private error details are not logged.",
  );
  process.exitCode = 1;
});
