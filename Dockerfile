# Etapa 1: dependencias
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm

COPY prisma ./prisma
RUN pnpm install --frozen-lockfile



# Etapa 2: build de la app Next.js
FROM node:20-alpine AS builder
WORKDIR /app

ARG JWT_SECRET
ENV JWT_SECRET=$JWT_SECRET

COPY . .
COPY --from=deps /app/node_modules ./node_modules

RUN npm install -g pnpm
RUN pnpm run build



# Etapa 3: runtime final
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ARG JWT_SECRET
ENV JWT_SECRET=$JWT_SECRET
ENV DATABASE_URL="file:/app/prisma/data/bunkoshelf.db"

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

RUN mkdir -p /app/prisma/data
RUN npm install -g pnpm
EXPOSE 3000

CMD ["pnpm", "start:prod"]
