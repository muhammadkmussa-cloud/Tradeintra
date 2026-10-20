import { expect, test } from "@playwright/test";

const adminEmail = "admin@example.test";
const adminPassword = "AdminPass1";

async function ensureAdmin(page: import("@playwright/test").Page) {
  await page.goto("/");
  const origin = new URL(page.url()).origin;
  const register = await page.request.post("/api/studio/register", {
    headers: { Origin: origin },
    data: {
      fullName: "Super Admin",
      email: adminEmail,
      password: adminPassword,
    },
  });
  let body = await register.json();
  if (register.status() === 409) {
    const login = await page.request.post("/api/studio/login", {
      headers: { Origin: origin },
      data: { email: adminEmail, password: adminPassword },
    });
    expect(login.ok()).toBeTruthy();
    body = await login.json();
  } else {
    expect(register.ok()).toBeTruthy();
  }
  if (body.devVerificationToken) {
    const verify = await page.request.post("/api/studio/verify-email", {
      headers: { Origin: origin },
      data: { token: body.devVerificationToken },
    });
    expect(verify.ok()).toBeTruthy();
  }
}

test("allowlisted Super Admin can open the commerce review screen", async ({
  page,
}) => {
  await ensureAdmin(page);
  await page.goto("/studio");
  await page.getByRole("button", { name: "Admin", exact: true }).click();
  await expect(page.getByText("SUPER ADMIN / COMMERCE REVIEW")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Seller approvals" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Payout review" }),
  ).toBeVisible();
});
