# Dockerfile pour le Backend API e-EnergieTEC (Node.js 20)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["npx", "tsx", "server.ts"]
