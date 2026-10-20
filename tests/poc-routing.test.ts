import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";
afterEach(() => vi.unstubAllEnvs());
function enable() {
  vi.stubEnv("POC_ENABLED", "true");
  vi.stubEnv(
    "POC_HOSTS",
    JSON.stringify({
      "aurora.example.test": "aurora",
      "nova.example.test": "nova",
    }),
  );
}
function request(host: string, path = "/", forwardedHost?: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: {
      host,
      ...(forwardedHost ? { "x-forwarded-host": forwardedHost } : {}),
    },
  });
}
describe("staging hostname boundary", () => {
  it("leaves the browser-local control plane untouched when POC is off", () => {
    vi.stubEnv("POC_ENABLED", "false");
    expect(
      proxy(request("aurora.example.test")).headers.get("x-middleware-rewrite"),
    ).toBeNull();
  });
  it("rewrites only exact mapped hosts to their own tenant page", () => {
    enable();
    expect(
      proxy(request("aurora.example.test")).headers.get("x-middleware-rewrite"),
    ).toBe("http://localhost:3000/poc-tenant/aurora");
    expect(
      proxy(request("nova.example.test")).headers.get("x-middleware-rewrite"),
    ).toBe("http://localhost:3000/poc-tenant/nova");
  });
  it("rejects the control plane and cross-tenant routes on tenant hosts", () => {
    enable();
    expect(
      proxy(request("aurora.example.test", "/poc-tenant/nova")).status,
    ).toBe(404);
    expect(proxy(request("aurora.example.test", "/settings")).status).toBe(404);
    expect(
      proxy(request("aurora.example.test", "/poc-tenant/aurora")).headers.get(
        "x-middleware-next",
      ),
    ).toBe("1");
  });
  it("does not use X-Forwarded-Host to select a tenant", () => {
    enable();
    expect(
      proxy(
        request("unmapped.example.test", "/", "aurora.example.test"),
      ).headers.get("x-middleware-rewrite"),
    ).toBeNull();
    expect(
      proxy(
        request("aurora.example.test", "/", "nova.example.test"),
      ).headers.get("x-middleware-rewrite"),
    ).toContain("/aurora");
  });
  it("fails closed with a redacted 503 for invalid staging configuration", async () => {
    enable();
    vi.stubEnv("POC_HOSTS", "not JSON with a secret");
    const response = proxy(request("aurora.example.test"));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("secret");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("cannot serve tenant pages when live provider flags are set", () => {
    enable();
    vi.stubEnv("FEATURE_LIVE_DERIV", "true");
    expect(proxy(request("aurora.example.test")).status).toBe(503);
  });
});
