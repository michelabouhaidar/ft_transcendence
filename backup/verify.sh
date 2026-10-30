#!/bin/sh
# Proves a backup can really be restored, without touching live data:
# checks the checksums, restores db.dump into a scratch database, runs a few
# sanity queries, then drops the scratch database.
# Usage: verify.sh [backup-name|latest]
set -eu
. /usr/local/bin/common.sh

SRC=$(resolve_backup "${1:-latest}")
VERIFY_DB="${PGDATABASE}_verify"
log "verifying $(basename "$SRC")"

check_integrity "$SRC"
log "checksums OK"

cleanup() { psql -d postgres -qc "DROP DATABASE IF EXISTS \"$VERIFY_DB\" WITH (FORCE);" || true; }
trap cleanup EXIT

cleanup
psql -d postgres -v ON_ERROR_STOP=1 -qc "CREATE DATABASE \"$VERIFY_DB\";"
pg_restore --no-owner --exit-on-error -d "$VERIFY_DB" "$SRC/db.dump"

tables=$(psql -d "$VERIFY_DB" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'")
users=$(psql -d "$VERIFY_DB" -tAc 'SELECT count(*) FROM "user"' 2>/dev/null || echo "n/a")
[ "$tables" -gt 0 ] || die "restored database has no tables"
log "database restore OK: $tables tables, $users users"

for f in "$SRC"/*.tar.gz; do
  [ -f "$f" ] || continue
  tar -tzf "$f" > /dev/null || die "$(basename "$f") is not a valid archive"
  log "$(basename "$f") OK ($(tar -tzf "$f" | wc -l) entries)"
done
log "backup $(basename "$SRC") is restorable"
