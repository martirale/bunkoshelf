# Etapa 1: Build
FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y openssl bash

RUN npm install -g pnpm

WORKDIR /app

COPY . .

RUN pnpm install

RUN pnpm dlx prisma generate

RUN pnpm build

# Etapa 2: Prod Image
FROM node:20-slim AS runner

WORKDIR /app

RUN npm install -g pnpm pm2 dotenv-cli

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/.env ./.env
COPY process.yml /app/process.yml

EXPOSE 3000

CMD ["dotenv", "-e", ".env", "--", "pm2-runtime", "process.yml"]