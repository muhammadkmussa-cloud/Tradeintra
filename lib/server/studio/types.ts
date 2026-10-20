import type { ColumnType, Generated, Kysely, Transaction } from "kysely";
import type { Config } from "../../studio";
export interface StudioDatabase {
  credentials: {
    id: string;
    email: string;
    password_hash: string;
    created_at: Generated<Date>;
  };
  accounts: {
    id: string;
    workspace: string;
    deriv_linked: boolean;
    revision: number;
  };
  sessions: {
    token_hash: string;
    account_id: string;
    expires_at: Date;
    created_at: Generated<Date>;
  };
  sites: {
    account_id: string;
    id: string;
    draft: Config;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
    published_version: number | null;
    archived: Generated<boolean>;
  };
  versions: {
    account_id: string;
    site_id: string;
    id: string;
    number: number;
    config: Config;
    created_at: Generated<Date>;
    restored_from: number | null;
  };
  subdomains: { slug: string; account_id: string; site_id: string };
  operations: {
    account_id: string;
    id: string;
    request_hash: string;
    kind: string;
    created_at: Generated<Date>;
  };
  rate_limits: {
    key: string;
    window_start: ColumnType<string, string, string>;
    attempts: number;
  };
}
export type StudioDb = Kysely<StudioDatabase>;
export type StudioTrx = Transaction<StudioDatabase>;
export type Actor = { id: string; email: string; emailVerified: false };
export class StudioError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "REQUEST_FAILED",
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}
