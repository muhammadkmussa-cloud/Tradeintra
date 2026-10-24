import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import { publishedConfig } from "@/lib/server/studio/service";
import {
  LEGACY_SLUG_PATTERN,
  RESERVED_SLUGS,
  SLUG_PATTERN,
} from "@/lib/studio";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (
    (!SLUG_PATTERN.test(slug) && !LEGACY_SLUG_PATTERN.test(slug)) ||
    RESERVED_SLUGS.has(slug) ||
    studioMode() === "disabled"
  )
    return new NextResponse(null, { status: 404 });

  const config = await publishedConfig(await getStudioDb(), slug);
  const match = config?.logo?.match(
    /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/,
  );
  if (!match)
    return new NextResponse(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });

  const type = match[1] === "jpeg" ? "image/jpeg" : `image/${match[1]}`;
  const body = Buffer.from(match[2], "base64");
  const etag = `"${createHash("sha256").update(body).digest("hex").slice(0, 24)}"`;
  if (request.headers.get("if-none-match") === etag)
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  return new NextResponse(body, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
}
