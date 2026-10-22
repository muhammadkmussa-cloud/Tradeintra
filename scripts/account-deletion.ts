import { getStudioDb } from "../lib/server/studio/database";
import { executeDueDeletions } from "../lib/server/account";

const db = await getStudioDb();
try {
  const result = await executeDueDeletions(db);
  console.log(`Account deletion sweep complete: ${result.deleted} deleted.`);
} finally {
  await db.destroy();
}
