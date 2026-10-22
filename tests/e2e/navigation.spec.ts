import { expect, test } from "@playwright/test";

test("primary navigation order, About page, and footer secondary links", async ({
  page,
}) => {
  await page.goto("/");
  const labels = await page
    .locator(".marketing-primary a")
    .evaluateAll((links) => links.map((link) => link.textContent?.trim()));
  expect(labels).toEqual([
    "Home",
    "About",
    "Developers",
    "Terms",
    "Privacy",
    "Contact",
  ]);

  await page
    .locator(".marketing-primary")
    .getByRole("link", { name: "About", exact: true })
    .click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(
    page.getByRole("heading", {
      name: "The surface behind your next chapter.",
    }),
  ).toBeVisible();

  await expect(
    page.locator(".marketing-footer-grid").getByRole("link", {
      name: "Product",
    }),
  ).toBeVisible();
  await expect(
    page.locator(".marketing-footer-grid").getByRole("link", {
      name: "Pricing",
    }),
  ).toBeVisible();
  await expect(
    page.locator(".marketing-footer-grid").getByRole("link", { name: "MCP" }),
  ).toBeVisible();
  await expect(
    page.locator(".marketing-footer-grid").getByRole("link", {
      name: "Status",
    }),
  ).toBeVisible();
});

test.describe("mobile navigation", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("drawer contains the approved links and closes", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation" }).click();
    const drawer = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(drawer.getByRole("link")).toHaveText([
      "Home",
      "About",
      "Developers",
      "Terms",
      "Privacy",
      "Contact",
    ]);
    await page.keyboard.press("Escape");
    await expect(page.locator("#marketing-mobile-menu")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Open navigation" }),
    ).toBeFocused();

    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("button", { name: "Close navigation" }).click();
    await expect(page.locator("#marketing-mobile-menu")).toHaveCount(0);
  });

  test("drawer closes when the viewport becomes desktop", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator("#marketing-mobile-menu")).toHaveCount(0);
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });
});

test.describe("short mobile viewport", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("drawer fits and scrolls inside the viewport", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation" }).click();
    const drawer = page.locator("#marketing-mobile-menu");
    await expect(drawer).toBeVisible();
    const metrics = await drawer.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        height: innerHeight,
        overflowY: getComputedStyle(element).overflowY,
      };
    });
    expect(metrics.bottom).toBeLessThanOrEqual(metrics.height);
    expect(metrics.overflowY).toBe("auto");
  });
});
