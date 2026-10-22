import { constants, promises as fs } from "node:fs";
import path from "node:path";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const MAX_MARKETPLACE_BYTES = 5 * 1024 * 1024;
const KEY_PATTERN = /^marketplace\/[0-9a-f-]{36}\/[0-9a-f-]{36}-[a-z0-9._-]+$/i;

function rootPath() {
  return path.resolve(
    process.env.STORAGE_ROOT ??
      path.join(homedir(), ".local", "share", "tradeintra-storage"),
  );
}

async function privateDirectory(directory: string) {
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const stat = await fs.lstat(directory);
  if (
    !stat.isDirectory() ||
    stat.isSymbolicLink() ||
    (stat.mode & 0o077) !== 0 ||
    (await fs.realpath(directory)) !== directory
  )
    throw new Error("Private storage directory is not safe.");
}

function safeName(filename: string) {
  return (
    filename
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100) || "delivery.txt"
  );
}

export async function writeMarketplaceDelivery(
  account: string,
  filename: string,
  content: Buffer,
  mime = "application/octet-stream",
) {
  if (!uuid.test(account)) throw new Error("Invalid account storage path.");
  if (content.byteLength > MAX_MARKETPLACE_BYTES)
    throw new Error(
      "Marketplace delivery exceeds the 5 MiB development limit.",
    );
  const root = rootPath();
  await privateDirectory(root);
  const directory = path.join(root, "marketplace", account);
  await privateDirectory(directory);
  const key = `marketplace/${account}/${randomUUID()}-${safeName(filename)}`;
  const target = path.join(root, key);
  const handle = await fs.open(
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
  return { key, size: content.byteLength, mime };
}

export function marketplaceDeliveryPath(key: string) {
  if (!KEY_PATTERN.test(key))
    throw new Error("Invalid marketplace delivery key.");
  const root = rootPath();
  const target = path.resolve(root, key);
  if (!target.startsWith(root + path.sep))
    throw new Error("Invalid marketplace delivery path.");
  return target;
}

export async function deleteMarketplaceDelivery(key: string) {
  await fs.unlink(marketplaceDeliveryPath(key)).catch(() => {});
}

export async function readMarketplaceDelivery(key: string) {
  if (!KEY_PATTERN.test(key))
    throw new Error("Invalid marketplace delivery key.");
  const root = rootPath();
  const target = path.resolve(root, key);
  if (!target.startsWith(root + path.sep))
    throw new Error("Invalid marketplace delivery path.");
  const handle = await fs.open(
    target,
    constants.O_RDONLY | constants.O_NOFOLLOW,
  );
  try {
    const stat = await handle.stat();
    if (
      !stat.isFile() ||
      stat.size > MAX_MARKETPLACE_BYTES ||
      (stat.mode & 0o077) !== 0
    )
      throw new Error("Invalid marketplace delivery file.");
    return await handle.readFile();
  } finally {
    await handle.close();
  }
}
