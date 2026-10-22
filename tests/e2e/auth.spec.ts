import { expect, test } from "@playwright/test";

test.describe("mobile auth", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const [path, heading] of [
    ["/login", "Welcome back."],
    ["/signup", "Start your studio."],
  ] as const) {
    test(`${path} is usable without horizontal overflow`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await page.getByRole("button", { name: "Open navigation" }).click();
      await expect(
        page.getByRole("button", { name: "Toggle color theme" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Close navigation" }).click();
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
