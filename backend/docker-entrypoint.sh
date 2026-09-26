#!/bin/sh
set -e

echo "Waiting for MongoDB and applying migrations…"
i=0
until node src/migrations/migrate.js; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "MongoDB did not become ready in time"
    exit 1
  fi
  echo "Mongo not ready yet, retrying in 2s…"
  sleep 2
done

if [ "${SEED_ON_START:-true}" = "true" ]; then
  node src/scripts/seed-if-empty.js
fi

exec node src/server.js
