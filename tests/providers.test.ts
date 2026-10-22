import { afterEach, describe, expect, it, vi } from "vitest";
import { generateBotXml } from "../lib/server/providers/ai";
import {
  createCheckout,
  verifyWebhook,
} from "../lib/server/providers/payments";
import {
  MockDomainProvider,
  NamecheapDomainProvider,
} from "../lib/server/providers/domain";
import { sendEmail } from "../lib/server/providers/email";
import { sendTelegramMessage } from "../lib/server/providers/telegram";
import { sendPayout } from "../lib/server/providers/payouts";

afterEach(() => vi.unstubAllGlobals());

describe("provider adapters", () => {
  it("returns a deterministic mock bot without a DeepSeek key", async () => {
    process.env.DEEPSEEK_MODE = "mock";
    const result = await generateBotXml("range breakout", 10);
    expect(result.provider).toBe("mock");
    expect(result.credits).toBe(10);
    expect(result.xml).toContain("<xml>");
    expect(result.xml).toContain("range breakout");
    delete process.env.DEEPSEEK_MODE;
  });

  it("keeps the mock domain provider separate from unconfigured Namecheap", async () => {
    const mock = new MockDomainProvider();
    await expect(mock.search("acme.com")).resolves.toMatchObject({
      name: "acme.com",
      available: true,
    });
    await expect(mock.purchase("acme.com", 1, "key")).resolves.toMatchObject({
      status: "succeeded",
    });
    const live = new NamecheapDomainProvider({
      user: undefined,
      key: undefined,
      username: undefined,
      clientIp: undefined,
      env: "sandbox",
      baseUrl: undefined,
    });
    await expect(live.search("acme.com")).rejects.toThrow(/not configured/);
  });

  it("uses the mock email outbox when SMTP is not configured", async () => {
    process.env.SMTP_MODE = "mock";
    await expect(
      sendEmail({
        to: "operator@example.test",
        subject: "Verify",
        text: "Token",
      }),
    ).resolves.toMatchObject({ status: "mock" });
    delete process.env.SMTP_MODE;
  });

  it("uses the mock Telegram adapter without a bot token", async () => {
    process.env.TELEGRAM_MODE = "mock";
    await expect(sendTelegramMessage("@test", "Signal")).resolves.toMatchObject(
      {
        mode: "mock",
        status: "mock",
      },
    );
    delete process.env.TELEGRAM_MODE;
  });

  it("parses Namecheap XML for search, purchase, renew, and auto-renew", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: URL) => {
        const command = new URL(url).searchParams.get("Command");
        if (command === "namecheap.domains.check")
          return new Response(
            '<ApiResponse><DomainCheckResult Domain="acme.com" Available="true" IsPremium="false" /></ApiResponse>',
            { status: 200 },
          );
        if (command === "namecheap.domains.renew")
          return new Response(
            `<ApiResponse><DomainRenewResult Domain="acme.com" Renew="true" OrderId="renew-1" /></ApiResponse>`,
            {
              status: 200,
            },
          );
        if (command === "namecheap.domains.create")
          return new Response(
            `<ApiResponse><DomainCreateResult Domain="acme.com" Registered="true" OrderId="order-1" /></ApiResponse>`,
            {
              status: 200,
            },
          );
        return new Response("<ApiResponse />", { status: 200 });
      }),
    );
    const provider = new NamecheapDomainProvider({
      user: "user",
      key: "key",
      username: "user",
      clientIp: "203.0.113.10",
      env: "sandbox",
      baseUrl: "https://api.sandbox.namecheap.com/xml.response",
    });
    await expect(provider.search("acme.com")).resolves.toMatchObject({
      available: true,
      premium: false,
    });
    const contact = {
      firstName: "Test",
      lastName: "Operator",
      address1: "1 Example Street",
      city: "Nairobi",
      state: "Nairobi",
      postalCode: "00100",
      country: "KE",
      phone: "+254700000000",
      email: "operator@example.test",
    };
    await expect(
      provider.purchase("acme.com", 1, "key", contact),
    ).resolves.toMatchObject({
      providerOrderId: "order-1",
      status: "submitted",
    });
    await expect(provider.renew("acme.com", 1)).resolves.toMatchObject({
      providerOrderId: "renew-1",
    });
    await expect(provider.remove("acme.com")).resolves.toMatchObject({
      status: "submitted",
    });
  });

  it("executes a mock payout without a provider", async () => {
    process.env.PAYOUT_MODE = "mock";
    await expect(
      sendPayout({ method: "mpesa", amount: 10, reference: "payout-1" }),
    ).resolves.toMatchObject({ mode: "mock", status: "paid" });
    delete process.env.PAYOUT_MODE;
  });

  it("marks mock payments paid and accepts mock webhooks", async () => {
    const checkout = await createCheckout({
      provider: "mock",
      amount: 499,
      currency: "KES",
      reference: "credits-30",
      description: "30 AI credits",
    });
    expect(checkout).toMatchObject({
      provider: "mock",
      status: "paid",
      reference: "credits-30",
    });
    expect(verifyWebhook("paystack", null, "{}")).toBe(true);
  });

  it("disables client-selected mock payments outside mock mode", async () => {
    process.env.PAYMENT_MODE = "live";
    await expect(
      createCheckout({
        provider: "mock",
        amount: 8.99,
        currency: "USD",
        reference: "signal-mock",
        description: "Signal",
      }),
    ).rejects.toThrow(/disabled/);
    delete process.env.PAYMENT_MODE;
  });
});
