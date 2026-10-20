import { Kysely, PostgresDialect, sql } from "kysely";
import { Pool } from "pg";
import { readFile, mkdir, chmod, lstat, realpath } from "node:fs/promises";
import path from "node:path";
import { homedir } from "node:os";
import type { StudioDatabase, StudioDb, StudioTrx } from "./types";
import { assertMockOnly } from "../poc-config";

export function studioMode(): "local" | "postgres" | "disabled" {
  assertMockOnly();
  const mode =
    process.env.STUDIO_DB_MODE ||
    (process.env.NODE_ENV === "development" ? "local" : "disabled");
  if (mode === "local") {
    if (
      process.env.NODE_ENV !== "development" &&
      process.env.STUDIO_ENV !== "local"
    )
      throw new Error(
        "Local database requires development or explicit STUDIO_ENV=local.",
      );
    return mode;
  }
  if (mode === "postgres") {
    if (
      process.env.STUDIO_ENABLED !== "true" ||
      process.env.STUDIO_ENV !== "staging" ||
      !process.env.APP_URL ||
      !process.env.DATABASE_URL
    )
      throw new Error(
        "Server studio requires explicitly configured staging variables.",
      );
    const origin = new URL(process.env.APP_URL);
    if (
      origin.protocol !== "https:" ||
      origin.username ||
      origin.password ||
      origin.pathname !== "/" ||
      origin.search ||
      origin.hash
    )
      throw new Error("Staging APP_URL must be a root HTTPS origin.");
    return mode;
  }
  return "disabled";
}
const globals = globalThis as unknown as {
  tradeintraStudioDb?: Promise<StudioDb>;
};
export async function assertRole(db: StudioDb) {
  const result = await sql<{
    rolsuper: boolean;
    rolbypassrls: boolean;
  }>`SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user`.execute(
    db,
  );
  if (!result.rows[0] || result.rows[0].rolsuper || result.rows[0].rolbypassrls)
    throw new Error("Unsafe application database role.");
}
export async function scope<T>(
  db: StudioDb,
  account: string,
  work: (tx: StudioTrx) => Promise<T>,
) {
  return db.transaction().execute(async (tx) => {
    await sql`SELECT set_config('tradeintra.account_id',${account},true)`.execute(
      tx,
    );
    return work(tx);
  });
}
export async function getStudioDb(): Promise<StudioDb> {
  if (studioMode() === "disabled") throw new Error("Server studio disabled.");
  return (globals.tradeintraStudioDb ??= createDatabase().catch((error) => {
    delete globals.tradeintraStudioDb;
    throw error;
  }));
}
async function createDatabase(): Promise<StudioDb> {
  if (studioMode() === "local") {
    // No network dependency or silent PostgreSQL fallback. Development-only engine.
    const { PGlite } = await import("@electric-sql/pglite");
    const requestedDirectory =
      process.env.STUDIO_DATA_DIR ||
      path.join(homedir(), ".local", "share", "tradeintra-studio");
    // This private runtime directory must never be bundled or traced into a release.
    const directory = path.resolve(
      /* turbopackIgnore: true */ requestedDirectory,
    );
    const relative = path.relative(process.cwd(), directory);
    if (
      !path.isAbsolute(requestedDirectory) ||
      directory === path.parse(directory).root ||
      !relative ||
      (!relative.startsWith(`..${path.sep}`) && relative !== "..") ||
      directory.split(path.sep).includes("public_html") ||
      directory.startsWith(path.join(process.cwd(), "public"))
    )
      throw new Error("Use a private absolute local data directory.");
    await mkdir(/* turbopackIgnore: true */ directory, {
      recursive: true,
      mode: 0o700,
    });
    const directoryInfo = await lstat(/* turbopackIgnore: true */ directory);
    if (
      !directoryInfo.isDirectory() ||
      directoryInfo.isSymbolicLink() ||
      (await realpath(/* turbopackIgnore: true */ directory)) !== directory
    )
      throw new Error(
        "Use a real private local database directory, not a symlink.",
      );
    await chmod(/* turbopackIgnore: true */ directory, 0o700);
    const engine = new PGlite(directory);
    await engine.waitReady;
    // Startup migration is restricted to this explicit private LOCAL development engine.
    await engine.exec(
      `DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='studio_app') THEN CREATE ROLE studio_app NOSUPERUSER NOBYPASSRLS; END IF; END $$; GRANT CREATE ON DATABASE postgres TO studio_app; SET ROLE studio_app;`,
    );
    await engine.exec(
      await readFile(
        path.join(process.cwd(), "database", "002-studio.sql"),
        "utf8",
      ),
    );
    // PGlite has a single session. Hold a FIFO connection lease across each transaction.
    let queue: Promise<void> = Promise.resolve();
    const pool = {
      connect: async () => {
        const previous = queue;
        let release!: () => void;
        queue = new Promise<void>((resolve) => {
          release = resolve;
        });
        await previous;
        return {
          query: async (text: string, parameters: unknown[]) => {
            const result = await engine.query(text, parameters);
            return {
              rows: result.rows,
              rowCount: result.affectedRows,
              command: text.split(" ")[0].toUpperCase(),
            };
          },
          release,
        };
      },
      end: async () => {
        await queue;
        await engine.close();
      },
    } as unknown as Pool;
    const db = new Kysely<StudioDatabase>({
      dialect: new PostgresDialect({ pool }),
    }).withSchema("tradeintra_studio");
    await assertRole(db);
    return db;
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    statement_timeout: 10000,
    query_timeout: 12000,
  });
  pool.on("error", () =>
    console.error("Studio database connection unavailable; details omitted."),
  );
  const db = new Kysely<StudioDatabase>({
    dialect: new PostgresDialect({ pool }),
  }).withSchema("tradeintra_studio");
  try {
    await assertRole(db);
    return db;
  } catch (error) {
    await db.destroy();
    throw error;
  }
}
