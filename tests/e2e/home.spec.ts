import { expect, test } from "@playwright/test";

test("home tells the operator story and has no horizontal overflow", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Build the brand. Publish the platform. Keep the control.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Create your studio" }).first(),
  ).toBeVisible();
  await expect(page.locator(".home-stack-card")).toHaveCount(5);
  await expect(page.locator(".home-faq-list details")).toHaveCount(5);
  await expect(
    page.getByText("Credibility is a design decision."),
  ).toBeVisible();

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  const navBottom = await page
    .locator(".marketing-nav")
    .evaluate((element) => element.getBoundingClientRect().bottom);
  await page
    .locator(".marketing-footer-grid a", { hasText: "Product" })
    .click();
  await expect(page).toHaveURL(/#system$/);
  await page.waitForFunction(() => {
    const top = document.getElementById("system")?.getBoundingClientRect().top;
    return top !== undefined && top > 0 && top < 220;
  });
  const systemTop = await page
    .locator("#system h2")
    .evaluate((element) => element.getBoundingClientRect().top);
  expect(systemTop).toBeGreaterThanOrEqual(navBottom - 1);

  await page
    .locator(".marketing-footer-grid a", { hasText: "Pricing" })
    .click();
  await expect(page).toHaveURL(/#pricing$/);
  await page.waitForFunction(() => {
    const top = document.getElementById("pricing")?.getBoundingClientRect().top;
    return top !== undefined && top > 0 && top < 220;
  });
  const pricingTop = await page
    .locator("#pricing h2")
    .evaluate((element) => element.getBoundingClientRect().top);
  expect(pricingTop).toBeGreaterThanOrEqual(navBottom - 1);
});

test.describe("mobile home", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("stacks cleanly without horizontal overflow", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);
    await expect(
      page.getByRole("heading", {
        name: "Build the brand. Publish the platform. Keep the control.",
      }),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.locator(".home-stack-card").first()).toHaveCSS(
      "position",
      "relative",
    );

    await page.getByRole("button", { name: "Open navigation" }).click();
    await page
      .locator(".marketing-mobile-secondary a", { hasText: "Pricing" })
      .click();
    await expect(page.locator("#marketing-mobile-menu")).toHaveCount(0);
    await page.waitForFunction(() => {
      const top = document
        .getElementById("pricing")
        ?.getBoundingClientRect().top;
      return top !== undefined && top > 0 && top < 220;
    });
    const navBottom = await page
      .locator(".marketing-nav")
      .evaluate((element) => element.getBoundingClientRect().bottom);
    const pricingTop = await page
      .locator("#pricing h2")
      .evaluate((element) => element.getBoundingClientRect().top);
    expect(pricingTop).toBeGreaterThanOrEqual(navBottom - 1);
  });
});

test.describe("no JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("hero copy and reveal content remain visible", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: "Build the brand. Publish the platform. Keep the control.",
      }),
    ).toBeVisible();
    await expect(page.locator(".home-deriv-copy")).toHaveCSS("opacity", "1");
  });
});
