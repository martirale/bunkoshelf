#!/bin/sh

# Lanzar backend (puerto 4000)
node back/server.js &

# Lanzar frontend (Next.js en modo prod)
pnpm --prefix front start
