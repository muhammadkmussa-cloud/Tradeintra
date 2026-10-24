import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const html = (
    await readFile(
      path.join(process.cwd(), "public", "trade", "index.html"),
      "utf8",
    )
  )
    .replace(/\.\/styles\.css(\?[^"]*)?/, "/trade/styles.css$1")
    .replace(/\.\/app\.js(\?[^"]*)?/, "/trade/app.js$1");
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
