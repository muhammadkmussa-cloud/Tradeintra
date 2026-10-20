import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

function key() {
  const configured = process.env.TOKEN_ENCRYPTION_KEY;
  if (!configured) {
    if (process.env.NODE_ENV === "production")
      throw new Error("TOKEN_ENCRYPTION_KEY is required in production.");
    return createHash("sha256").update("tradeintra-development-key").digest();
  }
  const decoded = Buffer.from(configured, "base64");
  if (decoded.length !== 32)
    throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes encoded as base64.");
  return decoded;
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return `${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptSecret(value: string) {
  const [iv, tag, encrypted] = value.split(".");
  if (!iv || !tag || !encrypted) throw new Error("Invalid encrypted secret.");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
