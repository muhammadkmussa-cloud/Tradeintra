import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { getStudioDb } from "../lib/server/studio/database";
import type { StudioDb, Actor } from "../lib/server/studio/types";
import { authenticate, sessionActor } from "../lib/server/studio/auth";

let db: StudioDb;
let directory: string;
let actor: Actor;
let token: string;

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "tradeintra-payments-"));
  process.env.STUDIO_DB_MODE = "local";
  process.env.STUDIO_ENV = "local";
  process.env.STUDIO_DATA_DIR = directory;
  db = await getStudioDb();
  const auth = await authenticate(
    db,
    "payments@example.test",
    "PaymentsPass1",
    true,
    { fullName: "Payments Operator" },
  );
  actor = auth.actor;
  token = auth.token;
}, 30000);

afterAll(async () => {
  delete process.env.SUPER_ADMIN_EMAILS;
  await db?.destroy();
  await rm(directory, { recursive: true, force: true });
  delete process.env.STUDIO_DB_MODE;
  delete process.env.STUDIO_ENV;
  delete process.env.STUDIO_DATA_DIR;
});

describe("payment boundaries", () => {
  it("promotes the allowlisted Super Admin email at session time", async () => {
    process.env.SUPER_ADMIN_EMAILS = "payments@example.test";
    expect((await sessionActor(db, token))?.role).toBe("super_admin");
    delete process.env.SUPER_ADMIN_EMAILS;
    expect((await sessionActor(db, token))?.role).toBe("user");
  });
});
