import type { NextRequest } from "next/server";
import { StudioError } from "./types";
export function checkOrigin(request: NextRequest) {
  const raw = request.headers.get("origin");
  if (!raw)
    throw new StudioError(
      403,
      "A same-origin request is required.",
      "INVALID_ORIGIN",
    );
  let origin: URL;
  try {
    origin = new URL(raw);
  } catch {
    throw new StudioError(
      403,
      "A same-origin request is required.",
      "INVALID_ORIGIN",
    );
  }
  const expected = process.env.APP_URL
    ? new URL(process.env.APP_URL).origin
    : null;
  const sandbox = process.env.E2B_SANDBOX_ID;
  const local =
    process.env.STUDIO_DB_MODE === "local" ||
    process.env.NODE_ENV === "development";
  const previewOrigin =
    local && sandbox && /^[a-z0-9-]+$/i.test(sandbox)
      ? `https://${process.env.PORT || "3000"}-${sandbox}.e2b.app`
      : null;
  const sameHost =
    origin.host === request.headers.get("host") ||
    origin.origin === previewOrigin;
  if (
    (expected ? origin.origin !== expected : !sameHost) ||
    !["http:", "https:"].includes(origin.protocol) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new StudioError(
      403,
      "Cross-origin requests are not allowed.",
      "INVALID_ORIGIN",
    );
  if (
    origin.protocol !== "https:" &&
    !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)
  )
    throw new StudioError(
      403,
      "HTTPS is required for this account.",
      "HTTPS_REQUIRED",
    );
  return origin.protocol === "https:";
}
export async function readJson(
  request: NextRequest,
  limit = 16384,
): Promise<unknown> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    throw new StudioError(415, "Use an application/json request.");
  if (Number(request.headers.get("content-length") ?? 0) > limit)
    throw new StudioError(413, "Request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new StudioError(400, "A JSON body is required.");
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) {
        await reader.cancel();
        throw new StudioError(413, "Request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new StudioError(400, "Enter valid JSON.");
  }
}
