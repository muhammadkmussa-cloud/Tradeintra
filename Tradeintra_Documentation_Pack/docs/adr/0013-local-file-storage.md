# ADR 0013: Local File Storage on Stellar Plus

- **Status:** Accepted
- **Date:** 2026-10-20

## Context

Stellar Plus does not provide object storage equivalent to Vercel Blob/S3, and external storage must not be a required dependency.

## Decision

Store uploaded files in the hosting account:

- `storage/{account_id}/...` outside the public web root.
- Enforce per-account disk and inode quotas.
- Serve files through authenticated or signed application routes.
- Include storage in backups.
- Clean up orphaned assets and deleted-tenant data.

## Alternatives

- External object storage: not permitted as a required dependency.
- Public web-root storage: insecure.
- Database BLOBs: poor performance and backup size.

## Consequences

- Simple and cheap.
- Limited by shared-hosting disk/inode limits.
- No CDN or global asset delivery.
- Backups and cleanup are critical.

## Security/privacy implications

- Prevent path traversal and cross-tenant access.
- Validate MIME types and scan uploads.
- Do not execute uploaded files.

## Revisit trigger

Storage limits or delivery performance become a hard blocker.
