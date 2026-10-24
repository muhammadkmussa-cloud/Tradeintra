import { NextRequest, NextResponse } from "next/server";
import {
  assertMockOnly,
  getTenantForHost,
  isPocEnabled,
  normalizeHostname,
} from "./lib/server/poc-config";
import { RESERVED_SLUGS } from "./lib/studio";

export type HostRoute =
  | { kind: "control" }
  | { kind: "tenant"; slug: string }
  | { kind: "custom" }
  | { kind: "reserved" }
  | { kind: "none" };

function appHost(env: Record<string, string | undefined>) {
  try {
    return env.APP_URL ? normalizeHostname(new URL(env.APP_URL).host) : null;
  } catch {
    return null;
  }
}

/** Pure host classification. No database access: safe for the Edge proxy. */
export function resolveHostRoute(
  host: string | null,
  env: Record<string, string | undefined> = process.env,
): HostRoute {
  const hostname = normalizeHostname(host);
  if (!hostname) return { kind: "none" };
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === appHost(env)
  )
    return { kind: "control" };

  if (env.TENANT_HOST_SUFFIX && !normalizeHostname(env.TENANT_HOST_SUFFIX))
    return { kind: "reserved" };
  const suffix = normalizeHostname(env.TENANT_HOST_SUFFIX);
  if (suffix) {
    if (hostname === suffix || hostname === `www.${suffix}`)
      return { kind: "control" };
    if (hostname.endsWith(`.${suffix}`)) {
      const slug = hostname.slice(0, -(suffix.length + 1));
      if (!slug || slug.includes(".") || RESERVED_SLUGS.has(slug))
        return { kind: "reserved" };
      return { kind: "tenant", slug };
    }
  }

  if (env.TENANT_CUSTOM_HOSTS === "true") return { kind: "custom" };
  return { kind: "none" };
}

function notFound() {
  return new NextResponse("Not found", {
    status: 404,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}

function rewrite(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.rewrite(url);
}

export function proxy(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    const host = normalizeHostname(request.headers.get("host"));
    const tenancyConfigured =
      Boolean(process.env.TENANT_HOST_SUFFIX) ||
      process.env.TENANT_CUSTOM_HOSTS === "true";

    if (isPocEnabled()) {
      assertMockOnly();
      if (!host) return notFound();
      const tenant = getTenantForHost(host);
      if (!tenant) return NextResponse.next();
      if (pathname === "/") return rewrite(request, `/poc-tenant/${tenant}`);
      if (pathname === `/poc-tenant/${tenant}`) return NextResponse.next();
      return notFound();
    }

    const route = resolveHostRoute(host);
    if (route.kind === "control") return NextResponse.next();
    if (route.kind === "none")
      return process.env.TENANT_HOST_SUFFIX ? notFound() : NextResponse.next();
    if (route.kind === "reserved") return notFound();

    if (
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/fonts/") ||
      pathname === "/favicon.svg" ||
      pathname === "/favicon-dark.svg"
    )
      return NextResponse.next();

    if (route.kind === "tenant") {
      if (pathname === "/") return rewrite(request, `/sites/${route.slug}`);
      if (pathname === `/sites/${route.slug}`) return NextResponse.next();
      return notFound();
    }

    if (pathname === "/") return rewrite(request, "/sites/by-host");
    if (pathname === "/sites/by-host") return NextResponse.next();
    return notFound();
  } catch {
    return new NextResponse("Tenant routing unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
    });
  }
}
export const config = {
  matcher: ["/((?!_next/|fonts/|favicon.svg|favicon-dark.svg|api/health).*)"],
};
