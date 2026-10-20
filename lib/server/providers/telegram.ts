export type TelegramMode = "mock" | "live";
export type TelegramResult = {
  mode: TelegramMode;
  status: "sent" | "mock";
  messageId: number | null;
};

export function telegramMode(): TelegramMode {
  const configured = (process.env.TELEGRAM_MODE ?? "").toLowerCase();
  if (configured === "live") return "live";
  if (configured === "mock") return "mock";
  return process.env.TELEGRAM_BOT_TOKEN ? "live" : "mock";
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  overrideToken?: string,
): Promise<TelegramResult> {
  const mode = telegramMode();
  if (mode === "mock") return { mode: "mock", status: "mock", messageId: null };
  const token = overrideToken ?? process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Telegram bot token is not configured.");
  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 4000),
        disable_web_page_preview: true,
      }),
    },
  );
  const body = (await response.json()) as {
    ok?: boolean;
    result?: { message_id?: number };
    description?: string;
  };
  if (!response.ok || !body.ok)
    throw new Error(body.description ?? "Telegram delivery failed.");
  return {
    mode: "live",
    status: "sent",
    messageId: body.result?.message_id ?? null,
  };
}
