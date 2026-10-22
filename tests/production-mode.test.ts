import { afterEach, describe, expect, it, vi } from "vitest";
import { studioMode } from "../lib/server/studio/database";

afterEach(() => vi.unstubAllEnvs());

const base = {
  STUDIO_DB_MODE: "postgres",
  STUDIO_ENABLED: "true",
  APP_URL: "https://tradeintra.com",
  DATABASE_URL: "postgres://example",
};

describe("production account mode gate", () => {
  it("allows staging without a production approval flag", () => {
    vi.stubEnv("STUDIO_DB_MODE", base.STUDIO_DB_MODE);
    vi.stubEnv("STUDIO_ENABLED", base.STUDIO_ENABLED);
    vi.stubEnv("APP_URL", base.APP_URL);
    vi.stubEnv("DATABASE_URL", base.DATABASE_URL);
    vi.stubEnv("STUDIO_ENV", "staging");
    expect(studioMode()).toBe("postgres");
  });

  it("refuses production without explicit approval", () => {
    vi.stubEnv("STUDIO_DB_MODE", base.STUDIO_DB_MODE);
    vi.stubEnv("STUDIO_ENABLED", base.STUDIO_ENABLED);
    vi.stubEnv("APP_URL", base.APP_URL);
    vi.stubEnv("DATABASE_URL", base.DATABASE_URL);
    vi.stubEnv("STUDIO_ENV", "production");
    expect(() => studioMode()).toThrow(/PRODUCTION_APPROVED/);
  });

  it("allows approved production mode", () => {
    vi.stubEnv("STUDIO_DB_MODE", base.STUDIO_DB_MODE);
    vi.stubEnv("STUDIO_ENABLED", base.STUDIO_ENABLED);
    vi.stubEnv("APP_URL", base.APP_URL);
    vi.stubEnv("DATABASE_URL", base.DATABASE_URL);
    vi.stubEnv("STUDIO_ENV", "production");
    vi.stubEnv("PRODUCTION_APPROVED", "true");
    expect(studioMode()).toBe("postgres");
  });
});
