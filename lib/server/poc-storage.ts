import { constants } from "node:fs";
import { lstat, mkdir, open, realpath, unlink } from "node:fs/promises";
import path from "node:path";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const MAX_PROBE_BYTES = 65536;
export class PocStorage {
  constructor(private root: string) {
    const normalized = path.resolve(root);
    const relative = path.relative(process.cwd(), normalized);
    if (
      !path.isAbsolute(root) ||
      normalized === path.parse(normalized).root ||
      !relative ||
      (!relative.startsWith(`..${path.sep}`) && relative !== "..") ||
      normalized
        .split(path.sep)
        .some((segment) => ["public", "public_html"].includes(segment))
    )
      throw new Error(
        "STORAGE_ROOT must be outside the project and web roots, using an absolute private path.",
      );
    this.root = normalized;
  }
  private async privateDirectory(directory: string) {
    await mkdir(directory, { mode: 0o700, recursive: true });
    const stat = await lstat(directory);
    if (
      !stat.isDirectory() ||
      stat.isSymbolicLink() ||
      (stat.mode & 0o077) !== 0 ||
      (await realpath(directory)) !== directory
    )
      throw new Error(
        "POC storage requires private, real directories with mode 0700.",
      );
  }
  private async file(account: string, filename: string) {
    if (
      !uuid.test(account) ||
      !/^[0-9a-f-]{36}\.txt$/i.test(filename) ||
      !uuid.test(filename.slice(0, -4))
    )
      throw new Error("Invalid tenant storage path.");
    await this.privateDirectory(this.root);
    const directory = path.join(this.root, account);
    await this.privateDirectory(directory);
    return path.join(directory, filename);
  }
  async writeProbe(account: string, filename: string, content: Buffer) {
    if (content.byteLength > MAX_PROBE_BYTES)
      throw new Error("Probe exceeds the 64 KiB limit.");
    const target = await this.file(account, filename);
    const handle = await open(
      target,
      constants.O_WRONLY |
        constants.O_CREAT |
        constants.O_EXCL |
        constants.O_NOFOLLOW,
      0o600,
    );
    try {
      await handle.writeFile(content);
    } finally {
      await handle.close();
    }
  }
  async readProbe(account: string, filename: string) {
    const target = await this.file(account, filename);
    const handle = await open(
      target,
      constants.O_RDONLY | constants.O_NOFOLLOW,
    );
    try {
      const stat = await handle.stat();
      if (
        !stat.isFile() ||
        stat.size > MAX_PROBE_BYTES ||
        (stat.mode & 0o077) !== 0
      )
        throw new Error("Invalid private probe file.");
      return await handle.readFile();
    } finally {
      await handle.close();
    }
  }
  async deleteProbe(account: string, filename: string) {
    await unlink(await this.file(account, filename));
  }
}
