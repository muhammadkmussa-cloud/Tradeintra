import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getStudioDb, scope } from "../lib/server/studio/database";
import type { StudioDb, Actor } from "../lib/server/studio/types";
import { authenticate } from "../lib/server/studio/auth";
import { defaultConfig } from "../lib/studio";
import {
  beginOAuth,
  completeOAuth,
  publicTraderSession,
  requestOtp,
  revokeTraderSession,
  traderSession,
} from "../lib/server/deriv";

let db: StudioDb;
let directory: string;
let actor: Actor;

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "tradeintra-oauth-"));
  process.env.STUDIO_DB_MODE = "local";
  process.env.STUDIO_ENV = "local";
  process.env.STUDIO_DATA_DIR = directory;
  process.env.DERIV_MODE = "mock";
  db = await getStudioDb();
  actor = (
    await authenticate(db, "oauth@example.test", "OauthPass1", true, {
      fullName: "OAuth Operator",
    })
  ).actor;
  const siteId = randomUUID();
  const config = {
    ...defaultConfig,
    name: "OAuth Site",
    slug: "oauth-site",
    modules: [...defaultConfig.modules],
    moduleContent: structuredClone(defaultConfig.moduleContent),
  };
  await scope(db, actor.id, async (tx) => {
    await tx
      .insertInto("sites")
      .values({
        id: siteId,
        account_id: actor.id,
        draft: config,
        published_version: 1,
        archived: false,
      })
      .execute();
    await tx
      .insertInto("versions")
      .values({
        id: randomUUID(),
        account_id: actor.id,
        site_id: siteId,
        number: 1,
        config,
      })
      .execute();
    await tx
      .insertInto("subdomains")
      .values({
        slug: "oauth-site",
        account_id: actor.id,
        site_id: siteId,
      })
      .execute();
  });
}, 30000);

afterAll(async () => {
  await db?.destroy();
  await rm(directory, { recursive: true, force: true });
  delete process.env.STUDIO_DB_MODE;
  delete process.env.STUDIO_ENV;
  delete process.env.STUDIO_DATA_DIR;
  delete process.env.DERIV_MODE;
});

describe("Deriv OAuth scaffold", () => {
  it("consumes a mock state once and creates a scoped trader session", async () => {
    const url = await beginOAuth(db, "oauth-site", "http://localhost:3200");
    const state = new URL(url).searchParams.get("state")!;
    expect(state).toBeTruthy();
    const result = await completeOAuth(db, "mock-code", state);
    expect(result.site).toBe("oauth-site");
    expect(result.returnPath).toContain("oauth-site");
    const session = await traderSession(db, result.sessionToken);
    expect(publicTraderSession(session)).toMatchObject({
      authenticated: true,
      site: "oauth-site",
      mode: "mock",
      account: { login: "VRTC-MOCK", currency: "USD" },
    });
    const otp = await requestOtp(db, result.sessionToken, session!.id);
    expect(otp).toMatchObject({
      mode: "mock",
      wsUrl: null,
      account: { login: "VRTC-MOCK" },
    });
    process.env.DERIV_MODE = "demo";
    await expect(
      requestOtp(db, result.sessionToken, session!.id),
    ).rejects.toMatchObject({ code: "DERIV_DISABLED" });
    expect(await traderSession(db, result.sessionToken)).toBeNull();
    process.env.DERIV_MODE = "mock";
    await expect(completeOAuth(db, "mock-code", state)).rejects.toMatchObject({
      code: "INVALID_OAUTH_STATE",
    });
  });

  it("rejects unpublished sites", async () => {
    await expect(
      beginOAuth(db, "missing-site", "http://localhost:3200"),
    ).rejects.toMatchObject({ code: "SITE_NOT_FOUND" });
  });
});
