import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStudioDb, studioMode } from "@/lib/server/studio/database";
import { sessionActor, SESSION_COOKIE } from "@/lib/server/studio/auth";
import StudioClient from "./studio-client";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const mode = studioMode();
  if (mode === "disabled" || mode === "local") return <StudioClient />;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const actor = await sessionActor(await getStudioDb(), token);
  if (!actor) redirect("/login");
  return <StudioClient />;
}
