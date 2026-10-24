import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
const password = "Unique local test password 2026";
const email = () => `browser-${randomUUID()}@example.test`;
async function createAccount(
  page: import("@playwright/test").Page,
  address: string,
  linkDeriv = true,
) {
  await page.goto("/studio");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Full name").fill("Test Operator");
  await dialog.getByLabel("Email", { exact: true }).fill(address);
  await dialog.getByLabel("Password", { exact: true }).fill(password);
  await dialog
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Verify email", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Verify email", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 30000 });
  if (linkDeriv) {
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page
      .getByRole("button", { name: "Link mock account", exact: true })
      .click();
    await expect(page.getByText("Mock linked", { exact: true })).toBeVisible();
  }
  await page.getByRole("button", { name: "My Site", exact: true }).click();
}

test("site creation requires a linked Deriv account", async ({ page }) => {
  await createAccount(page, email(), false);
  await page.getByRole("button", { name: "Create site", exact: true }).click();
  await expect(
    page.getByText("Link a mock Deriv account before creating your site."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
});
test("account → template → brand → modules → public mock snapshot → private edit → restore → sign out and back in", async ({
  page,
  context,
}) => {
  const address = email();
  const slug = `brand-${randomUUID().slice(0, 8)}`;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await createAccount(page, address);
  await expect(page.locator(".site-card")).toHaveCount(0);
  await page.setViewportSize({ width: 360, height: 800 });
  const cookie = (await context.cookies()).find(
    (c) => c.name === "tradeintra_session",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  await page.getByRole("button", { name: "Create site", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await dialog.getByLabel("Site name").fill("My server brand");
  await dialog.getByLabel("Big title").fill("The published first chapter.");
  await dialog.getByRole("button", { name: "Use Forest colour" }).click();
  await dialog.getByRole("button", { name: "Live preview" }).click();
  await expect(dialog.locator(".live-preview-canvas h1")).toHaveText(
    "The published first chapter.",
  );
  await expect(
    dialog.locator(".live-preview-canvas .poc-button").first(),
  ).toHaveCSS("background-color", "rgb(47, 107, 79)");
  await dialog.getByRole("button", { name: "Edit", exact: true }).click();
  await dialog.getByLabel("Upload logo").setInputFiles({
    name: "logo.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zt9sAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(dialog.locator(".logo-preview img")).toBeVisible();
  await expect(dialog.locator(".logo-preview img")).toHaveAttribute(
    "src",
    /^data:image\/(webp|png);base64,/,
  );
  await dialog.getByRole("button", { name: "Warm paper", exact: true }).click();
  await dialog.getByRole("button", { name: "Live preview" }).click();
  await expect(
    dialog.locator(".live-preview-canvas .poc-site"),
  ).toHaveAttribute("data-site-theme", "light");
  await expect(
    dialog.locator(".live-preview-canvas .poc-brand-logo"),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Edit", exact: true }).click();
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await dialog.getByRole("checkbox", { name: /About/ }).uncheck();
  await expect(dialog.getByText("One per line", { exact: false })).toHaveCount(
    0,
  );
  await dialog.locator("summary").filter({ hasText: "Testimonials" }).click();
  await dialog.getByRole("button", { name: "Add a testimonial" }).click();
  const quoteField = dialog.getByLabel("Quote", { exact: true });
  await quoteField.fill("Clear and direct");
  await dialog.getByLabel("Name", { exact: true }).click();
  await dialog.getByLabel("Name", { exact: true }).fill("Ada");
  await dialog.getByLabel("Role", { exact: true }).click();
  await dialog.getByLabel("Role", { exact: true }).fill("Trader");
  await dialog
    .locator("summary")
    .filter({ hasText: "What your site offers" })
    .click();
  await dialog.getByRole("button", { name: "Add another card" }).click();
  await dialog.getByLabel("Card title").last().fill("Operator notes");
  await dialog.getByLabel("What it says").last().fill("A clear weekly note.");
  await dialog.getByRole("button", { name: "Live preview" }).click();
  await expect(
    dialog.locator(".live-preview-canvas").getByText("Operator notes"),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Edit", exact: true }).click();
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await dialog.getByLabel("Web address").fill(slug);
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await dialog
    .getByRole("button", { name: "Save demo version", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  let card = page.locator(".site-card").filter({
    has: page.getByRole("heading", { name: "My server brand", exact: true }),
  });
  await expect(card.getByText("Mock published", { exact: true })).toBeVisible();
  const publicPage = await context.newPage();
  await publicPage.goto(`/sites/${slug}`);
  await expect(publicPage.locator(".poc-site")).toHaveAttribute(
    "data-site-theme",
    "light",
  );
  await expect(
    publicPage.getByRole("heading", { name: "The published first chapter." }),
  ).toBeVisible();
  await expect(
    publicPage.getByRole("heading", { name: "Risk disclosure" }),
  ).toBeVisible();
  await expect(publicPage.getByText("Clear and direct")).toBeVisible();
  await expect(publicPage.getByText("Operator notes")).toBeVisible();
  await expect(publicPage.getByAltText("My server brand logo")).toBeVisible();
  const logoResponse = await page.request.get(`/api/site-logo/${slug}`);
  expect(logoResponse.status()).toBe(200);
  expect(logoResponse.headers()["content-type"]).toMatch(/^image\//);
  const tradeLink = publicPage
    .getByRole("link", { name: "Open demo trading" })
    .first();
  await expect(tradeLink).toHaveAttribute(
    "href",
    new RegExp(`^/trade\\?site=${slug}`),
  );
  const appPage = await context.newPage();
  await appPage.goto((await tradeLink.getAttribute("href")) ?? "/trade");
  await expect(appPage.locator("#brand-logo")).toBeVisible();
  await expect(appPage.locator("#brand-logo")).toHaveAttribute(
    "src",
    new RegExp(`/api/site-logo/${slug}$`),
  );
  await appPage.getByRole("button", { name: "Sign in with Deriv" }).click();
  await expect(
    appPage.getByRole("button", { name: "Sign out of Deriv" }),
  ).toBeVisible();
  await expect(appPage.locator("#account-mode")).toHaveText(
    "Deriv demo session",
  );
  await expect(appPage.locator("#operator-name")).toHaveText(
    "My server brand · Demo",
  );
  await appPage.getByRole("button", { name: "Sign out of Deriv" }).click();
  await expect(
    appPage.getByRole("button", { name: "Sign in with Deriv" }),
  ).toBeVisible();
  await appPage.close();
  await expect(
    publicPage.getByRole("heading", { name: "About My server brand" }),
  ).toHaveCount(0);
  await expect(
    publicPage.locator(".poc-strategy-card").first(),
  ).toHaveAttribute("href", /\/deriv-presets\//);
  await publicPage.getByRole("tab", { name: "Markets" }).click();
  await expect(
    publicPage.getByRole("tab", { name: "Markets" }),
  ).toHaveAttribute("aria-selected", "true");
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  expect(
    (
      await new AxeBuilder({ page: publicPage })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.reload();
  await expect(card).toBeVisible();
  const demo = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("tradeintra-studio-v1") || "{}"),
  );
  expect(JSON.stringify(demo)).not.toContain("My server brand");
  await card.getByRole("button", { name: "Manage", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await dialog.getByLabel("Big title").fill("The private second chapter.");
  await dialog.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await publicPage.reload();
  await expect(
    publicPage.getByRole("heading", { name: "The published first chapter." }),
  ).toBeVisible();
  await card
    .getByRole("button", { name: "Actions for My server brand" })
    .click();
  await page
    .getByRole("button", { name: "Save demo version", exact: true })
    .click();
  await expect(page.locator(".toast")).toContainText("Demo version saved");
  await publicPage.reload();
  await expect(
    publicPage.getByRole("heading", { name: "The private second chapter." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Publish status", exact: true })
    .click();
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm", exact: true })
    .click();
  await expect(page.getByText("Version 3 · Restored from v1")).toBeVisible();
  await publicPage.reload();
  await expect(
    publicPage.getByRole("heading", { name: "The published first chapter." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByText(address, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Domains", exact: true }).click();
  const domainName = `${slug}.com`;
  await page.getByLabel("Search a domain").fill(domainName);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByRole("cell", { name: domainName })).toBeVisible();
  await page.getByRole("button", { name: "Buy domain" }).first().click();
  await expect(page.getByText("dns pending", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Verify" }).first().click();
  await expect(page.getByText("ssl pending", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Verify" }).first().click();
  await expect(page.getByText("active", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "XML Bots", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Deriv presets" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Load preset" }).first().click();
  await expect(page.getByRole("textbox", { name: "XML" })).toHaveValue(/<xml/);
  await expect(
    page.getByRole("heading", { name: "Bot library" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Earnings", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Deriv commission statements" }),
  ).toBeVisible();
  await page.getByLabel("CSV statement").setInputFiles({
    name: "deriv-october.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("gross_commission\n300.00\n"),
  });
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(
    page.getByText("Commission statement submitted for Finance review."),
  ).toBeVisible();
  await expect(page.getByText("300.00", { exact: false }).last()).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Earnings", exact: true }).click();
  await expect(page.getByText("$45.00 in review")).toBeVisible();
  await page.getByRole("button", { name: "Marketplace", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Seller profile" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Apply as seller" }).click();
  await expect(
    page.getByText("Seller application submitted for review."),
  ).toBeVisible();
  await page.getByRole("button", { name: "AI Signals", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Create signal order" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start trial" }).click();
  await expect(page.getByText("Signal trial created.")).toBeVisible();
  await page.getByRole("button", { name: "Deliver now" }).click();
  await expect(page.getByText("Mock signal delivered.")).toBeVisible();
  await page
    .getByRole("complementary")
    .getByRole("button", { name: "Help & resources", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Open a ticket" }),
  ).toBeVisible();
  await page.getByLabel("Subject").fill("Mock support request");
  await page.getByLabel("Message").fill("Please review this fixture.");
  await page.getByRole("button", { name: "Create ticket" }).click();
  await expect(page.getByText("Support ticket created.")).toBeVisible();
  await page
    .getByRole("complementary")
    .getByRole("button", { name: "What’s new", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Create announcement" }),
  ).toBeVisible();
  await page.getByLabel("Title").fill("Mock announcement");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page.getByText("Announcement drafted.")).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByText(/^TRD-[A-F0-9]{8}$/)).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Create account", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Email", { exact: true }).fill(address);
  await dialog.getByLabel("Password", { exact: true }).fill(password);
  await dialog.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole("button", { name: "My Site", exact: true }).click();
  await expect(card).toBeVisible();
  expect(errors).toEqual([]);
  await publicPage.close();
});

test("HTTP authentication, CSRF, tenant ownership, validation and public-draft isolation", async ({
  page,
  browser,
  baseURL,
}) => {
  await createAccount(page, email());
  const contextB = await browser.newContext({ baseURL });
  const pageB = await contextB.newPage();
  await createAccount(pageB, email());
  const a = await (await page.request.get("/api/studio/session")).json();
  const b = await (await pageB.request.get("/api/studio/session")).json();
  expect(a.user.id).not.toBe(b.user.id);
  const origin = baseURL!;
  const config = {
    name: "Private owner site",
    slug: `isolated-${randomUUID().slice(0, 8)}`,
    color: "#B5A0EA",
    headline: "Not published.",
    description: "Private draft.",
    modules: ["about"],
  };
  const save = await page.request.post("/api/studio/action", {
    headers: { Origin: origin },
    data: {
      kind: "save",
      revision: a.revision,
      operationId: randomUUID(),
      config,
      publish: false,
    },
  });
  expect(save.status()).toBe(200);
  const state = await save.json();
  const id = state.studio.sites[0].id;
  expect((await page.request.get(`/sites/${config.slug}`)).status()).toBe(404);
  const forbidden = await pageB.request.post("/api/studio/action", {
    headers: { Origin: origin },
    data: {
      kind: "publish",
      id,
      revision: b.revision,
      operationId: randomUUID(),
    },
  });
  expect(forbidden.status()).toBe(404);
  expect(
    (
      await page.request.post("/api/studio/action", {
        headers: { Origin: "https://evil.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await pageB.request.post("/api/studio/action", {
        headers: { Origin: origin },
        data: {
          kind: "save",
          config: { ...config, slug: "new-safe-slug", script: "alert(1)" },
          revision: b.revision,
          operationId: randomUUID(),
          publish: true,
        },
      })
    ).status(),
  ).toBe(422);
  const cookie = await page.context().cookies();
  const rawToken = cookie.find((c) => c.name === "tradeintra_session")?.value;
  expect(JSON.stringify(state)).not.toContain(rawToken);
  const unauth = await browser.newContext({ baseURL });
  expect(
    (
      await unauth.request.post("/api/studio/action", {
        headers: { Origin: origin },
        data: { kind: "publish", id, revision: 0, operationId: randomUUID() },
      })
    ).status(),
  ).toBe(401);
  await unauth.close();
  // Regression: an expired-session refresh must never copy private account state
  // into the anonymous demo's localStorage.
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Private owner site", exact: true }),
  ).toBeVisible();
  await page.route("**/api/studio/action", (route) =>
    route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({
        error: "Workspace changed.",
        code: "STALE_WORKSPACE",
      }),
    }),
  );
  await page.route("**/api/studio/session", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: null, enabled: true, mode: "local" }),
    }),
  );
  await page
    .getByRole("button", { name: "Actions for Private owner site" })
    .click();
  await page
    .getByRole("button", { name: "Save demo version", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByText(/Your session ended/),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("tradeintra-studio-v1")),
  ).not.toContain("Private owner site");
  await contextB.close();
});

test("development account form is keyboard-operable and accessible on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/studio");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  const dialog = page.getByRole("dialog");
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await dialog.getByLabel("Email", { exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(dialog.getByLabel("Password", { exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
