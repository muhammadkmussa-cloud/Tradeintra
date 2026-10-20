// Minimal cPanel/Passenger entry for the standalone release.
// The generated ./server.js starts Next; this wrapper fails closed before that.
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
if (process.env.STUDIO_DB_MODE === "local") {
  console.error(
    "The standalone release is PostgreSQL-only. Use the source checkout for local PGlite development.",
  );
  process.exit(1);
}
const rawPort = process.env.PORT || "3000";
if (!/^\d+$/.test(rawPort) || Number(rawPort) < 1 || Number(rawPort) > 65535) {
  console.error("PORT must be a TCP port between 1 and 65535.");
  process.exit(1);
}
process.env.HOSTNAME = "0.0.0.0";
require("./server.js");
