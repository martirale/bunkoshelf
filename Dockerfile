# Etapa 1: dependencias
FROM node:22-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat python3 make g++
RUN corepack enable

COPY package.json pnpm-lock.yaml .npmrc ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN echo "DATABASE_URL=file:/app/prisma/data/bunkoshelf.db" > .env && \
    pnpm install --frozen-lockfile && \
    cd node_modules/.pnpm/better-sqlite3@12.5.0/node_modules/better-sqlite3 && \
    npm run build-release && \
    ls -la build/Release/



# Etapa 2: build de la app Next.js
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable

ENV DATABASE_URL=file:/app/prisma/data/bunkoshelf.db

COPY . .
COPY --from=deps /app/node_modules ./node_modules

RUN pnpm run build



# Etapa 3: runtime final
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=file:/app/prisma/data/bunkoshelf.db

RUN apk add --no-cache libc6-compat
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json

RUN mkdir -p /app/prisma/data
EXPOSE 3000

CMD ["pnpm", "start:prod"]
