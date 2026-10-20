import { NextRequest, NextResponse } from "next/server";
import { getStudioDb } from "@/lib/server/studio/database";
import { settleCreditPurchase } from "@/lib/server/payments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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
  const eventId =
    body.eventId ??
    callback?.CallbackMetadata?.Item?.find(
      (item) => item.Name === "MpesaReceiptNumber",
    )?.Value ??
    callback?.CheckoutRequestID;
  if (!reference || !eventId)
    return NextResponse.json({ error: "Missing reference." }, { status: 400 });
  if (callback && callback.ResultCode !== 0)
    return NextResponse.json({ status: "ignored" });
  if (body.status && body.status !== "success")
    return NextResponse.json({ status: "ignored" });
  try {
    const result = await settleCreditPurchase(
      await getStudioDb(),
      "mpesa",
      String(reference),
      String(eventId),
      raw,
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 503 },
    );
  }
}
