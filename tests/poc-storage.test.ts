import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { mkdtemp, rm, stat, symlink, chmod, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { PocStorage, MAX_PROBE_BYTES } from "../lib/server/poc-storage";
const a = "10000000-0000-4000-8000-000000000001",
  b = "10000000-0000-4000-8000-000000000002";
let root: string;
let store: PocStorage;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "tradeintra-test-"));
  store = new PocStorage(root);
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});
describe("private bounded staging probe files", () => {
  it("writes a private file, scopes reads by account, and cleans up", async () => {
    const filename = `${randomUUID()}.txt`;
    await store.writeProbe(a, filename, Buffer.from("tenant A"));
    expect((await store.readProbe(a, filename)).toString()).toBe("tenant A");
    expect((await stat(path.join(root, a))).mode & 0o777).toBe(0o700);
    expect((await stat(path.join(root, a, filename))).mode & 0o777).toBe(0o600);
    await expect(store.readProbe(b, filename)).rejects.toMatchObject({
      code: "ENOENT",
    });
    await store.deleteProbe(a, filename);
    await expect(store.readProbe(a, filename)).rejects.toMatchObject({
      code: "ENOENT",
    });
  });
  it("rejects account/filename traversal and storage under project or web roots", async () => {
    await expect(
      store.writeProbe("../b", `${randomUUID()}.txt`, Buffer.from("x")),
    ).rejects.toThrow();
    await expect(store.readProbe(a, "../../secrets.txt")).rejects.toThrow();
    for (const location of [
      "relative",
      "/",
      process.cwd(),
      path.join(process.cwd(), "private"),
      "/home/test/public_html/storage",
    ])
      expect(() => new PocStorage(location)).toThrow();
  });
  it("enforces the limit and never overwrites an existing probe", async () => {
    const filename = `${randomUUID()}.txt`;
    await expect(
      store.writeProbe(a, filename, Buffer.alloc(MAX_PROBE_BYTES + 1)),
    ).rejects.toThrow("64 KiB");
    await store.writeProbe(a, filename, Buffer.from("original"));
    await expect(
      store.writeProbe(a, filename, Buffer.from("replace")),
    ).rejects.toMatchObject({ code: "EEXIST" });
    expect((await store.readProbe(a, filename)).toString()).toBe("original");
  });
  it("refuses world/group-readable storage directories", async () => {
    await chmod(root, 0o755);
    await expect(
      store.writeProbe(a, `${randomUUID()}.txt`, Buffer.from("x")),
    ).rejects.toThrow("0700");
  });
  it("refuses symlinked tenant directories and files", async () => {
    const filename = `${randomUUID()}.txt`;
    await store.writeProbe(a, filename, Buffer.from("a"));
    await symlink(path.join(root, a), path.join(root, b));
    await expect(store.readProbe(b, filename)).rejects.toThrow("0700");
    const linkName = `${randomUUID()}.txt`;
    await symlink(path.join(root, a, filename), path.join(root, a, linkName));
    await expect(store.readProbe(a, linkName)).rejects.toMatchObject({
      code: "ELOOP",
    });
  });
  it("rejects an oversized or public file on read", async () => {
    const filename = `${randomUUID()}.txt`;
    await store.writeProbe(a, filename, Buffer.from("x"));
    await writeFile(
      path.join(root, a, filename),
      Buffer.alloc(MAX_PROBE_BYTES + 1),
    );
    await expect(store.readProbe(a, filename)).rejects.toThrow(
      "Invalid private probe file",
    );
  });
});
