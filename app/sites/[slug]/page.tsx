import { notFound, unstable_rethrow } from "next/navigation";
import { PublishedSite } from "@/components/published-site";
import { studioMode, getStudioDb } from "@/lib/server/studio/database";
import { publishedConfig } from "@/lib/server/studio/service";
import {
  LEGACY_SLUG_PATTERN,
  SLUG_PATTERN,
  RESERVED_SLUGS,
} from "@/lib/studio";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = {
  title: "Operator site — Tradeintra mock preview",
  robots: { index: false, follow: false },
};
export default async function SitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (
    (!SLUG_PATTERN.test(slug) && !LEGACY_SLUG_PATTERN.test(slug)) ||
    RESERVED_SLUGS.has(slug)
  )
    notFound();
  try {
    const mode = studioMode();
    if (mode === "disabled") notFound();
    const config = await publishedConfig(await getStudioDb(), slug);
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
