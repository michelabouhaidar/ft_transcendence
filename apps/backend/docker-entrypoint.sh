#!/bin/sh
set -e

echo "[Backend Entrypoint] Waiting for PostgreSQL database to be ready..."

# Wait for DB port using node net loop
until node -e '
const net = require("net");
const url = new URL(process.env.DATABASE_URL);
const client = net.connect({ host: url.hostname, port: url.port || 5432 }, () => {
  client.end();
  process.exit(0);
});
client.on("error", () => process.exit(1));
' 2>/dev/null; do
  echo "[Backend Entrypoint] Database is not ready yet. Retrying in 2 seconds..."
  sleep 2
done

echo "[Backend Entrypoint] Database connection verified."

# Sync database schema if prisma directory exists
if [ -d "./prisma" ]; then
  echo "[Backend Entrypoint] Synchronizing database schema with Prisma..."
  npx prisma db push --skip-generate --accept-data-loss || true

  # Seed initial system administrator
  echo "[Backend Entrypoint] Running initial seed..."
  npx tsx prisma/seed.ts || echo "[Backend Entrypoint] Seed warning (skipped or already run)."
fi

echo "[Backend Entrypoint] Starting application: $@"
exec "$@"
