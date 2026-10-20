import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy, resolveHostRoute } from "../proxy";

afterEach(() => vi.unstubAllEnvs());

const base = {
  APP_URL: "https://tradeintra.com",
  TENANT_HOST_SUFFIX: "tradeintra.com",
};

function request(host: string, path = "/") {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: { host },
  });
}

describe("production tenant host resolution", () => {
  it("classifies control-plane, free-subdomain, reserved, and custom hosts", () => {
    expect(resolveHostRoute("tradeintra.com", base)).toEqual({
      kind: "control",
    });
    expect(resolveHostRoute("www.tradeintra.com", base)).toEqual({
      kind: "control",
    });
    expect(resolveHostRoute("aurora.tradeintra.com", base)).toEqual({
      kind: "tenant",
      slug: "aurora",
    });
    expect(resolveHostRoute("admin.tradeintra.com", base)).toEqual({
      kind: "reserved",
    });
    expect(resolveHostRoute("by-host.tradeintra.com", base)).toEqual({
      kind: "reserved",
    });
    expect(resolveHostRoute("a.b.tradeintra.com", base)).toEqual({
      kind: "reserved",
    });
    expect(resolveHostRoute("operator.example", base)).toEqual({
      kind: "none",
    });
    expect(
      resolveHostRoute("operator.example", {
        ...base,
        TENANT_CUSTOM_HOSTS: "true",
      }),
    ).toEqual({ kind: "custom" });
  });

  it("rewrites free-subdomain roots and blocks control-plane paths", () => {
    vi.stubEnv("APP_URL", base.APP_URL);
    vi.stubEnv("TENANT_HOST_SUFFIX", base.TENANT_HOST_SUFFIX);
    vi.stubEnv("POC_ENABLED", "false");
    const rewrite = proxy(request("aurora.tradeintra.com"));
    expect(rewrite.headers.get("x-middleware-rewrite")).toContain(
      "/sites/aurora",
    );
    expect(
      proxy(request("aurora.tradeintra.com", "/api/studio/session")).status,
    ).toBe(404);
    expect(
      proxy(request("aurora.tradeintra.com", "/sites/aurora")).status,
    ).toBe(200);
    expect(proxy(request("admin.tradeintra.com")).status).toBe(404);
    expect(proxy(request("aurora.tradeintra.com", "/sites/nova")).status).toBe(
      404,
    );
    expect(proxy(request("unknown.example")).status).toBe(404);
    const spoof = new NextRequest("http://localhost:3000/", {
      headers: {
        host: "unknown.example",
        "x-forwarded-host": "aurora.tradeintra.com",
      },
    });
    expect(proxy(spoof).status).toBe(404);
  });

  it("rewrites custom hosts to the server-side host resolver", () => {
    vi.stubEnv("APP_URL", base.APP_URL);
    vi.stubEnv("TENANT_HOST_SUFFIX", base.TENANT_HOST_SUFFIX);
    vi.stubEnv("TENANT_CUSTOM_HOSTS", "true");
    vi.stubEnv("POC_ENABLED", "false");
    const rewrite = proxy(request("operator.example"));
    expect(rewrite.headers.get("x-middleware-rewrite")).toContain(
      "/sites/by-host",
    );
    expect(proxy(request("operator.example", "/sites/by-host")).status).toBe(
      200,
    );
    expect(proxy(request("operator.example", "/sites/other")).status).toBe(404);
  });
});
