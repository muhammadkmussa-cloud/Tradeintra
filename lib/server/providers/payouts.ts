export type PayoutMode = "mock" | "live";
export type PayoutMethod = "mpesa" | "bank" | "crypto";
export type PayoutResult = {
  mode: PayoutMode;
  status: "paid" | "submitted";
  providerReference: string;
};

export function payoutMode(): PayoutMode {
  const configured = (process.env.PAYOUT_MODE ?? "").toLowerCase();
  if (configured === "live") return "live";
  if (configured === "mock") return "mock";
  return process.env.MPESA_CONSUMER_KEY || process.env.PAYSTACK_SECRET_KEY
    ? "live"
    : "mock";
}

export async function sendPayout(input: {
  method: PayoutMethod;
  amount: number;
  reference: string;
}): Promise<PayoutResult> {
  const mode = payoutMode();
  if (mode === "mock")
    return {
      mode: "mock",
      status: "paid",
      providerReference: `mock-payout-${input.reference}`,
    };
  if (input.method === "mpesa")
    throw new Error(
      "M-Pesa B2C payout execution requires a production initiator/security credential and is not enabled.",
    );
  if (input.method === "bank" || input.method === "crypto")
    throw new Error(
      "Live bank/crypto payout execution is not configured. Use the mock provider or Finance manual transfer.",
    );
  throw new Error("Unsupported payout method.");
}
