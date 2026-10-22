import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

test("public marketing, signup, email verification, and Google mock sign-in", async ({
  page,
}) => {
  const address = `public-${randomUUID()}@example.test`;
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Build the brand. Publish the platform. Keep the control.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Sign up" }).first(),
  ).toBeVisible();

  await page.getByRole("link", { name: "Sign up" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Start your studio." }),
  ).toBeVisible();
  await page.getByLabel("Full name").fill("Public Operator");
  await page.getByLabel("Email").fill(address);
  await page.getByLabel("Password").fill("PublicPass1");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    page.getByRole("button", { name: "Verify email and continue" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Verify email and continue" }).click();
  await expect(page).toHaveURL(/\/studio$/);
  await expect(
    page.getByRole("heading", { name: "Your operator desk." }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByText("Public Operator", { exact: false })).toHaveCount(
    0,
  );

  await page.goto("/login");
  await page.getByRole("link", { name: "Continue with Google" }).click();
  await expect(page).toHaveURL(/\/studio$/);
  await expect(
    page.getByText("Server-backed mock account", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(
    page.getByText("mock-google@example.test", { exact: true }),
  ).toBeVisible();
});

test("public marketing, login, and signup pages have no automated WCAG A/AA violations", async ({
  page,
}) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  for (const path of [
    "/",
    "/about",
    "/login",
    "/signup",
    "/contact",
    "/developers",
    "/mcp",
    "/status",
    "/terms",
    "/privacy",
  ]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.map((violation) => ({
        id: violation.id,
        targets: violation.nodes.map((node) => node.target),
      })),
      path,
    ).toEqual([]);
  }
});
