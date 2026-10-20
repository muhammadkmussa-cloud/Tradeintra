import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, ".next", "standalone");
const target = path.join(root, "dist", "cpanel");

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
    },
    null,
    2,
  ),
);
console.log(`Standalone release ready: ${path.relative(root, target)}`);
