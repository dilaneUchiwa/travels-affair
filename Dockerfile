FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
# DATABASE_URL (MySQL) est fourni par l'environnement de déploiement (Render).
ENV NODE_ENV=production PORT=3000 UPLOAD_DIR=/data/uploads
COPY --from=build /app ./
RUN mkdir -p /data/uploads
VOLUME /data
EXPOSE 3000
# Applique les migrations (idempotent) puis démarre le serveur
CMD ["sh", "-c", "npx tsx scripts/migrate.ts && npm start"]
