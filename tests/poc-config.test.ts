import { describe, it, expect } from "vitest";
import {
  assertMockOnly,
  getPocHosts,
  getTenantForHost,
  normalizeHostname,
  requirePoc,
  safeDiagnosticError,
} from "../lib/server/poc-config";
const env = {
  POC_ENABLED: "true",
  POC_HOSTS: JSON.stringify({
    "aurora.example.test": "aurora",
    "nova.example.test": "nova",
  }),
};
describe("fail-closed staging configuration", () => {
  it("is disabled by default and requires explicit staging opt-in", () => {
    expect(getPocHosts({})).toEqual({});
    expect(getTenantForHost("aurora.example.test", {})).toBeNull();
    expect(() => requirePoc({})).toThrow();
  });
  it("never permits live Deriv or payment-agent flags", () => {
    for (const setting of [
      { DERIV_MODE: "live" },
      { FEATURE_LIVE_DERIV: "true" },
      { FEATURE_PAYMENT_AGENT: "true" },
      { DERIV_MODE: "LIVE" },
    ])
      expect(() => assertMockOnly(setting)).toThrow();
    expect(() =>
      assertMockOnly({ DERIV_MODE: "mock", FEATURE_PAYMENT_AGENT: "false" }),
    ).not.toThrow();
  });
  it("normalizes casing, a trailing dot and an optional port", () => {
    expect(normalizeHostname("Aurora.Example.Test:3000")).toBe(
      "aurora.example.test",
    );
    expect(normalizeHostname("aurora.example.test.")).toBe(
      "aurora.example.test",
    );
    expect(getTenantForHost("AURORA.EXAMPLE.TEST:443", env)).toBe("aurora");
  });
  it("rejects URLs, forwarded host lists, path injection, invalid ports and malformed labels", () => {
    for (const host of [
      "https://aurora.example.test",
      "x@example.test",
      "aurora.example.test/",
      "aurora.example.test, nova.example.test",
      "-bad.example.test",
      "bad..test",
      "a".repeat(64) + ".test",
      "example.test:99999",
      "example.test:0",
      "example.test\\nova",
      "example.test\n",
      "example.test:abc",
    ])
      expect(normalizeHostname(host), host).toBeNull();
  });
  it("accepts exact mapped hosts only and cannot read Object prototype keys", () => {
    expect(getTenantForHost("evil-aurora.example.test", env)).toBeNull();
    expect(getTenantForHost("constructor", env)).toBeNull();
    expect(getTenantForHost("__proto__", env)).toBeNull();
    expect(getTenantForHost("nova.example.test", env)).toBe("nova");
  });
  it("refuses invalid, empty, oversized, wildcard or noncanonical maps", () => {
    for (const hosts of [
      "[]",
      "{}",
      "null",
      '{"*.test":"aurora"}',
      '{"HOST.test":"aurora"}',
      '{"valid.test":"unknown"}',
      '{"valid.test:3000":"aurora"}',
      JSON.stringify(
        Object.fromEntries(
          Array.from({ length: 11 }, (_, i) => [`host${i}.test`, "aurora"]),
        ),
      ),
    ])
      expect(() => getPocHosts({ ...env, POC_HOSTS: hosts })).toThrow();
    expect(() => getPocHosts({ POC_ENABLED: "true" })).toThrow();
  });
  it("redacts arbitrary database errors and connection strings", () => {
    const secret = "postgres://user:super-secret@host/db";
    expect(safeDiagnosticError(new Error(secret))).not.toContain(secret);
    expect(
      safeDiagnosticError({ code: "ECONNREFUSED", message: secret }),
    ).toContain("ECONNREFUSED");
    expect(safeDiagnosticError({ code: secret })).not.toContain(secret);
  });
});
