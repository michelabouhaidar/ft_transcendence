#!/bin/sh

BACKUP_ROOT=/backups
STATUS_DIR=/backups/status
SOURCES=/sources

export PGOPTIONS="-c client_min_messages=warning"

log() { echo "[backup] $(date '+%F %T') $*"; }
die() { log "ERROR: $*" >&2; exit 1; }

newest_backup() {
  ls -1d "$BACKUP_ROOT/${1:-trenno}"_* 2>/dev/null | tail -n 1
}

resolve_backup() {
  case "${1:-}" in
    "") die "no backup name given (use 'latest' or a name from 'make backup-list')" ;;
    latest) path=$(newest_backup trenno) ;;
    *) path="$BACKUP_ROOT/$(basename "$1")" ;;
  esac
  [ -n "$path" ] && [ -d "$path" ] || die "backup '${1}' not found in $BACKUP_ROOT"
  echo "$path"
}

check_integrity() {
  (cd "$1" && sha256sum -c -s SHA256SUMS) || die "checksum mismatch in $(basename "$1"): backup is damaged"
}
