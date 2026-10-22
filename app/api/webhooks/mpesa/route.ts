import { NextRequest, NextResponse } from "next/server";
import { getStudioDb } from "@/lib/server/studio/database";
import { failPayment, settlePayment } from "@/lib/server/payments";
import { paymentMode } from "@/lib/server/providers/payments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.MPESA_CALLBACK_SECRET;
  if (paymentMode() !== "mock" && !secret)
    return NextResponse.json(
      { error: "M-Pesa callback secret is not configured." },
      { status: 503 },
    );
  if (secret) {
    const supplied =
      request.nextUrl.searchParams.get("token") ??
      request.headers.get("x-mpesa-callback-token") ??
      "";
    if (supplied !== secret)
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const allowed = (process.env.MPESA_ALLOWED_IPS ?? "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);
  if (allowed.length) {
    const ip = (
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      ""
    )
      .split(",")[0]
      .trim();
    if (!allowed.includes(ip))
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const raw = await request.text();
  let body: {
    reference?: string;
    eventId?: string;
    status?: string;
    Body?: {
      stkCallback?: {
        CheckoutRequestID?: string;
        ResultCode?: number;
        CallbackMetadata?: {
          Item?: { Name?: string; Value?: string | number }[];
        };
      };
    };
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const callback = body.Body?.stkCallback;
  const reference = body.reference ?? callback?.CheckoutRequestID;
  const eventId = `${
    callback && callback.ResultCode !== 0 ? "failed" : "success"
  }:${
    body.eventId ??
    callback?.CallbackMetadata?.Item?.find(
      (item) => item.Name === "MpesaReceiptNumber",
    )?.Value ??
    callback?.CheckoutRequestID
  }`;
  if (!reference || !eventId)
    return NextResponse.json({ error: "Missing reference." }, { status: 400 });
  if (callback && callback.ResultCode !== 0) {
    try {
      return NextResponse.json(
        await failPayment(
          await getStudioDb(),
          "mpesa",
          String(reference),
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
  if (body.status && body.status !== "success")
    return NextResponse.json({ status: "ignored" });
  const paidAmount = callback?.CallbackMetadata?.Item?.find(
    (item) => item.Name === "Amount",
  )?.Value;
  const confirmation =
    typeof paidAmount === "number" || typeof paidAmount === "string"
      ? { amount: Number(paidAmount), currency: "KES" }
      : undefined;
  try {
    const result = await settlePayment(
      await getStudioDb(),
      "mpesa",
      String(reference),
      String(eventId),
      raw,
      confirmation,
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 503 },
    );
  }
}
