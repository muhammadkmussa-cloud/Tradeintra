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
        "016-upload-scan.sql",
        "017-domain-contacts.sql",
        "018-bots.sql",
        "019-support-announcements-account.sql",
        "020-support-indexes.sql",
        "021-signal-subscriptions.sql",
        "022-signal-service-policy.sql",
        "023-account-deletion-service.sql",
        "024-signal-checkout-attempts.sql",
        "025-purge-service-policies.sql",
        "026-marketplace-downloads.sql",
        "027-purge-storage-policies.sql",
        "028-domain-verification.sql",
        "029-domain-transfers.sql",
        "030-mfa.sql",
        "031-audit-admin.sql",
        "032-signal-cron-policy.sql",
        "033-invoices.sql",
        "034-retention-revocation.sql",
      ].map((file) =>
        readFile(new URL(`../database/${file}`, import.meta.url), "utf8"),
      ),
    );
    await db.transaction().execute(async (tx) => {
      await sql
        .raw(
          "CREATE SCHEMA IF NOT EXISTS tradeintra_studio; CREATE TABLE IF NOT EXISTS tradeintra_studio.schema_migrations (filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
        )
        .execute(tx);
      const appliedResult = await sql<{ filename: string }>`
        SELECT filename FROM tradeintra_studio.schema_migrations
      `.execute(tx);
      const applied = new Set(appliedResult.rows.map((row) => row.filename));
      const files = [
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
        "016-upload-scan.sql",
        "017-domain-contacts.sql",
        "018-bots.sql",
        "019-support-announcements-account.sql",
        "020-support-indexes.sql",
        "021-signal-subscriptions.sql",
        "022-signal-service-policy.sql",
        "023-account-deletion-service.sql",
        "024-signal-checkout-attempts.sql",
        "025-purge-service-policies.sql",
        "026-marketplace-downloads.sql",
        "027-purge-storage-policies.sql",
        "028-domain-verification.sql",
        "029-domain-transfers.sql",
        "030-mfa.sql",
        "031-audit-admin.sql",
        "032-signal-cron-policy.sql",
        "033-invoices.sql",
        "034-retention-revocation.sql",
      ];
      for (let i = 0; i < files.length; i += 1) {
        if (applied.has(files[i])) continue;
        await sql.raw(migrations[i]).execute(tx);
        await sql
          .raw(
            `INSERT INTO tradeintra_studio.schema_migrations(filename) VALUES ('${files[i]}') ON CONFLICT DO NOTHING`,
          )
          .execute(tx);
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
