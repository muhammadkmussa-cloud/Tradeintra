import {
  Kysely,
  PostgresDialect,
  sql,
  type Transaction,
  type Generated,
  type ColumnType,
} from "kysely";
import { Pool } from "pg";
import {
  requirePoc,
  getPocHosts,
  tenantAccounts,
  PocConfigurationError,
  type TenantSlug,
} from "./poc-config";
import {
  defaultConfig,
  normalizeConfig,
  validateConfig,
  type Config,
} from "../studio";

export interface PocDatabase {
  accounts: { id: string; name: string };
  sites: {
    account_id: string;
    slug: string;
    draft: Config;
    published_version: number;
  };
  versions: {
    account_id: string;
    slug: string;
    version: number;
    config: Config;
    published_at: Generated<Date>;
  };
  host_mappings: { hostname: string; account_id: string; slug: string };
  sessions: { id: string; account_id: string; expires_at: Date };
  jobs: {
    id: Generated<string>;
    type: "poc-tick";
    status: "pending" | "completed";
    created_at: Generated<Date>;
    completed_at: ColumnType<Date | null, Date | null | undefined, Date | null>;
  };
}
export type PocDb = Kysely<PocDatabase>;
let pool: PocDb | undefined;
export function createPocDb(
  connectionString = process.env.DATABASE_URL,
): PocDb {
  requirePoc();
  if (!connectionString)
    throw new PocConfigurationError(
      "DATABASE_URL is required for the staging POC.",
    );
  const url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("Use a PostgreSQL connection URL.");
  // SSL options come from the connection URL; never disable certificate verification here.
  const pgPool = new Pool({
    connectionString,
    max: 3,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    statement_timeout: 10000,
    query_timeout: 12000,
  });
  pgPool.on("error", () => {
    console.error(
      "An idle staging database connection failed; details omitted.",
    );
  });
  return new Kysely<PocDatabase>({
    dialect: new PostgresDialect({ pool: pgPool }),
  }).withSchema("tradeintra_poc");
}
export function getPocDb() {
  return (pool ??= createPocDb());
}
export async function assertSafeDatabaseRole(db: PocDb) {
  const result = await sql<{
    rolsuper: boolean;
    rolbypassrls: boolean;
  }>`SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`.execute(
    db,
  );
  if (!result.rows[0] || result.rows[0].rolsuper || result.rows[0].rolbypassrls)
    throw new Error(
      "The POC application must use a non-superuser role without BYPASSRLS.",
    );
}
export async function withAccount<T>(
  db: PocDb,
  account: string,
  work: (trx: Transaction<PocDatabase>) => Promise<T>,
): Promise<T> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      account,
    )
  )
    throw new Error("Invalid account identifier.");
  return db.transaction().execute(async (trx) => {
    await sql`SELECT set_config('tradeintra.account_id', ${account}, true)`.execute(
      trx,
    );
    return work(trx);
  });
}
const names: Record<TenantSlug, string> = {
  aurora: "Aurora Markets",
  nova: "Nova Trading",
  orbit: "Orbit Markets",
};
const colors: Record<TenantSlug, string> = {
  aurora: "#B08D57",
  nova: "#2F6B4F",
  orbit: "#FEDD00",
};
export function demoConfig(slug: TenantSlug): Config {
  return {
    ...structuredClone(defaultConfig),
    name: names[slug],
    slug: `${slug}-poc`,
    color: colors[slug],
    headline:
      slug === "aurora"
        ? "Your markets. Your next move."
        : slug === "nova"
          ? "A fresh perspective on the markets."
          : "One studio. Your own orbit.",
    modules:
      slug === "orbit"
        ? ["about"]
        : slug === "nova"
          ? ["markets", "about"]
          : ["markets", "terminal", "about"],
  };
}
export async function seedPoc(db: PocDb) {
  await assertSafeDatabaseRole(db);
  const hosts = getPocHosts();
  // Each account's data is created through an account-scoped transaction.
  for (const slug of ["aurora", "nova", "orbit"] as const) {
    const config = demoConfig(slug);
    const id = tenantAccounts[slug];
    await withAccount(db, id, async (trx) => {
      await trx
        .insertInto("accounts")
        .values({ id, name: config.name })
        .onConflict((oc) => oc.column("id").doNothing())
        .execute();
      await trx
        .insertInto("sites")
        .values({ account_id: id, slug, draft: config, published_version: 1 })
        .onConflict((oc) => oc.columns(["account_id", "slug"]).doNothing())
        .execute();
      await trx
        .insertInto("versions")
        .values({ account_id: id, slug, version: 1, config })
        .onConflict((oc) =>
          oc.columns(["account_id", "slug", "version"]).doNothing(),
        )
        .execute();
    });
  }
  for (const [hostname, slug] of Object.entries(hosts)) {
    // Refuse to reassign an existing host; this requires an explicitly reviewed migration.
    const existing = await db
      .selectFrom("host_mappings")
      .selectAll()
      .where("hostname", "=", hostname)
      .executeTakeFirst();
    if (
      existing &&
      (existing.account_id !== tenantAccounts[slug] || existing.slug !== slug)
    )
      throw new Error(
        "A staging hostname is already assigned to another tenant.",
      );
    await db
      .insertInto("host_mappings")
      .values({ hostname, account_id: tenantAccounts[slug], slug })
      .onConflict((oc) => oc.column("hostname").doNothing())
      .execute();
  }
}
export async function loadPublishedTenant(
  db: PocDb,
  hostname: string,
  slug: TenantSlug,
): Promise<Config | null> {
  // Environment allowlist and persisted mapping must agree. Never trust X-Forwarded-Host.
  if (getPocHosts()[hostname] !== slug) return null;
  await assertSafeDatabaseRole(db);
  const route = await db
    .selectFrom("host_mappings")
    .select(["account_id", "slug"])
    .where("hostname", "=", hostname)
    .executeTakeFirst();
  if (
    !route ||
    route.slug !== slug ||
    route.account_id !== tenantAccounts[slug]
  )
    return null;
  return withAccount(db, route.account_id, async (trx) => {
    const version = await trx
      .selectFrom("versions")
      .innerJoin("sites", (join) =>
        join
          .onRef("sites.account_id", "=", "versions.account_id")
          .onRef("sites.slug", "=", "versions.slug")
          .onRef("sites.published_version", "=", "versions.version"),
      )
      .select("versions.config")
      .where("sites.slug", "=", slug)
      .where("sites.account_id", "=", route.account_id)
      .executeTakeFirst();
    if (!version) return null;
    const config = normalizeConfig(version.config);
    if (
      Object.keys(
        validateConfig(config, [], undefined, {
          allowLegacySlug: true,
        }),
      ).length
    )
      return null;
    return config;
  });
}
export async function runPocCron(db: PocDb) {
  return db.transaction().execute(async (trx) => {
    const lock = await sql<{
      acquired: boolean;
    }>`SELECT pg_try_advisory_xact_lock(hashtext('tradeintra_poc:cron')) AS acquired`.execute(
      trx,
    );
    if (!lock.rows[0]?.acquired)
      return { status: "busy" as const, processed: 0 };
    const job = await trx
      .selectFrom("jobs")
      .select("id")
      .where("type", "=", "poc-tick")
      .where("status", "=", "pending")
      .orderBy("id")
      .forUpdate()
      .skipLocked()
      .limit(1)
      .executeTakeFirst();
    if (!job) return { status: "idle" as const, processed: 0 };
    await trx
      .updateTable("jobs")
      .set({ status: "completed", completed_at: new Date() })
      .where("id", "=", job.id)
      .execute();
    return { status: "completed" as const, processed: 1 };
  });
}
