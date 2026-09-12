FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Build frontend and copy backend files
COPY . .
RUN npm run build

# Production image for RENTEC AMI HES Backend Server
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/server ./server
COPY --from=builder /app/services ./services
COPY --from=builder /app/infrastructure ./infrastructure
COPY --from=builder /app/ami_smart_meter.db ./ami_smart_meter.db
COPY --from=builder /app/.env ./.env

EXPOSE 3000

CMD ["npm", "run", "start:backend"]
