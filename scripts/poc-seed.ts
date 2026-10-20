import { createPocDb, seedPoc } from "../lib/server/poc-db";
import {
  requirePoc,
  PocConfigurationError,
  safeDiagnosticError,
} from "../lib/server/poc-config";
async function main() {
  requirePoc();
  if (!process.argv.includes("--apply"))
    throw new PocConfigurationError(
      "Seed requires the explicit --apply flag after approval.",
    );
  const db = createPocDb();
  try {
    await seedPoc(db);
    console.log(
      "Three mock tenant snapshots seeded; allowlisted host mappings recorded. No DNS or SSL changes were made.",
    );
  } finally {
    await db.destroy();
  }
}
main().catch((error) => {
  console.error(safeDiagnosticError(error));
  process.exitCode = 1;
});
