import { expect, test } from "@playwright/test";

test.describe("OS dark theme", () => {
  test.use({ colorScheme: "dark" });

  test("follows the OS, persists an explicit toggle, and passes axe", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(
      page.getByRole("link", { name: "Tradeintra home" }),
    ).toBeVisible();

    const { default: AxeBuilder } = await import("@axe-core/playwright");
    const home = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(home.violations).toEqual([]);

    await page.getByRole("button", { name: "Toggle color theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.waitForTimeout(800);
    expect(
      await page.evaluate(() => localStorage.getItem("tradeintra-theme")),
    ).toBe("light");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.goto("/login");
    await page.getByRole("button", { name: "Toggle color theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.waitForTimeout(800);
    const login = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(login.violations).toEqual([]);

    await page.goto("/studio");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const studio = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(studio.violations).toEqual([]);

    for (const path of [
      "/about",
      "/developers",
      "/mcp",
      "/status",
      "/terms",
      "/privacy",
      "/contact",
      "/signup",
    ]) {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(
        results.violations.map((violation) => violation.id),
        path,
      ).toEqual([]);
    }
  });
});

test.describe("light theme", () => {
  test.use({ colorScheme: "light" });

  test("light home and About pages pass axe", async ({ page }) => {
    const { default: AxeBuilder } = await import("@axe-core/playwright");
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    const home = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(home.violations).toEqual([]);

    await page.goto("/about");
    const about = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(about.violations).toEqual([]);
  });
});
