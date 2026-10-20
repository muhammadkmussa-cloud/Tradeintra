// LOCAL built-server smoke test. Requires POC_ENABLED=true, the fixture host map,
// and no DATABASE_URL. Never targets a public host or changes infrastructure.
import assert from "node:assert/strict";
import http from "node:http";
const origin = new URL(process.argv[2] || "http://127.0.0.1:3001");
if (
  origin.protocol !== "http:" ||
  !["127.0.0.1", "localhost"].includes(origin.hostname) ||
  origin.username ||
  origin.password ||
  origin.pathname !== "/" ||
  origin.search ||
  origin.hash
)
  throw new Error("This smoke test only targets a local HTTP server.");
function request(path, host, extra = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      new URL(path, origin),
      { headers: { ...(host ? { Host: host } : {}), ...extra } },
      (res) => {
        let body = "";
        res.on("data", (x) => (body += x));
        res.on("end", () =>
          resolve({ status: res.statusCode, headers: res.headers, body }),
        );
      },
    );
    req.setTimeout(15000, () =>
      req.destroy(new Error("Local smoke request timed out.")),
    );
    req.on("error", reject);
  });
}
const health = await request("/api/health");
assert.equal(health.status, 200);
assert.equal(JSON.parse(health.body).stagingPoc, true);
assert.equal(health.headers["cache-control"], "no-store");
console.log("PASS: liveness is available and redacted");
assert.equal((await request("/poc-tenant/aurora")).status, 404);
console.log("PASS: unmapped host cannot read a tenant");
assert.equal(
  (await request("/poc-tenant/nova", "aurora.staging.example.test")).status,
  404,
);
console.log("PASS: mapped host cannot request a different tenant");
const tenant = await request("/", "aurora.staging.example.test");
assert.equal(tenant.status, 500);
assert.equal(tenant.headers["x-middleware-rewrite"], "/poc-tenant/aurora");
assert(!tenant.body.includes("Your markets. Your next move."));
assert(!tenant.body.includes("DATABASE_URL"));
console.log(
  "PASS: missing database fails closed, without draft fallback or secret details",
);
const spoof = await request("/", "unmapped.example.test", {
  "X-Forwarded-Host": "aurora.staging.example.test",
});
assert.equal(spoof.status, 200);
assert(!spoof.headers["x-middleware-rewrite"]);
console.log("PASS: forwarded hostname does not select a tenant");
assert.equal((await request("/")).status, 200);
console.log("PASS: browser-local control plane remains available");
