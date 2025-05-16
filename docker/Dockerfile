FROM node:20

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod

COPY prisma prisma

COPY .env .env

RUN echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env

COPY . .

RUN pnpm build

CMD ["pnpm", "start"]