import { expect, test } from "@playwright/test";

test("shared demo trading workspace is branded, simulated, and operable", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/trade?name=Aurora%20Markets&accent=B08D57&theme=light");
  await expect(page.getByText("Aurora Markets · Demo")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("#balance")).toHaveText("$10,000.00");
  await expect(page.locator(".demo-ribbon")).toContainText("DEMO ONLY");
  await expect(
    page.getByRole("heading", { name: "Good to see you." }),
  ).toBeVisible();
  await expect(page.locator("#overview-balance")).toHaveText("$10,000.00");

  await page.getByRole("button", { name: "Sign in with Deriv" }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", {
      name: "Open this from a published site to sign in.",
    }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Continue in demo" }).click();
  await expect(dialog).not.toBeVisible();

  await page.locator('aside.app-rail [data-route="trade"]').click();
  await expect(page).toHaveURL(/#trade$/);
  await expect(
    page.locator('aside.app-rail [data-route="trade"]'),
  ).toHaveAttribute("aria-current", "page");
  await page.getByLabel("Duration").selectOption("5");
  await page.getByRole("button", { name: /Rise/ }).click();
  await expect(page.getByText("1 open", { exact: false })).toBeVisible();
  await expect(page.getByText("RISE Volatility 100 Index")).toBeVisible();
  await expect(page.locator("#balance")).toHaveText("$9,990.00");

  await page.locator('aside.app-rail [data-route="reports"]').click();
  await expect(page.locator("#history .history-row")).toHaveCount(2, {
    timeout: 15000,
  });
  expect(errors).toEqual([]);

  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.locator("#balance")).toHaveText("$10,000.00");

  await page.locator('aside.app-rail [data-route="strategies"]').click();
  await page.getByRole("button", { name: "recovery" }).click();
  await expect(page.locator(".strategy-card")).toHaveCount(4);
  await expect(page.locator(".strategy-card a").first()).toHaveAttribute(
    "href",
    /\/deriv-presets\//,
  );
  await page.locator('aside.app-rail [data-route="signals"]').click();
  await expect(page.locator(".signal-card")).toHaveCount(4);
  await page.locator('aside.app-rail [data-route="learn"]').click();
  await expect(
    page.getByRole("heading", { name: "Risk before action." }),
  ).toBeVisible();
  await page.locator('aside.app-rail [data-route="settings"]').click();
  await expect(
    page.getByRole("heading", { name: "Demo settings" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Warm paper" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Deep ink" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.setViewportSize({ width: 360, height: 800 });
  await expect(page.locator(".mobile-nav")).toBeVisible();
  await page.locator('.mobile-nav [data-route="overview"]').click();
  await expect(
    page.getByRole("heading", { name: "Good to see you." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  const { default: AxeBuilder } = await import("@axe-core/playwright");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test("default accent passes axe on desktop and mobile", async ({ page }) => {
  await page.goto("/trade?theme=light#overview");
  await expect(
    page.getByRole("heading", { name: "Good to see you." }),
  ).toBeVisible();
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  const scan = async () =>
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations;
  expect(await scan()).toEqual([]);
  await page.setViewportSize({ width: 360, height: 800 });
  await expect(page.locator(".mobile-nav")).toBeVisible();
  expect(await scan()).toEqual([]);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(
    "/trade?site=steel&name=Steel%20Desk&accent=315A7D&theme=dark#overview",
  );
  expect(await scan()).toEqual([]);
});

test("live prices do not steal focus from the watchlist", async ({ page }) => {
  await page.goto("/trade#trade");
  const firstMarket = page.locator("#market-list .market-button").first();
  await firstMarket.focus();
  await expect(firstMarket).toBeFocused();
  await page.waitForTimeout(2600);
  await expect(firstMarket).toBeFocused();
});
