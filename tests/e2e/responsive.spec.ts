import { expect, test } from "@playwright/test";

const pages = [
  "/",
  "/about",
  "/developers",
  "/mcp",
  "/status",
  "/terms",
  "/privacy",
  "/contact",
  "/login",
  "/signup",
];

test("public pages do not overflow across key widths", async ({ page }) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of pages) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(0);
    }
  }
});

test("reduced motion keeps all revealed content visible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const reveals = page.locator("[data-reveal]");
  expect(await reveals.count()).toBeGreaterThan(0);
  const hidden = await reveals.evaluateAll(
    (nodes) =>
      nodes.filter((node) => getComputedStyle(node).opacity === "0").length,
  );
  expect(hidden).toBe(0);
  await expect(page.locator(".home-deriv-copy")).toHaveCSS("opacity", "1");
});
