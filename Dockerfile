FROM node:20-slim

# Para poder ejecutar scripts shell
RUN apt-get update && apt-get install -y openssl bash

# Instalación global de pnpm y pm2
RUN npm install -g pnpm pm2

# Establece el directorio de trabajo
WORKDIR /app

# Copia el código fuente de frontend y backend
COPY ./front /app/front
COPY ./back /app/back

# Copia el script de entrada
COPY entrypoint.sh /app/entrypoint.sh

# Da permisos de ejecución al script
RUN chmod +x /app/entrypoint.sh

# Expone los puertos necesarios
EXPOSE 3000 4000

# Ejecuta el script de entrada
ENTRYPOINT ["/app/entrypoint.sh"]
