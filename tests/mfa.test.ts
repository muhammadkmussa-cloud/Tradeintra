import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { getStudioDb } from "../lib/server/studio/database";
import type { StudioDb, Actor } from "../lib/server/studio/types";
import { authenticate } from "../lib/server/studio/auth";
import {
  beginMfaSetup,
  currentTotp,
  disableMfa,
  enableMfa,
  mfaStatus,
} from "../lib/server/mfa";

let db: StudioDb;
let directory: string;
let actor: Actor;
const email = "mfa@example.test";
const password = "MfaPass123";

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "tradeintra-mfa-"));
  process.env.STUDIO_DB_MODE = "local";
  process.env.STUDIO_ENV = "local";
  process.env.STUDIO_DATA_DIR = directory;
  db = await getStudioDb();
  actor = (
    await authenticate(db, email, password, true, { fullName: "MFA User" })
  ).actor;
}, 30000);

afterAll(async () => {
  await db?.destroy();
  await rm(directory, { recursive: true, force: true });
  delete process.env.STUDIO_DB_MODE;
  delete process.env.STUDIO_ENV;
  delete process.env.STUDIO_DATA_DIR;
});

describe("TOTP two-factor authentication", () => {
  it("sets up, enables, requires, and disables TOTP", async () => {
    const setup = await beginMfaSetup(db, actor.id, email);
    expect(setup.secret).toMatch(/^[A-Z2-7]+$/);
    expect(setup.otpauth).toContain("otpauth://totp/");
    const code = currentTotp(setup.secret);
    expect(await enableMfa(db, actor.id, code)).toEqual({ enabled: true });
    expect(await mfaStatus(db, actor.id)).toEqual({ enabled: true });

    await expect(
      authenticate(db, email, password, false),
    ).rejects.toMatchObject({ status: 401, code: "MFA_REQUIRED" });
    await expect(
      authenticate(db, email, password, false, undefined, "000000"),
    ).rejects.toMatchObject({ status: 401, code: "INVALID_MFA" });
    const login = await authenticate(
      db,
      email,
      password,
      false,
      undefined,
      currentTotp(setup.secret),
    );
    expect(login.actor.email).toBe(email);

    await expect(
      disableMfa(db, actor.id, currentTotp(setup.secret)),
    ).resolves.toEqual({ enabled: false });
    expect(await mfaStatus(db, actor.id)).toEqual({ enabled: false });
  });
});
