FROM node:20

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copiamos los archivos esenciales
COPY .next .next
COPY public public
COPY prisma prisma
COPY .env package.json pnpm-lock.yaml ./

# Instalamos solo las dependencias necesarias para producción
RUN pnpm install --frozen-lockfile --prod
RUN pnpm dlx prisma generate

# Definimos el comando de inicio
CMD ["pnpm", "start"]