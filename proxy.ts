import { NextRequest, NextResponse } from "next/server";
import { getTenantForHost, isPocEnabled } from "./lib/server/poc-config";

export function proxy(request: NextRequest) {
  try {
    if (!isPocEnabled()) return NextResponse.next();
    const tenant = getTenantForHost(request.headers.get("host"));
    if (!tenant) return NextResponse.next();
    const pathname = request.nextUrl.pathname;
    // A mapped tenant never receives the control plane or another tenant's route.
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = `/poc-tenant/${tenant}`;
      return NextResponse.rewrite(url);
    }
    if (pathname === `/poc-tenant/${tenant}`) return NextResponse.next();
    return new NextResponse("Not found", {
      status: 404,
      headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
    });
  } catch {
    return new NextResponse("Staging configuration unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
    });
  }
}
export const config = { matcher: ["/((?!_next/|favicon.svg|api/health).*)"] };
