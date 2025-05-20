# Primera etapa
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk update && apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY .next .next
COPY .env package.json pnpm-lock.yaml ./
COPY prisma prisma/
COPY public public
RUN pnpm install --prod --filter next
RUN pnpm install --prod --filter @prisma/client
RUN pnpm dlx prisma generate
RUN pnpm store prune && rm -rf /usr/share/man /usr/share/doc /root/.npm /root/.cache /tmp/*

# Segunda etapa: imagen final
FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=builder /app /app
RUN mkdir -p /library/manga

CMD ["sh", "-c", "pnpm dlx prisma migrate deploy && pnpm start"]
