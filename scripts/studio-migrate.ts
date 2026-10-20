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
    const migrations = await Promise.all(
      [
        "002-studio.sql",
        "003-slug-hardening.sql",
        "005-host-mappings.sql",
        "006-host-mapping-canonical.sql",
        "007-host-mapping-rls.sql",
        "008-identity-growth-site.sql",
        "009-commerce.sql",
        "010-payments.sql",
        "011-email-outbox.sql",
        "012-marketplace-delivery.sql",
        "013-commerce-rls.sql",
        "014-marketplace-storage.sql",
        "015-telegram-and-uploads.sql",
      ].map((file) =>
        readFile(new URL(`../database/${file}`, import.meta.url), "utf8"),
      ),
    );
    await db.transaction().execute(async (tx) => {
      for (const migration of migrations) {
        await sql.raw(migration).execute(tx);
      }
    });
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
