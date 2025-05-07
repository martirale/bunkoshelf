#!/bin/bash

set -e  # Salir si algún comando falla

echo "Ejecutando migraciones Prisma..."
cd /app/back
pnpm install
pnpm prisma generate
pnpm prisma migrate deploy

echo "Iniciando Express con PM2..."
pm2 start server.js --name express
pm2 save

echo "Iniciando Next.js con PM2..."
cd /app/front
pm2 start "pnpm start" --name next
pm2 save