import { aiMode } from "@/lib/server/providers/ai";
import { emailMode } from "@/lib/server/providers/email";
import { domainMode } from "@/lib/server/providers/domain";
import { paymentMode } from "@/lib/server/providers/payments";
import { scanMode } from "@/lib/server/providers/malware";
import { telegramMode } from "@/lib/server/providers/telegram";

export const dynamic = "force-dynamic";

export function GET() {
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
  return Response.json(
    {
      service: "tradeintra",
      providers: {
        ai: {
          mode: aiMode(),
          configured: Boolean(process.env.DEEPSEEK_API_KEY),
        },
        email: {
          mode: emailMode(),
          configured: Boolean(
            process.env.SMTP_HOST &&
            process.env.SMTP_USER &&
            process.env.SMTP_PASSWORD,
          ),
        },
        domains: {
          mode: domainMode(),
          configured: Boolean(
            process.env.NAMECHEAP_API_USER &&
            process.env.NAMECHEAP_API_KEY &&
            process.env.NAMECHEAP_USERNAME &&
            process.env.NAMECHEAP_CLIENT_IP,
          ),
        },
        payments: {
          mode: paymentMode(),
          paystackConfigured: Boolean(process.env.PAYSTACK_SECRET_KEY),
          mpesaConfigured: Boolean(
            process.env.MPESA_CONSUMER_KEY &&
            process.env.MPESA_CONSUMER_SECRET &&
            process.env.MPESA_SHORTCODE,
          ),
        },
        telegram: {
          mode: telegramMode(),
          configured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
        },
        marketplaceScan: { mode: scanMode() },
      },
    },
    { headers },
  );
}
