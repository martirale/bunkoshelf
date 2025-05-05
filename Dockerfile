# Etapa 1: Construcción del frontend (Next.js)
FROM node:20-alpine AS frontend-build

# Establecer directorio de trabajo
WORKDIR /app

# Instalar PNPM
RUN npm install -g pnpm

# Copiar el código del frontend y backend
COPY front/package.json front/pnpm-lock.yaml ./
RUN pnpm install

COPY front/ ./
RUN pnpm run build

# Etapa 2: Backend (Express)
FROM node:20-alpine AS backend-build

# Establecer directorio de trabajo para el backend
WORKDIR /app

# Instalar PNPM
RUN npm install -g pnpm

# Copiar el código del backend
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install

COPY backend/ ./

# Etapa 3: Creación de la imagen final
FROM node:20-alpine

# Establecer directorio de trabajo para el contenedor final
WORKDIR /app

# Copiar el frontend construido
COPY --from=frontend-build /app/.next /app/.next

# Copiar el backend
COPY --from=backend-build /app /app

# Instalar dependencias (aunque ya debería estar hecho, pero por si acaso)
RUN pnpm install --prod

# Exponer el puerto para la app (frontend + backend)
EXPOSE 3000 4000

# Comando para iniciar tanto el frontend como el backend
CMD ["pnpm", "run", "start"]
