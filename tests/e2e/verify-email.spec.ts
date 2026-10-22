import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

test("emailed verification link verifies the account", async ({
  page,
  baseURL,
}) => {
  const email = `verify-${randomUUID()}@example.test`;
  const response = await page.request.post("/api/studio/register", {
    headers: { Origin: new URL(baseURL!).origin },
    data: {
      fullName: "Verify Operator",
      email,
      password: "VerifyPass1",
    },
  });
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as { devVerificationToken?: string };
  expect(body.devVerificationToken).toBeTruthy();

  await page.goto(`/verify-email?token=${body.devVerificationToken}`);
  await expect(
    page.getByRole("heading", { name: "You are ready." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open your studio" }),
  ).toBeVisible();
});
