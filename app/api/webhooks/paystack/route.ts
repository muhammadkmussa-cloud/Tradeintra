import { NextRequest, NextResponse } from "next/server";
import { getStudioDb } from "@/lib/server/studio/database";
import { failPayment, settlePayment } from "@/lib/server/payments";
import { verifyWebhook } from "@/lib/server/providers/payments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  if (!verifyWebhook("paystack", signature, raw))
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  let body: {
    event?: string;
    data?: {
      id?: number | string;
      reference?: string;
      status?: string;
      amount?: number;
      currency?: string;
    };
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const reference = body.data?.reference;
  const eventId = `${body.event ?? "unknown"}:${body.data?.id ?? reference}`;
  if (!reference || !eventId)
    return NextResponse.json({ error: "Missing reference." }, { status: 400 });
  if (body.event === "charge.failed") {
    try {
      return NextResponse.json(
        await failPayment(
          await getStudioDb(),
          "paystack",
          reference,
          String(eventId),
          raw,
        ),
      );
    } catch {
      return NextResponse.json(
        { error: "Webhook processing failed." },
        { status: 503 },
      );
    }
  }
  if (body.event && body.event !== "charge.success")
    return NextResponse.json({ status: "ignored" });
  try {
    const result = await settlePayment(
      await getStudioDb(),
      "paystack",
      reference,
      String(eventId),
      raw,
      typeof body.data?.amount === "number" &&
        typeof body.data?.currency === "string"
        ? { amount: body.data.amount, currency: body.data.currency }
        : undefined,
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 503 },
    );
  }
}
