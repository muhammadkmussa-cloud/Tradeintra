import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "dist", "cpanel");
const required = [
  "cpanel-start.js",
  "server.js",
  "package.json",
  "RELEASE.json",
  "next.config.ts",
  ".next/static",
  "public/trade/index.html",
  "public/trade/app.js",
  "public/trade/styles.css",
  "public/trade/.htaccess",
  "public/trade/README.md",
  "database/035-commission-statements.sql",
  "node_modules/pg-protocol/dist/index.js",
  "node_modules/@electric-sql/pglite/package.json",
];
const failures = [];

const htaccess = await readFile(
  path.join(target, "public/trade/.htaccess"),
  "utf8",
).catch(() => "");
if (!htaccess.includes("img-src 'self' data: https://tradeintra.com"))
  failures.push("trade CSP missing logo origin");
if (!htaccess.includes("connect-src 'self' https://tradeintra.com"))
  failures.push("trade CSP missing API origin");
if (
  !/https:\/\/api\.derivws\.com/.test(htaccess) ||
  !/wss:\/\/api\.derivws\.com/.test(htaccess)
)
  failures.push("trade CSP missing Deriv WebSocket origins");

for (const file of required) {
  try {
    await access(path.join(target, file));
  } catch {
    failures.push(`missing ${file}`);
  }
}

const release = JSON.parse(
  await readFile(path.join(target, "RELEASE.json"), "utf8"),
);
for (const key of ["name", "version", "createdAt", "commit", "migrations"]) {
  if (!(key in release)) failures.push(`RELEASE.json missing ${key}`);
}
if (release.demoOnly !== true) failures.push("RELEASE.json must mark demoOnly");

const rootFiles = await readdir(target);
if (rootFiles.some((file) => file.endsWith(".png")))
  failures.push("release contains root screenshots");

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next"].includes(entry.name)) continue;
      await walk(full);
      continue;
    }
    if (/\.(png|jpe?g|webp)$/i.test(entry.name)) {
      failures.push(`unexpected image ${path.relative(target, full)}`);
    }
    if (/^\.env(\.|$)/.test(entry.name)) {
      failures.push(`secret env file ${path.relative(target, full)}`);
    }
    if (entry.size > 10 * 1024 * 1024) {
      failures.push(`oversized file ${path.relative(target, full)}`);
    }
    if (
      /\.(js|ts|tsx|mjs|cjs|html|css)$/.test(entry.name) &&
      path.basename(full) !== "verify-release.mjs"
    ) {
      const content = await readFile(full, "utf8");
      if (/DEEPSEEK|api\.deepseek\.com|AI credit packs/i.test(content)) {
        failures.push(`removed AI surface in ${path.relative(target, full)}`);
      }
    }
  }
};
await walk(target);

const size = (
  await Promise.all(
    (await readdir(target, { withFileTypes: true })).map(async (entry) => {
      if (!entry.isDirectory())
        return (await stat(path.join(target, entry.name))).size;
      if (entry.name === "node_modules") return 0;
      return 0;
    }),
  )
).reduce((sum, value) => sum + value, 0);

if (failures.length) {
  console.error("Release verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(
  `Release verified: ${release.name}@${release.version} · ${release.commit.slice(0, 12)} · ${release.migrations} migrations · demo-only`,
);
