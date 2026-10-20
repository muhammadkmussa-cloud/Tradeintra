import { createHash, randomUUID } from "node:crypto";
import type { Studio, Site, Config } from "../../studio";
import { validateConfig } from "../../studio";
import { configSchema, type StudioAction } from "./input";
import { StudioError, type StudioDb, type StudioTrx } from "./types";
import { scope } from "./database";

export type ServerState = { studio: Studio; revision: number };
async function state(tx: StudioTrx, account: string): Promise<ServerState> {
  const info = await tx
    .selectFrom("accounts")
    .selectAll()
    .where("id", "=", account)
    .executeTakeFirstOrThrow();
  const rows = await tx
    .selectFrom("sites")
    .selectAll()
    .where("account_id", "=", account)
    .where("archived", "=", false)
    .orderBy("created_at", "desc")
    .execute();
  const versions = rows.length
    ? await tx
        .selectFrom("versions")
        .selectAll()
        .where("account_id", "=", account)
        .where(
          "site_id",
          "in",
          rows.map((s) => s.id),
        )
        .orderBy("number")
        .execute()
    : [];
  const sites: Site[] = rows.map((row) => ({
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    draft: row.draft,
    versions: versions
      .filter((v) => v.site_id === row.id)
      .map((v) => ({
        id: v.id,
        number: v.number,
        createdAt: new Date(v.created_at).toISOString(),
        config: v.config,
        ...(v.restored_from ? { restoredFrom: v.restored_from } : {}),
      })),
  }));
  return {
    studio: {
      workspace: info.workspace,
      derivLinked: info.deriv_linked,
      sites,
    },
    revision: info.revision,
  };
}
export const loadState = (db: StudioDb, account: string) =>
  scope(db, account, (tx) => state(tx, account));
