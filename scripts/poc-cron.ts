import {
  createPocDb,
  assertSafeDatabaseRole,
  runPocCron,
} from "../lib/server/poc-db";
import {
  requirePoc,
  PocConfigurationError,
  safeDiagnosticError,
} from "../lib/server/poc-config";
async function main() {
  requirePoc();
  const db = createPocDb();
  try {
    await assertSafeDatabaseRole(db);
    if (process.argv.includes("--enqueue")) {
      if (!process.argv.includes("--apply"))
        throw new PocConfigurationError("Enqueue requires --apply.");
      await db
        .insertInto("jobs")
        .values({ type: "poc-tick", status: "pending" })
        .execute();
      console.log(
        "One staging diagnostic job enqueued. No provider operation will run.",
      );
    } else {
      console.log(JSON.stringify(await runPocCron(db)));
    }
  } finally {
    await db.destroy();
  }
}
main().catch((error) => {
  console.error(safeDiagnosticError(error));
  process.exitCode = 1;
});
