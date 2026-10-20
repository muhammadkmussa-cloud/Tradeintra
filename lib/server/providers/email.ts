import nodemailer from "nodemailer";

export type EmailMode = "mock" | "smtp";
export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export function emailMode(): EmailMode {
  const configured = (process.env.SMTP_MODE ?? "").toLowerCase();
  if (configured === "smtp") return "smtp";
  if (configured === "mock") return "mock";
  return process.env.SMTP_HOST ? "smtp" : "mock";
}

export async function sendEmail(message: EmailMessage) {
  if (emailMode() === "mock")
    return { status: "mock" as const, messageId: null };
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD
  )
    throw new Error("SMTP is not configured.");
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  const result = await transport.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: message.to,
    subject: message.subject,
    text: message.text,
  });
  return { status: "sent" as const, messageId: result.messageId };
}
