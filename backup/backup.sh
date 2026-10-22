#!/bin/sh
# Takes one complete backup of everything that is not in git:
#   db.dump          PostgreSQL logical dump (pg_dump custom format, compressed)
#   uploads.tar.gz   user files (avatars)
#   grafana.tar.gz   Grafana state (users, preferences); dashboards live in git
#   certs.tar.gz     TLS certificate and key served by nginx
#   env              the .env file; without TOTP_ENCRYPTION_KEY the 2FA
#                    secrets inside db.dump can never be decrypted again
#   manifest.json    what was backed up, when, and how big
#   SHA256SUMS       checksums, checked again before any restore
#
# Usage: backup.sh [prerestore]

#!/bin/sh
# Takes one complete backup of everything that is not in git:
#   db.dump          PostgreSQL logical dump (pg_dump custom format, compressed)
#   uploads.tar.gz   user files (avatars)
#   grafana.tar.gz   Grafana state (users, preferences); dashboards live in git
#   certs.tar.gz     TLS certificate and key served by nginx
#   env              the .env file; without TOTP_ENCRYPTION_KEY the 2FA
#                    secrets inside db.dump can never be decrypted again
#   manifest.json    what was backed up, when, and how big
#   SHA256SUMS       checksums, checked again before any restore
#
# Usage: backup.sh [prerestore]
set -eu
. /usr/local/bin/common.sh

PREFIX=trenno
[ "${1:-}" = prerestore ] && PREFIX=prerestore
KEEP=${BACKUP_KEEP:-7}
[ "$PREFIX" = prerestore ] && KEEP=3

NAME="${PREFIX}_$(date +%Y-%m-%d_%H%M%S)"
TMP="$BACKUP_ROOT/.tmp_$NAME"
START=$(date +%s)

mkdir -p "$STATUS_DIR"

# One backup at a time: the 03:00 job and a manual `make backup` could overlap.
exec 9>"$BACKUP_ROOT/.lock"
flock -n 9 || die "another backup is already running"

write_status() { # <ok|failed> <message>
  last=$(newest_backup trenno)
  if [ -n "$last" ]; then last_json=$(cat "$last/manifest.json"); else last_json=null; fi
  printf '{"status": "%s", "lastRunAt": "%s", "message": "%s", "lastSuccess": %s}\n' \
    "$1" "$(date -Iseconds)" "$2" "$last_json" > "$STATUS_DIR/status.json.tmp"
  mv "$STATUS_DIR/status.json.tmp" "$STATUS_DIR/status.json"

  # Prometheus metrics, read by node-exporter's textfile collector.
  ok=0; [ "$1" = ok ] && ok=1
  printf '# HELP trenno_backup_last_run_success 1 if the last backup run succeeded.\n# TYPE trenno_backup_last_run_success gauge\ntrenno_backup_last_run_success %s\n' \
    "$ok" > "$STATUS_DIR/run.prom.tmp"
  mv "$STATUS_DIR/run.prom.tmp" "$STATUS_DIR/run.prom"
  chmod 644 "$STATUS_DIR"/*
}

# On any failure: delete the half-written backup and record the failure.
on_exit() {
  code=$?
  [ $code -eq 0 ] && return
  rm -rf "$TMP"
  [ "$PREFIX" = trenno ] && write_status failed "backup $NAME failed (exit $code), see: docker logs ${HOSTNAME:-backup}"
  log "FAILED: $NAME (exit $code)"
}
trap on_exit EXIT

umask 077
mkdir -p "$TMP"
log "starting $NAME"

# 1. Database. Custom format is compressed, can be restored table by table,
#    and can be checked without a server (pg_restore --list).
pg_dump --format=custom --compress=6 --no-owner --file="$TMP/db.dump"
pg_restore --list "$TMP/db.dump" > /dev/null
log "database dumped ($(stat -c %s "$TMP/db.dump") bytes)"

# 2. Files. tar -tzf reads the archive back to prove it is not truncated.
for dir in uploads grafana certs; do
  [ -d "$SOURCES/$dir" ] || continue
  tar -czf "$TMP/$dir.tar.gz" -C "$SOURCES/$dir" .
  tar -tzf "$TMP/$dir.tar.gz" > /dev/null
  log "$dir archived ($(stat -c %s "$TMP/$dir.tar.gz") bytes)"
done
[ -f "$SOURCES/env" ] && cp "$SOURCES/env" "$TMP/env"

# 3. Manifest and checksums.
files_json=$(cd "$TMP" && for f in *; do printf '"%s": %s, ' "$f" "$(stat -c %s "$f")"; done)
size=$(cd "$TMP" && stat -c %s * | awk '{ s += $1 } END { print s }')
pg_version=$(psql -tAc 'SHOW server_version' | cut -d' ' -f1)
printf '{"name": "%s", "createdAt": "%s", "durationSeconds": %s, "sizeBytes": %s, "postgresVersion": "%s", "files": {%s}}\n' \
  "$NAME" "$(date -Iseconds)" "$(( $(date +%s) - START ))" "$size" "$pg_version" "${files_json%, }" > "$TMP/manifest.json"
(cd "$TMP" && sha256sum * > SHA256SUMS)

# 4. Publish atomically: a backup directory either exists complete or not at all.
mv "$TMP" "$BACKUP_ROOT/$NAME"

# 5. Retention: keep the newest $KEEP backups of this kind.
ls -1d "$BACKUP_ROOT/${PREFIX}"_* | sort -r | tail -n +$((KEEP + 1)) | while read -r old; do
  rm -rf "$old"
  log "rotated out $(basename "$old")"
done

if [ "$PREFIX" = trenno ]; then
  write_status ok "backup $NAME completed"
  printf '# HELP trenno_backup_last_success_timestamp_seconds Unix time of the last successful backup.\n# TYPE trenno_backup_last_success_timestamp_seconds gauge\ntrenno_backup_last_success_timestamp_seconds %s\n# HELP trenno_backup_last_size_bytes Size of the last successful backup.\n# TYPE trenno_backup_last_size_bytes gauge\ntrenno_backup_last_size_bytes %s\n' \
    "$(date +%s)" "$size" > "$STATUS_DIR/success.prom"
  chmod 644 "$STATUS_DIR/success.prom"
fi

# 6. Let the host user read, copy and delete backups without sudo.
if [ -n "${BACKUP_UID:-}" ]; then
  chown -R "$BACKUP_UID:${BACKUP_GID:-$BACKUP_UID}" "$BACKUP_ROOT"
fi
log "done: $NAME ($size bytes in $(( $(date +%s) - START ))s)"
