import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { handleMcpRequest } from "@/lib/server/mcp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

function authorized(header: string, expected: string) {
  const match = /^Bearer[ \t]+(.+)$/i.exec(header.trim());
  if (!match) return false;
  const given = Buffer.from(match[1]);
  const want = Buffer.from(expected);
  return given.length === want.length && timingSafeEqual(given, want);
}

export async function GET() {
  return new NextResponse(null, {
    status: 405,
    headers: { ...headers, Allow: "POST" },
  });
}

export async function POST(request: NextRequest) {
  const expected = process.env.MCP_API_KEY?.trim();
  if (expected) {
    const authorization = request.headers.get("authorization") ?? "";
    if (!authorized(authorization, expected))
      return NextResponse.json(
        { error: "Unauthorized." },
        {
          status: 401,
          headers: { ...headers, "WWW-Authenticate": 'Bearer realm="mcp"' },
        },
      );
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error." },
      },
      { status: 400, headers },
    );
  }
  try {
    const response = handleMcpRequest(payload);
    if (!response) return new NextResponse(null, { status: 202, headers });
    return NextResponse.json(response, { headers });
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32603, message: "Internal error." },
      },
      { headers },
    );
  }
}
