FROM node:20-alpine

# Instalar PNPM globalmente
RUN npm install -g pnpm

# Definir directorio de trabajo
WORKDIR /app

# Copiar frontend (Next.js)
COPY ./front /app/front

# Copiar backend (Express)
COPY ./back /app/back

# Copiar script de inicio
COPY start.sh ./start.sh
RUN chmod +x start.sh

# Exponer puertos de Next y Express
EXPOSE 3000 4000

# Comando final
CMD ["./start.sh"]
