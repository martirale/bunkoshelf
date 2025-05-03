# Etapa 1: Build
FROM node:20-alpine AS builder

# Habilitamos corepack y pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiamos los archivos de pnpm
COPY pnpm-lock.yaml package.json ./

# Instalamos dependencias con pnpm
RUN pnpm install

# Copiamos el resto del código fuente
COPY . .

# Compilamos la app para producción
RUN pnpm build


# Etapa 2: Producción
FROM node:20-alpine AS runner

# Habilitamos corepack y pnpm también en la etapa final
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiamos solo lo necesario desde la etapa anterior
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

# Comando por defecto para iniciar la app
CMD ["pnpm", "start"]
