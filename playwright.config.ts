import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3110",
    viewport: { width: 1440, height: 1000 },
    headless: true,
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    },
  },
  webServer: {
    command: "npm run dev -- -p 3110",
    env: {
      SUPER_ADMIN_EMAILS: "admin@example.test",
      STORAGE_ROOT: "/tmp/tradeintra-e2e-storage",
      STUDIO_DATA_DIR: "/tmp/tradeintra-e2e-db",
      STUDIO_ENV: "local",
      TELEGRAM_MODE: "mock",
      PAYMENT_MODE: "mock",
      PAYOUT_MODE: "mock",
      MARKETPLACE_SCAN_MODE: "basic",
      AUTH_REGISTER_LIMIT: "1000",
      AUTH_LOGIN_LIMIT: "1000",
    },
    url: "http://localhost:3110",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
