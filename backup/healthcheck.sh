#!/bin/sh
# Docker health check: healthy only if the last run succeeded AND the newest
# backup is younger than BACKUP_MAX_AGE_HOURS (default 26 = daily + 2 h slack).
. /usr/local/bin/common.sh

grep -q '"status": "ok"' "$STATUS_DIR/status.json" 2>/dev/null || exit 1
newest=$(newest_backup trenno)
[ -n "$newest" ] || exit 1
[ -n "$(find "$newest" -maxdepth 0 -mmin -$(( ${BACKUP_MAX_AGE_HOURS:-26} * 60 )))" ]
