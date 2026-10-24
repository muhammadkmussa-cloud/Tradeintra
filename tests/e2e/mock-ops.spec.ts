import { expect, test } from "@playwright/test";

test("development mock domain, billing, and host workflows", async ({
  page,
}) => {
  await page.goto("/studio");
  await page.getByRole("button", { name: "Create site", exact: true }).click();
  const setup = page.getByRole("dialog");
  await setup.getByRole("button", { name: "Continue", exact: true }).click();
  await setup.getByLabel("Site name").fill("Mock Ops Site");
  await setup.getByRole("button", { name: "Continue", exact: true }).click();
  await setup.getByRole("button", { name: "Continue", exact: true }).click();
  await setup.getByLabel("Web address").fill("mock-ops-site");
  await setup.getByRole("button", { name: "Continue", exact: true }).click();
  await setup
    .getByRole("button", { name: "Save demo locally", exact: true })
    .click();
  await expect(setup).toHaveCount(0);
  await page.getByRole("button", { name: "Domains", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Domain desk." }),
  ).toBeVisible();
  await page.getByLabel("Search a domain").fill("acme");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByRole("cell", { name: "acme.com" })).toBeVisible();
  await page.getByRole("button", { name: "Buy domain" }).first().click();
  const ownedDomains = page.locator(".mock-table-wrap").nth(1);
  const acmeRow = ownedDomains.getByRole("row").filter({ hasText: "acme.com" });
  await expect(acmeRow.getByText("dns pending", { exact: true })).toBeVisible();
  await acmeRow.getByRole("button", { name: "Verify acme.com" }).click();
  await expect(acmeRow.getByText("ssl pending", { exact: true })).toBeVisible();
  await acmeRow.getByRole("button", { name: "Verify acme.com" }).click();
  await expect(
    acmeRow.getByText("active", { exact: true }).first(),
  ).toBeVisible();

  await page.getByLabel("Hostname").fill("operator.example");
  await page.getByRole("button", { name: "Activate mapping" }).click();
  await expect(page.getByText("operator.example").last()).toBeVisible();
  await expect(page.getByRole("button", { name: "Suspend" })).toBeVisible();
});

test("development mock bots, signals, marketplace, support, admin, and identity workflows", async ({
  page,
}) => {
  await page.goto("/studio");

  await page.getByRole("button", { name: "XML Bots", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Name", exact: true })
    .fill("Mock momentum");
  await page
    .getByRole("textbox", { name: "XML", exact: true })
    .fill('<xml><strategy name="mock" /></xml>');
  await page.getByRole("button", { name: "Store bot" }).click();
  await expect(page.getByText("Mock momentum")).toBeVisible();
  const botCard = page
    .locator(".mock-card")
    .filter({ hasText: "Mock momentum" });
  await botCard.getByRole("button", { name: "Validate" }).click();
  await expect(botCard.getByText("validated", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "AI Signals", exact: true }).click();
  await page.getByRole("button", { name: "Start 24h trial" }).click();
  await page.getByRole("button", { name: "Deliver now" }).click();
  await expect(page.getByText("sent").first()).toBeVisible();

  await page.getByRole("button", { name: "Marketplace", exact: true }).click();
  await page
    .locator(".mock-listing")
    .first()
    .getByRole("button", { name: "Buy mock" })
    .click();
  await expect(
    page.locator(".mock-listing").first().getByText("sold", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Earnings", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Earnings", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Request payout" }).click();
  await expect(page.getByText("requested").first()).toBeVisible();

  await page
    .getByRole("complementary")
    .getByRole("button", { name: "Help & resources", exact: true })
    .click();
  await page.getByLabel("Subject").fill("Mock ticket");
  await page.getByLabel("Message").fill("This is a development fixture.");
  await page.getByRole("button", { name: "Create ticket" }).click();
  await expect(page.getByText("Mock ticket")).toBeVisible();

  await page.getByRole("button", { name: "What’s new", exact: true }).click();
  await page.getByLabel("Title").fill("Mock notice");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page.getByText("Mock notice", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Publish", exact: true })
    .first()
    .click();
  await expect(page.getByText("published").first()).toBeVisible();

  await page.getByRole("button", { name: "Admin", exact: true }).click();
  await page.getByRole("button", { name: "Run tick" }).click();
  await expect(page.getByText("jobs.tick")).toBeVisible();
  await page.getByRole("button", { name: "Create backup" }).click();
  await expect(
    page.getByText("Mock database + storage snapshot"),
  ).toBeVisible();

  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Send verification" }).click();
  await expect(page.getByText("Verify your mock account")).toBeVisible();
  const identity = page
    .locator(".mock-panel")
    .filter({ hasText: "Identity lab" });
  await identity.getByRole("button", { name: "Verify email" }).click();
  await expect(identity.getByText("verified", { exact: true })).toBeVisible();
  await identity.getByRole("button", { name: "Enable 2FA" }).click();
  await expect(identity.getByText("enabled", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Request account deletion" }).click();
  await expect(
    page.getByRole("button", { name: "Cancel deletion" }),
  ).toBeVisible();
});
