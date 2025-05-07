FROM node:20-slim

RUN apt-get update && apt-get install -y openssl

RUN npm install -g pnpm pm2

WORKDIR /app

COPY ./front /app/front
COPY ./back /app/back
COPY ecosystem.config.cjs /app/ecosystem.config.cjs

WORKDIR /app/back
RUN pnpm install && pnpm exec prisma generate

WORKDIR /app

EXPOSE 3000 4000

CMD ["pm2-runtime", "ecosystem.config.cjs"]
