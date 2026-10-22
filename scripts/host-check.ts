import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { sql } from "kysely";
import { getStudioDb, studioMode } from "../lib/server/studio/database";
import { domainMode } from "../lib/server/providers/domain";
import { emailMode } from "../lib/server/providers/email";
import { paymentMode } from "../lib/server/providers/payments";
import { scanMode } from "../lib/server/providers/malware";
import { telegramMode } from "../lib/server/providers/telegram";
import { aiMode } from "../lib/server/providers/ai";

async function main() {
  const report: Record<string, unknown> = {
    node: process.version,
    nodeOk: Number(process.versions.node.split(".")[0]) >= 22,
    accountMode: studioMode(),
    providers: {
      ai: aiMode(),
      email: emailMode(),
      domains: domainMode(),
      payments: paymentMode(),
      telegram: telegramMode(),
      scan: scanMode(),
    },
    environment: {
      appUrl: Boolean(process.env.APP_URL),
      databaseUrl: Boolean(process.env.DATABASE_URL),
      storageRoot: Boolean(process.env.STORAGE_ROOT),
      cronSecret: Boolean(process.env.CRON_SECRET),
      superAdminAllowlist: Boolean(process.env.SUPER_ADMIN_EMAILS),
      tokenEncryptionKey: Boolean(process.env.TOKEN_ENCRYPTION_KEY),
    },
  };
  try {
    const db = await getStudioDb();
    await sql`SELECT 1`.execute(db);
    const schema = await sql<{ sites: string | null; rls: number }>`
      SELECT to_regclass('tradeintra_studio.sites')::text AS sites,
        (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
         WHERE n.nspname='tradeintra_studio' AND c.relrowsecurity=true) AS rls
    `.execute(db);
    report.database = "ok";
    report.schema = schema.rows[0]?.sites ? "ok" : "missing";
    report.rlsTables = Number(schema.rows[0]?.rls ?? 0);
    await db.destroy();
  } catch {
    report.database = "failed";
  }
  try {
    const root = process.env.STORAGE_ROOT;
    if (!root) report.storage = "not_configured";
    else {
      await access(root, constants.R_OK | constants.W_OK);
      report.storage = "ok";
    }
  } catch {
    report.storage = "failed";
  }
  console.log(JSON.stringify(report, null, 2));
}
main().catch(() => {
  console.error("Host check failed; private details omitted.");
  process.exitCode = 1;
});
