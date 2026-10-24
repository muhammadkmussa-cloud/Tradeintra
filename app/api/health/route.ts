import { studioMode } from "@/lib/server/studio/database";
import { isPocEnabled } from "@/lib/server/poc-config";
import { derivMode } from "@/lib/server/deriv";
export const dynamic = "force-dynamic";
export function GET() {
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
  try {
    return Response.json(
      {
        service: "tradeintra",
        status: "ok",
        derivMode: derivMode(),
        studioPersistence: "browser-local",
        accountMode: studioMode(),
        stagingPoc: isPocEnabled(),
      },
      { headers },
    );
  } catch {
    return Response.json(
      { service: "tradeintra", status: "unavailable" },
      { status: 503, headers },
    );
  }
}
