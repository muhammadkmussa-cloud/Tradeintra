import { createHmac, timingSafeEqual } from "node:crypto";

export type PaymentProvider = "paystack" | "mpesa" | "mock";
export type PaymentMode = "mock" | "sandbox" | "live";
export type CheckoutRequest = {
  provider: PaymentProvider;
  amount: number;
  currency: "USD" | "KES";
  reference: string;
  description: string;
  email?: string;
  phone?: string;
};
export type CheckoutResult = {
  id: string;
  provider: PaymentProvider;
  status: "pending" | "paid" | "failed";
  checkoutUrl: string | null;
  reference: string;
};

export function paymentMode(): PaymentMode {
  const mode = (process.env.PAYMENT_MODE ?? "mock").toLowerCase();
  return mode === "sandbox" || mode === "live" ? mode : "mock";
}

function configured(provider: Exclude<PaymentProvider, "mock">) {
  if (provider === "paystack") return Boolean(process.env.PAYSTACK_SECRET_KEY);
  return Boolean(
    process.env.MPESA_CONSUMER_KEY &&
    process.env.MPESA_CONSUMER_SECRET &&
    process.env.MPESA_SHORTCODE,
  );
}

export async function createCheckout(
  request: CheckoutRequest,
): Promise<CheckoutResult> {
  const mode = (
    process.env.PAYMENT_MODE ?? "mock"
  ).toLowerCase() as PaymentMode;
  if (request.provider === "mock") {
    if (mode !== "mock")
      throw new Error("Mock payments are disabled outside mock mode.");
    return {
      id: `mock-${request.reference}`,
      provider: "mock",
      status: "paid",
      checkoutUrl: null,
      reference: request.reference,
    };
  }
  if (mode === "mock")
    return {
      id: `mock-${request.reference}`,
      provider: request.provider,
      status: "paid",
      checkoutUrl: null,
      reference: request.reference,
    };
  if (!configured(request.provider as Exclude<PaymentProvider, "mock">))
    throw new Error(`${request.provider} credentials are not configured.`);
  if (request.provider === "paystack") {
    if (!request.email) throw new Error("Paystack requires a customer email.");
    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        signal: AbortSignal.timeout(20000),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
        body: JSON.stringify({
          email: request.email,
          amount: Math.round(request.amount * 100),
          currency: request.currency,
          reference: request.reference,
          callback_url: process.env.APP_URL
            ? `${process.env.APP_URL}/studio`
            : undefined,
        }),
      },
    );
    const body = (await response.json()) as {
      status?: boolean;
      data?: { authorization_url?: string };
      message?: string;
    };
    if (!response.ok || !body.status || !body.data?.authorization_url)
      throw new Error(body.message ?? "Paystack checkout failed.");
    return {
      id: request.reference,
      provider: "paystack",
      status: "pending",
      checkoutUrl: body.data.authorization_url,
      reference: request.reference,
    };
  }
  if (!request.phone)
    throw new Error("M-Pesa requires a customer phone number.");
  const base = (
    process.env.MPESA_BASE_URL ?? "https://sandbox.safaricom.co.ke"
  ).replace(/\/$/, "");
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`,
  ).toString("base64");
  const tokenResponse = await fetch(
    `${base}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${auth}` },
      signal: AbortSignal.timeout(20000),
    },
  );
  const tokenBody = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenBody.access_token) throw new Error("M-Pesa token request failed.");
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);
  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`,
  ).toString("base64");
  const stk = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    signal: AbortSignal.timeout(20000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenBody.access_token}`,
    },
    body: JSON.stringify({
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.max(
        1,
        Math.round(
          request.amount * (Number(process.env.MPESA_USD_KES_RATE) || 130),
        ),
      ),
      PartyA: request.phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: request.phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: request.reference,
      TransactionDesc: request.description.slice(0, 80),
    }),
  });
  const stkBody = (await stk.json()) as {
    CheckoutRequestID?: string;
    ResponseCode?: string;
    errorMessage?: string;
  };
  if (!stk.ok || stkBody.ResponseCode !== "0" || !stkBody.CheckoutRequestID)
    throw new Error(stkBody.errorMessage ?? "M-Pesa checkout failed.");
  return {
    id: stkBody.CheckoutRequestID,
    provider: "mpesa",
    status: "pending",
    checkoutUrl: null,
    reference: request.reference,
  };
}

export function verifyWebhook(
  provider: Exclude<PaymentProvider, "mock">,
  signature: string | null,
  payload: string,
) {
  const mode = (process.env.PAYMENT_MODE ?? "mock").toLowerCase();
  if (mode === "mock") return true;
  if (!signature) return false;
  if (provider === "paystack") {
    if (!process.env.PAYSTACK_SECRET_KEY) return false;
    const expected = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(payload)
      .digest();
    const received = Buffer.from(signature, "hex");
    return (
      received.length === expected.length && timingSafeEqual(received, expected)
    );
  }
  return false;
}
