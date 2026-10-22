#!/bin/sh
# With no arguments: run the backup scheduler (the normal container mode).
# With arguments: run that command instead, e.g. `restore.sh latest db`.
set -eu

if [ $# -gt 0 ]; then
  exec "$@"
fi

SCHEDULE=${BACKUP_SCHEDULE:-0 3 * * *}

# busybox crond starts jobs with an EMPTY environment, so the job would not
# see PGPASSWORD, BACKUP_KEEP... Save the container's environment to a file
# the job loads first. Job output goes to PID 1's stdout = `docker logs`.
export -p > /etc/backup.env
chmod 600 /etc/backup.env
echo "$SCHEDULE . /etc/backup.env; /usr/local/bin/backup.sh >> /proc/1/fd/1 2>&1" > /etc/crontabs/root

# First start with no backup at all: take one now, so there is always
# something to restore and the health check can turn green.
if ! ls -d /backups/trenno_* > /dev/null 2>&1; then
  /usr/local/bin/backup.sh || echo "[backup] initial backup failed, will retry on schedule"
fi

echo "[backup] scheduler started: '$SCHEDULE' (TZ=${TZ:-UTC}), keeping ${BACKUP_KEEP:-7} backups"
exec crond -f -d 8
