import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import { StudioError } from "@/lib/server/studio/types";
import { sessionActor, SESSION_COOKIE } from "@/lib/server/studio/auth";
import { checkOrigin } from "@/lib/server/studio/http";
import { scope } from "@/lib/server/studio/database";
import {
  deleteMarketplaceDelivery,
  MAX_MARKETPLACE_BYTES,
  marketplaceDeliveryPath,
  writeMarketplaceDelivery,
} from "@/lib/server/storage";
import { scanMarketplaceFile } from "@/lib/server/providers/malware";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED = new Set([
  "application/xml",
  "text/xml",
  "text/plain",
  "application/pdf",
]);

function failure(error: unknown) {
  if (error instanceof StudioError)
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  console.error("Marketplace upload unavailable; details omitted.");
  return NextResponse.json(
    { error: "The upload service is unavailable." },
    { status: 503 },
  );
}

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    if (studioMode() === "disabled")
      throw new StudioError(503, "Uploads are not configured.");
    const db = await getStudioDb();
    const actor = await sessionActor(
      db,
      request.cookies.get(SESSION_COOKIE)?.value,
    );
    if (!actor)
      throw new StudioError(
        401,
        "Sign in to upload a delivery.",
        "UNAUTHENTICATED",
      );
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      throw new StudioError(422, "Choose a delivery file.", "VALIDATION");
    if (file.size <= 0 || file.size > MAX_MARKETPLACE_BYTES)
      throw new StudioError(
        422,
        "Delivery must be between 1 byte and 5 MiB.",
        "VALIDATION",
      );
    const mime = file.type || "application/octet-stream";
    if (!ALLOWED.has(mime))
      throw new StudioError(
        422,
        "Allowed delivery types are XML, plain text, and PDF. Scanning is basic and no executable files are accepted.",
        "UNSUPPORTED_FILE",
      );
    const bytes = Buffer.from(await file.arrayBuffer());
    const stored = await writeMarketplaceDelivery(
      actor.id,
      file.name,
      bytes,
      mime,
    );
    let scan;
    try {
      scan = await scanMarketplaceFile(
        marketplaceDeliveryPath(stored.key),
        bytes,
        file.name,
        mime,
      );
    } catch (error) {
      await deleteMarketplaceDelivery(stored.key);
      throw new StudioError(
        422,
        error instanceof Error ? error.message : "Upload rejected.",
        "UNSAFE_UPLOAD",
      );
    }
    const id = randomUUID();
    await scope(db, actor.id, (tx) =>
      tx
        .insertInto("marketplace_uploads")
        .values({
          id,
          account_id: actor.id,
          asset_key: stored.key,
          filename: file.name.slice(0, 120),
          mime,
          size: stored.size,
          scan_status: scan.status,
          scan_engine: scan.engine,
        })
        .execute(),
    );
    return NextResponse.json({
      uploadId: id,
      filename: file.name.slice(0, 120),
      mime,
      size: stored.size,
    });
  } catch (error) {
    return failure(error);
  }
}
