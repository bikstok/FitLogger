# Multi-stage Dockerfile: build Svelte client, then build server and copy client dist

# Stage 1: build client
FROM node:20-alpine AS client-build
WORKDIR /app/fitness-client
COPY fitness-client/package*.json ./
RUN npm ci --silent
COPY fitness-client/ .
RUN npm run build

# Stage 2: build server
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --silent
COPY server/ .

# Copy built client into server/public
RUN mkdir -p public
COPY --from=client-build /app/fitness-client/dist ./public

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "app.js"]
