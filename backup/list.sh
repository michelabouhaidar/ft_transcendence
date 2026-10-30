#!/bin/sh
# Lists the available backups, newest first, and the last run's status.
. /usr/local/bin/common.sh

printf '%-34s %10s\n' NAME SIZE
for dir in $(ls -1d "$BACKUP_ROOT"/trenno_* "$BACKUP_ROOT"/prerestore_* 2>/dev/null | sort -t_ -k2 -r); do
  printf '%-34s %10s\n' "$(basename "$dir")" "$(du -sh "$dir" | cut -f1)"
done
echo
[ -f "$STATUS_DIR/status.json" ] && echo "last run: $(cut -c1-160 "$STATUS_DIR/status.json")"
