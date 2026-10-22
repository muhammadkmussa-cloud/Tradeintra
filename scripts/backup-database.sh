#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL is required}"
backup_dir="${BACKUP_DIR:-./backups}"
retention_days="${BACKUP_RETENTION_DAYS:-14}"
mkdir -p "$backup_dir"
chmod 700 "$backup_dir"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="$backup_dir/tradeintra-$stamp.sql.gz"
pg_dump "$DATABASE_URL" --no-owner --no-privileges | gzip -9 > "$target"
chmod 600 "$target"
find "$backup_dir" -type f -name 'tradeintra-*.sql.gz' -mtime +"$retention_days" -delete
echo "Backup written: $target"
