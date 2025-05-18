FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copiamos los archivos esenciales
COPY .next .next
COPY public public
COPY prisma prisma
COPY .env package.json pnpm-lock.yaml ./

# Crear el directorio para la biblioteca
RUN mkdir -p /library/manga

# Instalamos solo las dependencias necesarias para producción
RUN pnpm install --frozen-lockfile --prod
RUN pnpm dlx prisma generate

# Limpiar store de pnpm para reducir tamaño de imagen
RUN pnpm store prune

# Limpiamos archivos
RUN rm -rf /usr/share/man \
           /usr/share/doc \
           /usr/lib/node_modules/npm \
           /root/.npm \
           /root/.cache \
           /tmp/*

# Definimos el comando de inicio
CMD ["pnpm", "start"]