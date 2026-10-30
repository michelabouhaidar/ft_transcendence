#!/bin/sh
# Restores a backup over the live data.
# Usage: restore.sh <backup-name|latest> [all|db|uploads|grafana|certs]
#
# The caller (make restore) stops backend and grafana first and starts them
# again afterwards, so nothing writes while we restore.
set -eu
. /usr/local/bin/common.sh

SRC=$(resolve_backup "${1:-}")
WHAT=${2:-all}
case "$WHAT" in all|db|uploads|grafana|certs) ;; *) die "unknown part '$WHAT' (all|db|uploads|grafana|certs)" ;; esac

log "restoring '$WHAT' from $(basename "$SRC")"
check_integrity "$SRC"

# Safety net: snapshot the current state first, so a wrong restore can be
# undone with: make restore NAME=prerestore_...
if [ "${SKIP_SAFETY_BACKUP:-0}" != 1 ]; then
  backup.sh prerestore || die "could not take the safety backup; nothing was changed"
fi

restore_db() {
  # Restore into a side database first. If pg_restore fails, the live
  # database has not been touched. Only then swap the two.
  tmp_db="${PGDATABASE}_restore"
  psql -d postgres -v ON_ERROR_STOP=1 -qc "DROP DATABASE IF EXISTS \"$tmp_db\" WITH (FORCE);" -c "CREATE DATABASE \"$tmp_db\";"
  if ! pg_restore --no-owner --exit-on-error -d "$tmp_db" "$SRC/db.dump"; then
    psql -d postgres -qc "DROP DATABASE IF EXISTS \"$tmp_db\" WITH (FORCE);"
    die "pg_restore failed; the live database was NOT changed"
  fi
  # WITH (FORCE) disconnects remaining clients (postgres-exporter); they reconnect.
  psql -d postgres -v ON_ERROR_STOP=1 -qc "DROP DATABASE \"$PGDATABASE\" WITH (FORCE);" \
    -c "ALTER DATABASE \"$tmp_db\" RENAME TO \"$PGDATABASE\";"
  log "database restored"
}

restore_dir() { # <uploads|grafana|certs>
  archive="$SRC/$1.tar.gz"
  [ -f "$archive" ] || { log "no $1 archive in this backup, skipped"; return 0; }
  # Empty the directory (keeping the directory itself: it is a bind mount),
  # then unpack. tar keeps the original owners, e.g. uid 472 for grafana.
  find "$SOURCES/$1" -mindepth 1 -delete
  tar -xzf "$archive" -C "$SOURCES/$1"
  log "$1 restored"
}

if [ "$WHAT" = all ] || [ "$WHAT" = db ]; then
  restore_db
fi
for part in uploads grafana certs; do
  if [ "$WHAT" = all ] || [ "$WHAT" = "$part" ]; then
    restore_dir "$part"
  fi
done

if [ -f "$SRC/env" ] && ! cmp -s "$SRC/env" "$SOURCES/env"; then
  log "NOTE: the .env in this backup differs from the current one."
  log "      If secrets were lost (new machine), copy it back by hand:"
  log "      cp \${BACKUP_DIR}/$(basename "$SRC")/env .env   then: make re"
fi
log "restore complete"