async function siteForUpdate(tx: StudioTrx, account: string, id: string) {
  const site = await tx
    .selectFrom("sites")
    .selectAll()
    .where("id", "=", id)
    .where("account_id", "=", account)
    .where("archived", "=", false)
    .forUpdate()
    .executeTakeFirst();
  if (!site) throw new StudioError(404, "Site not found.", "NOT_FOUND");
  return site;
}
async function reserve(
  tx: StudioTrx,
  account: string,
  id: string,
  config: Config,
) {
  const errors = validateConfig(config, []);
  if (Object.keys(errors).length)
    throw new StudioError(
      422,
      "Check your site settings.",
      "VALIDATION",
      errors,
    );
  await tx
    .insertInto("subdomains")
    .values({ slug: config.slug, account_id: account, site_id: id })
    .onConflict((oc) => oc.column("slug").doNothing())
    .execute();
  const reservation = await tx
    .selectFrom("subdomains")
    .select(["account_id", "site_id"])
    .where("slug", "=", config.slug)
    .executeTakeFirst();
  if (
    !reservation ||
    reservation.account_id !== account ||
    reservation.site_id !== id
  )
    throw new StudioError(
      409,
      "This subdomain is already reserved. Try another name.",
      "SLUG_TAKEN",
      { slug: "This subdomain is already reserved. Try another name." },
    );
}
async function appendVersion(
  tx: StudioTrx,
  account: string,
  id: string,
  config: Config,
  restoredFrom?: number,
) {
  const latest = await tx
    .selectFrom("versions")
    .select("number")
    .where("account_id", "=", account)
    .where("site_id", "=", id)
    .orderBy("number", "desc")
    .executeTakeFirst();
  const number = (latest?.number ?? 0) + 1;
  if (number > 50)
    throw new StudioError(
      422,
      "This development site has reached its 50-version limit.",
      "LIMIT_REACHED",
    );
  await reserve(tx, account, id, config);
  await tx
    .insertInto("versions")
    .values({
      id: randomUUID(),
      account_id: account,
      site_id: id,
      number,
      config,
      restored_from: restoredFrom ?? null,
    })
    .execute();
  await tx
    .updateTable("sites")
    .set({ published_version: number, updated_at: new Date() })
    .where("account_id", "=", account)
    .where("id", "=", id)
    .execute();
}
export async function applyAction(
  db: StudioDb,
  account: string,
  input: StudioAction,
): Promise<ServerState> {
  const requestHash = createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
  return scope(db, account, async (tx) => {
    const current = await tx
      .selectFrom("accounts")
      .select("revision")
      .where("id", "=", account)
      .forUpdate()
      .executeTakeFirstOrThrow();
    const previous = await tx
      .selectFrom("operations")
      .select("request_hash")
      .where("account_id", "=", account)
      .where("id", "=", input.operationId)
      .executeTakeFirst();
    if (previous) {
      if (previous.request_hash !== requestHash)
        throw new StudioError(
          409,
          "Operation identifier was reused with different data.",
          "OPERATION_CONFLICT",
        );
      return state(tx, account);
    }
    if (input.revision !== current.revision)
      throw new StudioError(
        409,
        "Your workspace changed in another tab. Refresh and review your draft before saving again.",
        "STALE_WORKSPACE",
      );
    if (input.kind === "settings") {
      await tx
        .updateTable("accounts")
        .set({ workspace: input.workspace, deriv_linked: input.derivLinked })
        .where("id", "=", account)
        .execute();
    } else if (input.kind === "save") {
      const config = configSchema.parse(input.config);
      let id = input.id;
      if (id) await siteForUpdate(tx, account, id);
      else {
        const count = await tx
          .selectFrom("sites")
          .select("id")
          .where("account_id", "=", account)
          .execute();
        if (
          count.length >= 20 ||
          (
            await tx
              .selectFrom("sites")
              .select("id")
              .where("account_id", "=", account)
              .where("archived", "=", false)
              .execute()
          ).length >= 5
        )
          throw new StudioError(
            422,
            "Development limit reached: five active sites and twenty total sites per account.",
            "LIMIT_REACHED",
          );
        id = randomUUID();
        await tx
          .insertInto("sites")
          .values({
            account_id: account,
            id,
            draft: config,
            published_version: null,
          })
          .execute();
      }
      await reserve(tx, account, id, config);
      await tx
        .updateTable("sites")
        .set({ draft: config, updated_at: new Date() })
        .where("account_id", "=", account)
        .where("id", "=", id)
        .execute();
      if (input.publish) await appendVersion(tx, account, id, config);
    } else {
      const site = await siteForUpdate(tx, account, input.id);
      if (input.kind === "archive") {
        await tx
          .updateTable("sites")
          .set({ archived: true, updated_at: new Date() })
          .where("account_id", "=", account)
          .where("id", "=", input.id)
          .execute();
        await tx
          .deleteFrom("subdomains")
          .where("account_id", "=", account)
          .where("site_id", "=", input.id)
          .execute();
      } else if (input.kind === "publish")
        await appendVersion(tx, account, input.id, site.draft);
      else {
        const source = await tx
          .selectFrom("versions")
          .select("config")
          .where("account_id", "=", account)
          .where("site_id", "=", input.id)
          .where("number", "=", input.number)
          .executeTakeFirst();
        if (!source)
          throw new StudioError(404, "Version not found.", "NOT_FOUND");
        await appendVersion(tx, account, input.id, source.config, input.number);
        await tx
          .updateTable("sites")
          .set({ draft: source.config })
          .where("account_id", "=", account)
          .where("id", "=", input.id)
          .execute();
      }
    }
    await tx
      .updateTable("accounts")
      .set({ revision: current.revision + 1 })
      .where("id", "=", account)
      .execute();
    await tx
      .insertInto("operations")
      .values({
        account_id: account,
        id: input.operationId,
        request_hash: requestHash,
        kind: input.kind,
      })
      .execute();
    await tx
      .deleteFrom("operations")
      .where("account_id", "=", account)
      .where("created_at", "<", new Date(Date.now() - 7 * 86400000))
      .execute();
    return state(tx, account);
  });
}
export async function publishedConfig(
  db: StudioDb,
  slug: string,
): Promise<Config | null> {
  const route = await db
    .selectFrom("subdomains")
    .select(["account_id", "site_id"])
    .where("slug", "=", slug)
    .executeTakeFirst();
  if (!route) return null;
  return scope(db, route.account_id, async (tx) => {
    const row = await tx
      .selectFrom("sites")
      .innerJoin("versions", (join) =>
        join
          .onRef("versions.account_id", "=", "sites.account_id")
          .onRef("versions.site_id", "=", "sites.id")
          .onRef("versions.number", "=", "sites.published_version"),
      )
      .select("versions.config")
      .where("sites.account_id", "=", route.account_id)
      .where("sites.id", "=", route.site_id)
      .where("sites.archived", "=", false)
      .executeTakeFirst();
    if (!row || row.config.slug !== slug) return null;
    const config = configSchema.safeParse(row.config);
    return config.success ? config.data : null;
  });
}
