import { describe, it, expect, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { checkOrigin, readJson } from "../lib/server/studio/http";
const request = (
  origin: string | undefined,
  body = "{}",
  headers: Record<string, string> = {},
) =>
  new NextRequest("http://localhost:3000/api/studio/action", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      "content-type": "application/json",
      ...(origin ? { origin } : {}),
      ...headers,
    },
    body,
  });
afterEach(() => vi.unstubAllEnvs());
describe("studio HTTP boundaries", () => {
  it("requires a matching browser origin and rejects cross-site requests", () => {
    expect(checkOrigin(request("http://localhost:3000"))).toBe(false);
    expect(() => checkOrigin(request(undefined))).toThrow();
    expect(() => checkOrigin(request("https://evil.test"))).toThrow();
    expect(() =>
      checkOrigin(
        request("http://localhost:3000", "{}", {
          "sec-fetch-site": "cross-site",
        }),
      ),
    ).toThrow();
  });
  it("supports HTTPS preview origins while refusing public cleartext credentials", () => {
    const input = new NextRequest("https://preview.e2b.app/api/studio/action", {
      method: "POST",
      headers: { host: "preview.e2b.app", origin: "https://preview.e2b.app" },
    });
    expect(checkOrigin(input)).toBe(true);
    const insecure = new NextRequest("http://example.test/api/studio/action", {
      method: "POST",
      headers: { host: "example.test", origin: "http://example.test" },
    });
    expect(() => checkOrigin(insecure)).toThrow("HTTPS");
  });
  it("accepts only the platform-owned preview origin in local mode, not arbitrary forwarded hosts", () => {
    vi.stubEnv("E2B_SANDBOX_ID", "sandbox-test");
    vi.stubEnv("STUDIO_DB_MODE", "local");
    vi.stubEnv("PORT", "3000");
    expect(checkOrigin(request("https://3000-sandbox-test.e2b.app"))).toBe(
      true,
    );
    expect(() =>
      checkOrigin(
        request("https://3000-another-sandbox.e2b.app", "{}", {
          "x-forwarded-host": "3000-another-sandbox.e2b.app",
        }),
      ),
    ).toThrow();
  });
  it("respects an explicitly configured canonical staging origin", () => {
    vi.stubEnv("APP_URL", "https://staging.example.test");
    expect(() => checkOrigin(request("http://localhost:3000"))).toThrow();
  });
  it("bounds streamed JSON and never accepts oversized input, wrong content type, or invalid JSON", async () => {
    expect(
      await readJson(request("http://localhost:3000", '{"ok":true}')),
    ).toEqual({ ok: true });
    await expect(
      readJson(request("http://localhost:3000", "{")),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      readJson(
        request("http://localhost:3000", "{}", {
          "content-type": "text/plain",
        }),
      ),
    ).rejects.toMatchObject({ status: 415 });
    await expect(
      readJson(
        request(
          "http://localhost:3000",
          JSON.stringify({ x: "a".repeat(17000) }),
        ),
      ),
    ).rejects.toMatchObject({ status: 413 });
  });
});
