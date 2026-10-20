// cPanel/Passenger-compatible startup file. Build first; no provider calls or migrations.
const http = require("node:http");
const next = require("next");
if (
  (process.env.DERIV_MODE && process.env.DERIV_MODE !== "mock") ||
  (process.env.FEATURE_LIVE_DERIV &&
    process.env.FEATURE_LIVE_DERIV !== "false") ||
  (process.env.FEATURE_PAYMENT_AGENT &&
    process.env.FEATURE_PAYMENT_AGENT !== "false")
) {
  console.error(
    "Startup refused: only mock Deriv and disabled payment-agent features are supported.",
  );
  process.exit(1);
}
const rawPort = process.env.PORT || "3000";
if (!/^\d+$/.test(rawPort) || Number(rawPort) < 1 || Number(rawPort) > 65535) {
  console.error("PORT must be a TCP port between 1 and 65535.");
  process.exit(1);
}
const port = Number(rawPort);
const app = next({ dev: false, hostname: "0.0.0.0", port });
app
  .prepare()
  .then(() => {
    const handler = app.getRequestHandler();
    const server = http.createServer((req, res) => {
      Promise.resolve(handler(req, res)).catch(() => {
        console.error("Request failed; details omitted.");
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end("Service unavailable.");
        } else res.destroy();
      });
    });
    server.requestTimeout = 30000;
    server.headersTimeout = 35000;
    server.listen(port, "0.0.0.0", () =>
      console.log("Tradeintra Node runtime started."),
    );
    let stopping = false;
    const shutdown = () => {
      if (stopping) return;
      stopping = true;
      server.close(async () => {
        try {
          const db = await globalThis.tradeintraStudioDb;
          if (db) await db.destroy();
          await app.close();
          process.exit(0);
        } catch {
          console.error("Shutdown failed; private details omitted.");
          process.exit(1);
        }
      });
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);
  })
  .catch(() => {
    console.error(
      "Startup failed. Verify Node version and the production build.",
    );
    process.exit(1);
  });
