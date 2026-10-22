import { VerifyEmail } from "@/components/verify-email";

export const metadata = { title: "Verify email — Tradeintra" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <VerifyEmail token={token ?? ""} />;
}
