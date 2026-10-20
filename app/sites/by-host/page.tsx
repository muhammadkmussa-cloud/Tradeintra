import { headers } from "next/headers";
import { notFound, unstable_rethrow } from "next/navigation";
import { PublishedSite } from "@/components/published-site";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import { publishedConfigByHost } from "@/lib/server/studio/service";
import { normalizeHostname } from "@/lib/server/poc-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = {
  title: "Operator site — Tradeintra mock preview",
  robots: { index: false, follow: false },
};

export default async function CustomHostSite() {
  if (process.env.TENANT_CUSTOM_HOSTS !== "true") notFound();
  const hostname = normalizeHostname((await headers()).get("host"));
  if (!hostname) notFound();
  try {
    const mode = studioMode();
    if (mode === "disabled") notFound();
    const config = await publishedConfigByHost(await getStudioDb(), hostname);
    if (!config) notFound();
    return (
      <PublishedSite
        config={config}
        environment={mode === "local" ? "Local development" : "Staging"}
      />
    );
  } catch (error) {
    unstable_rethrow(error);
    throw new Error(
      "Published mock site unavailable. No draft fallback was served.",
    );
  }
}
