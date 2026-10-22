const mode = (value, fallback = "mock") => {
  const normalized = String(value ?? "").toLowerCase();
  return ["mock", "sandbox", "live", "basic", "clamav", "smtp"].includes(
    normalized,
  )
    ? normalized
    : fallback;
};
const report = {
  ai: {
    mode: mode(
      process.env.DEEPSEEK_MODE,
      process.env.DEEPSEEK_API_KEY ? "live" : "mock",
    ),
    configured: Boolean(process.env.DEEPSEEK_API_KEY),
  },
  email: {
    mode: mode(process.env.SMTP_MODE, process.env.SMTP_HOST ? "smtp" : "mock"),
    configured: Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD,
    ),
  },
  domains: {
    mode: mode(process.env.NAMECHEAP_MODE),
    configured: Boolean(
      process.env.NAMECHEAP_API_USER &&
      process.env.NAMECHEAP_API_KEY &&
      process.env.NAMECHEAP_USERNAME &&
      process.env.NAMECHEAP_CLIENT_IP,
    ),
  },
  payments: {
    mode: mode(process.env.PAYMENT_MODE),
    paystackConfigured: Boolean(process.env.PAYSTACK_SECRET_KEY),
    mpesaConfigured: Boolean(
      process.env.MPESA_CONSUMER_KEY &&
      process.env.MPESA_CONSUMER_SECRET &&
      process.env.MPESA_SHORTCODE,
    ),
  },
  telegram: {
    mode: mode(
      process.env.TELEGRAM_MODE,
      process.env.TELEGRAM_BOT_TOKEN ? "live" : "mock",
    ),
    configured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
  },
  marketplaceScan: {
    mode: mode(
      process.env.MARKETPLACE_SCAN_MODE,
      process.env.CLAMSCAN_PATH ? "clamav" : "basic",
    ),
  },
};
console.log(JSON.stringify(report, null, 2));
