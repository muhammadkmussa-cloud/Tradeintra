import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  MAX_MARKETPLACE_BYTES,
  readMarketplaceDelivery,
  writeMarketplaceDelivery,
} from "../lib/server/storage";

let directory: string;

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "tradeintra-storage-"));
  process.env.STORAGE_ROOT = path.join(directory, "storage");
});

afterAll(async () => {
  delete process.env.STORAGE_ROOT;
  await rm(directory, { recursive: true, force: true });
});

describe("private marketplace storage", () => {
  it("writes and reads an account-scoped delivery", async () => {
    const account = randomUUID();
    const stored = await writeMarketplaceDelivery(
      account,
      "delivery.xml",
      Buffer.from("<xml>delivery</xml>"),
      "application/xml",
    );
    expect(stored.key.startsWith(`marketplace/${account}/`)).toBe(true);
    expect((await readMarketplaceDelivery(stored.key)).toString()).toBe(
      "<xml>delivery</xml>",
    );
    await expect(readMarketplaceDelivery("../escape")).rejects.toThrow();
  });

  it("rejects oversized delivery content", async () => {
    await expect(
      writeMarketplaceDelivery(
        randomUUID(),
        "large.txt",
        Buffer.alloc(MAX_MARKETPLACE_BYTES + 1),
      ),
    ).rejects.toThrow(/5 MiB|exceeds/);
  });
});
