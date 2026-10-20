export type AiMode = "mock" | "sandbox" | "live";
export type BotGeneration = {
  xml: string;
  provider: "mock" | "deepseek";
  model: string;
  credits: number;
};

function mode(): AiMode {
  const configured = (process.env.DEEPSEEK_MODE ?? "").toLowerCase();
  if (
    configured === "sandbox" ||
    configured === "live" ||
    configured === "mock"
  )
    return configured;
  return process.env.DEEPSEEK_API_KEY ? "live" : "mock";
}

export async function generateBotXml(
  prompt: string,
  cost = 10,
): Promise<BotGeneration> {
  const selected = mode();
  if (selected === "mock")
    return {
      provider: "mock",
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      credits: cost,
      xml: `<xml><strategy name="mock-deepseek"><tradeintra>true</tradeintra><prompt>${prompt
        .replace(/[<>&]/g, "")
        .slice(0, 120)}</prompt></strategy></xml>`,
    };
  if (!process.env.DEEPSEEK_API_KEY)
    throw new Error("DeepSeek API key is not configured.");
  const base = (
    process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com"
  ).replace(/\/$/, "");
  const response = await fetch(`${base}/chat/completions`, {
    signal: AbortSignal.timeout(30000),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      temperature: 0.2,
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content:
            "Return only DBot-compatible XML wrapped in <xml>...</xml>. No prose, no scripts, no external URLs.",
        },
        { role: "user", content: prompt.slice(0, 4000) },
      ],
    }),
  });
  if (!response.ok)
    throw new Error(`DeepSeek request failed (${response.status}).`);
  const body = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const xml = body.choices?.[0]?.message?.content?.trim() ?? "";
  if (!xml.startsWith("<xml") || !xml.includes("</xml>"))
    throw new Error("DeepSeek returned an invalid bot document.");
  return {
    provider: "deepseek",
    model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
    credits: cost,
    xml,
  };
}
