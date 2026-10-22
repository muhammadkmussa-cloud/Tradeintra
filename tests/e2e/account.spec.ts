import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
const password = "Unique local test password 2026";
const email = () => `browser-${randomUUID()}@example.test`;
async function createAccount(
  page: import("@playwright/test").Page,
  address: string,
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
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Link mock account", exact: true })
    .click();
  await expect(page.getByText("Mock linked", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
}
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
  await dialog.getByLabel("Hero headline").fill("The published first chapter.");
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await dialog.getByLabel("About & contact").uncheck();
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await dialog.getByLabel("Subdomain").fill(slug);
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await dialog
    .getByRole("button", { name: "Publish mock snapshot", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  let card = page.locator(".site-card").filter({
    has: page.getByRole("heading", { name: "My server brand", exact: true }),
  });
  await expect(card.getByText("Mock published", { exact: true })).toBeVisible();
  const publicPage = await context.newPage();
  await publicPage.goto(`/sites/${slug}`);
  await expect(
    publicPage.getByRole("heading", { name: "The published first chapter." }),
  ).toBeVisible();
  await expect(
    publicPage.getByRole("heading", { name: "Risk disclosure" }),
  ).toBeVisible();
  await expect(
    publicPage.getByRole("heading", { name: "About My server brand" }),
  ).toHaveCount(0);
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
  await dialog.getByLabel("Hero headline").fill("The private second chapter.");
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
    .getByRole("button", { name: "Publish mock snapshot", exact: true })
    .click();
  await expect(page.locator(".toast")).toContainText("Mock snapshot published");
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
  await page.getByRole("button", { name: "Billing", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "AI credit packs" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Buy credits" }).first().click();
  await expect(page.getByText("60 credits", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "AI Bot Generator", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Generate a bot" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Generate · 10 credits/ }).click();
  await expect(
    page.getByText("Mock bot generated and 10 credits debited."),
  ).toBeVisible();
  await page.getByRole("button", { name: "XML Bots", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bot library" }),
  ).toBeVisible();
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
  await page.getByRole("button", { name: "Sites", exact: true }).click();
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
    .getByRole("button", { name: "Publish mock snapshot", exact: true })
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
