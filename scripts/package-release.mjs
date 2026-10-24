import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, ".next", "standalone");
const target = path.join(root, "dist", "cpanel");
const commit = (() => {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
})();
const migrations = (await readdir(path.join(root, "database"))).filter((file) =>
  file.endsWith(".sql"),
).length;

async function copy(from, to) {
  await cp(from, to, {
    recursive: true,
    force: true,
    dereference: true,
  });
}

await rm(path.join(root, "dist"), { recursive: true, force: true });
await mkdir(target, { recursive: true });
await copy(source, target);
await copy(
  path.join(root, ".next", "static"),
  path.join(target, ".next", "static"),
);
await copy(path.join(root, "public"), path.join(target, "public"));
const runtimeModules = [
  ...(await readdir(path.join(root, "node_modules"))).filter(
    (name) =>
      name === "pg" ||
      name.startsWith("pg-") ||
      name.startsWith("postgres-") ||
      ["split2", "xtend", "pgpass"].includes(name),
  ),
];
for (const module of runtimeModules) {
  await copy(
    path.join(root, "node_modules", module),
    path.join(target, "node_modules", module),
  );
}
await copy(
  path.join(root, "node_modules", "@electric-sql", "pglite"),
  path.join(target, "node_modules", "@electric-sql", "pglite"),
);
await copy(path.join(root, "database"), path.join(target, "database"));
await copy(
  path.join(root, "scripts", "cpanel-start.js"),
  path.join(target, "cpanel-start.js"),
);
const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
await writeFile(
  path.join(target, "package.json"),
  JSON.stringify(
    {
      name: pkg.name,
      version: pkg.version,
      private: true,
      engines: pkg.engines,
      scripts: { start: "node cpanel-start.js" },
    },
    null,
    2,
  ),
);
await writeFile(
  path.join(target, "RELEASE.json"),
  JSON.stringify(
    {
      name: pkg.name,
      version: pkg.version,
      createdAt: new Date().toISOString(),
      node: pkg.engines?.node,
      startup: "cpanel-start.js",
      commit,
      migrations,
      demoOnly: true,
      tradeSpa: "/trade",
    },
    null,
    2,
  ),
);
console.log(`Standalone release ready: ${path.relative(root, target)}`);
