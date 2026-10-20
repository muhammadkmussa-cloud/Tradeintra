import { describe, expect, it } from "vitest";
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
});
