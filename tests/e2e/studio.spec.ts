import { test, expect } from "@playwright/test";

test("create → customize → validate → publish → persist → restore", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/studio");
  await expect(
    page.getByRole("heading", { name: "Your operator desk." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create site", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    dialog.getByText("Enter a site name between 1 and 60 characters."),
  ).toBeVisible();
  await dialog.getByLabel("Site name").fill("Kisii Markets");
  await dialog.getByLabel("Hero headline").fill("A new perspective.");
  await dialog.getByRole("button", { name: "Use Forest accent" }).click();
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await dialog.getByLabel("About & contact").uncheck();
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await dialog.getByLabel("Subdomain").fill("admin");
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    dialog.getByText("This subdomain is reserved. Try another name."),
  ).toBeVisible();
  await dialog.getByLabel("Subdomain").fill("kisii-markets");
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(dialog.getByText("2 enabled")).toBeVisible();
  await dialog
    .getByRole("button", { name: "Publish locally", exact: true })
    .click();
  const card = page.locator(".site-card").filter({
    has: page.getByRole("heading", { name: "Kisii Markets", exact: true }),
  });
  await expect(
    card.getByText("Local published", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Manage", exact: true }).click();
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await dialog.getByLabel("Hero headline").fill("Our second chapter.");
  await dialog.getByRole("button", { name: "Save draft", exact: true }).click();
  await card.getByRole("button", { name: "Actions for Kisii Markets" }).click();
  await page
    .getByRole("button", { name: "Publish locally", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish status", exact: true })
    .click();
  await expect(page.getByText("Version 2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByText("Version 3 · Restored from v1")).toBeVisible();
  await page.getByRole("button", { name: "View", exact: true }).first().click();
  await expect(
    dialog.getByRole("heading", { name: "A new perspective." }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "About Kisii Markets" }),
  ).toHaveCount(0);
  await expect(
    dialog.getByText(/Trading involves significant risk/),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Mobile preview" }).click();
  await expect(page.locator(".full-site-preview")).toHaveClass(
    /mobile-preview/,
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("search, mock linking, discard warning, and delete confirmation", async ({
  page,
}) => {
  await page.goto("/studio");
  await page.getByRole("button", { name: "Sites", exact: true }).click();
  await page.getByPlaceholder("Search sites…").fill("missing");
  await expect(page.getByText("No matching sites")).toBeVisible();
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await expect(page.locator(".site-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Link mock account", exact: true })
    .click();
  await expect(page.getByText("Mock linked", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Disconnect mock account" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sites", exact: true }).click();
  await page.getByRole("button", { name: "Create site", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "Leave the editor?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stay", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Configure the site." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await page
    .getByRole("button", { name: "Actions for Aurora Markets" })
    .click();
  await page.getByRole("button", { name: "Delete site", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Delete Aurora Markets?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.locator(".site-card")).toHaveCount(1);
});

test("mobile navigation and responsive widths do not overflow", async ({
  page,
}) => {
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/studio");
    await expect(
      page.getByRole("heading", { name: "Your operator desk." }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Domains", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Domain desk." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("key desktop screens and wizard have no automated WCAG A/AA violations", async ({
  page,
}) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  await page.goto("/studio");
  await expect(
    page.getByRole("heading", { name: "Your operator desk." }),
  ).toBeVisible();
  for (const name of [
    "Overview",
    "Sites",
    "Templates",
    "Domains",
    "Publish status",
    "Billing",
    "XML Bots",
    "AI Bot Generator",
    "AI Signals",
    "Marketplace",
    "Earnings",
    "Announcements",
    "Settings",
    "Support",
    "Admin",
  ]) {
    if (name === "Support")
      await page
        .getByRole("complementary")
        .getByRole("button", { name: "Help & resources", exact: true })
        .click();
    else if (name === "Announcements")
      await page
        .getByRole("complementary")
        .getByRole("button", { name: "What’s new", exact: true })
        .click();
    else await page.getByRole("button", { name, exact: true }).click();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
      name,
    ).toEqual([]);
  }
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Create site", exact: true }).click();
  for (let i = 0; i < 5; i++) {
    if (i === 1)
      await page
        .getByRole("dialog")
        .getByLabel("Site name")
        .fill("Accessible Studio");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
      `Wizard step ${i}`,
    ).toEqual([]);
    if (i < 4)
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Continue", exact: true })
        .click();
  }
});

test("liveness is redacted and staging tenant pages are off by default", async ({
  request,
}) => {
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  expect(health.headers()["cache-control"]).toBe("no-store");
  expect(await health.json()).toEqual({
    service: "tradeintra",
    status: "ok",
    derivMode: "mock",
    studioPersistence: "browser-local",
    accountMode: "local",
    stagingPoc: false,
  });
  expect((await request.get("/poc-tenant/aurora")).status()).toBe(404);
});
