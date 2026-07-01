#!/bin/sh
set -e

echo "→ Running database migrations..."
npx prisma migrate deploy 2>&1

echo "→ Running database seed..."
npx prisma db seed 2>&1

echo "→ Starting application..."
exec "$@"
