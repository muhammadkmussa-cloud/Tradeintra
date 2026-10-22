const base = process.env.APP_URL?.replace(/\/$/, "");
if (!base) {
  console.error("APP_URL is required.");
  process.exit(2);
}
const checks = ["/api/health/ready", "/api/health/providers"];
for (const path of checks) {
  try {
    const response = await fetch(`${base}${path}`, {
      signal: AbortSignal.timeout(10000),
    });
    console.log(`${path} ${response.status}`);
    if (!response.ok) process.exitCode = 1;
  } catch {
    console.error(`${path} unreachable`);
    process.exitCode = 1;
  }
}

export {};
