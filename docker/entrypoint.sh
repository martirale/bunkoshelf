#!/bin/bash

set -e  # Salir si algún comando falla

echo "Ejecutando migraciones Prisma..."
cd /app/back
pnpm install
pnpm prisma generate
pnpm prisma migrate deploy

exec pm2-runtime /app/process.yml