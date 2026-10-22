import { sql } from "kysely";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers });

export async function GET() {
  const checks: Record<string, string> = {};
  let ok = true;
  const mode = studioMode();
  checks.accountMode = mode;
  if (mode === "disabled") {
    checks.database = "not_configured";
    checks.storage = process.env.STORAGE_ROOT ? "configured" : "not_configured";
    return json({ service: "tradeintra", status: "degraded", checks });
  }
  try {
    const db = await getStudioDb();
    await sql`SELECT 1`.execute(db);
    checks.database = "ok";
    const tables = await sql<{ name: string | null }>`
      SELECT to_regclass('tradeintra_studio.sites')::text AS name
    `.execute(db);
    checks.schema = tables.rows[0]?.name ? "ok" : "missing";
    if (!tables.rows[0]?.name) ok = false;
    const rls = await sql<{ count: number }>`
      SELECT count(*)::int AS count
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'tradeintra_studio' AND c.relrowsecurity = true
    `.execute(db);
    checks.rlsTables = Number(rls.rows[0]?.count ?? 0) > 0 ? "ok" : "missing";
    if (!rls.rows[0] || Number(rls.rows[0].count) === 0) ok = false;
  } catch {
    checks.database = "failed";
    ok = false;
  }
  try {
    const root = process.env.STORAGE_ROOT;
    if (!root) checks.storage = "not_configured";
    else {
      await access(root, constants.R_OK | constants.W_OK);
      checks.storage = "ok";
    }
  } catch {
    checks.storage = "failed";
    ok = false;
  }
  return json(
    {
      service: "tradeintra",
      status: ok ? "ready" : "degraded",
      checks,
    },
    ok ? 200 : 503,
  );
}
