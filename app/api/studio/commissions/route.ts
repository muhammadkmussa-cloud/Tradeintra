import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import { StudioError } from "@/lib/server/studio/types";
import {
  rateLimit,
  sessionActor,
  SESSION_COOKIE,
} from "@/lib/server/studio/auth";
import { readJson, checkOrigin } from "@/lib/server/studio/http";
import {
  commissionSummary,
  submitCommissionStatement,
} from "@/lib/server/commerce";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers });
const MAX_STATEMENT_BYTES = 200 * 1024;

async function actor(request: NextRequest) {
  if (studioMode() === "disabled")
    throw new StudioError(503, "Commission statements are not configured.");
  const db = await getStudioDb();
  const session = await sessionActor(
    db,
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  if (!session)
    throw new StudioError(
      401,
      "Sign in to submit a statement.",
      "UNAUTHENTICATED",
    );
  return { db, session };
}

function failure(error: unknown) {
  if (error instanceof StudioError)
    return json({ error: error.message, code: error.code }, error.status);
  console.error("Commission statement unavailable; details omitted.");
  return json({ error: "The commission service is unavailable." }, 503);
}

function parseGrossCsv(csv: string) {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return null;
  const header = lines[0].split(",").map((cell) =>
    cell
      .trim()
      .toLowerCase()
      .replace(/[^a-z_]/g, ""),
  );
  const column = header.findIndex(
    (cell) => cell === "gross_commission" || cell === "commission",
  );
  if (column >= 0) {
    let total = 0;
    for (const line of lines.slice(1)) {
      const value = Number(
        (line.split(",")[column] ?? "").replace(/[$,]/g, "").trim(),
      );
      if (Number.isFinite(value)) total += value;
    }
    return total > 0 ? total : null;
  }
  if (lines.length === 1) {
    const value = Number(lines[0].replace(/[$,]/g, ""));
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { db, session } = await actor(request);
    return json(await commissionSummary(db, session.id));
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const { db, session } = await actor(request);
    await rateLimit(db, `commissions:${session.id}`, 10, 60);
    if (!request.headers.get("content-type")?.includes("multipart/form-data"))
      throw new StudioError(415, "Upload a CSV statement.");
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_STATEMENT_BYTES + 16_384)
      throw new StudioError(413, "Statement is too large.");
    const form = await request.formData();
    const period = String(form.get("period") ?? "").trim();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))
      throw new StudioError(422, "Use a period like 2026-10.", "VALIDATION");
    const file = form.get("statement");
    if (!(file instanceof File))
      throw new StudioError(422, "Attach a CSV statement.", "VALIDATION");
    if (file.size > MAX_STATEMENT_BYTES)
      throw new StudioError(413, "Statement is too large.");
    if (!/\.(csv|txt)$/i.test(file.name))
      throw new StudioError(
        422,
        "Upload a .csv or .txt statement.",
        "VALIDATION",
      );
    const csv = await file.text();
    if (csv.length > MAX_STATEMENT_BYTES)
      throw new StudioError(413, "Statement is too large.");
    const gross = parseGrossCsv(csv);
    if (gross === null)
      throw new StudioError(
        422,
        "Include a gross_commission or commission column.",
        "VALIDATION",
      );
    const sha256 = createHash("sha256").update(csv).digest("hex");
    return json(
      await submitCommissionStatement(
        db,
        session.id,
        period,
        gross,
        file.name.slice(0, 120),
        sha256,
        csv,
      ),
      201,
    );
  } catch (error) {
    return failure(error);
  }
}
