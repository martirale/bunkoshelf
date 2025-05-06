# Etapa 1: Construcción del frontend (Next.js)
FROM node:20-alpine AS frontend-build
WORKDIR /front

# Instalar PNPM
RUN npm install -g pnpm

# Copiar archivos necesarios y construir
COPY front/pnpm-lock.yaml front/package.json ./
RUN pnpm install

COPY front/ ./
RUN pnpm run build

# Etapa 2: Preparar backend (Express)
FROM node:20-alpine AS backend-build
WORKDIR /back

# Instalar PNPM
RUN npm install -g pnpm

# Copiar archivos necesarios y construir
COPY back/pnpm-lock.yaml back/package.json ./
RUN pnpm install --prod

COPY back/ ./

# Genera el cliente Prisma
RUN pnpm prisma generate

# Etapa 3: Imagen final de producción
FROM node:20-alpine

# Crear carpetas para frontend y backend
WORKDIR /app

# Instalar PNPM
RUN npm install -g pnpm

# Copiar frontend compilado
COPY --from=frontend-build /front/.next ./front/.next
COPY --from=frontend-build /front/public ./front/public
COPY --from=frontend-build /front/next.config.js ./front/next.config.js
COPY --from=frontend-build /front/package.json ./front/package.json
COPY --from=frontend-build /front/pnpm-lock.yaml ./front/pnpm-lock.yaml
RUN cd front && pnpm install --prod

# Copiar backend listo para producción
COPY --from=backend-build /back ./back

# Copiar variables de entorno
COPY front/.env ./front/.env
COPY back/.env ./back/.env

# Copiar script de inicio
COPY start.sh ./start.sh
RUN chmod +x start.sh

# Exponer puertos de Next y Express
EXPOSE 3000 4000

# Comando final
CMD ["./start.sh"]
