# syntax=docker/dockerfile:1

# ---- 1. Build giao diện React (Vite) ----
FROM node:22-alpine AS client
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY client/ ./
RUN npm run build

# ---- 2. Thư viện chạy của API ----
FROM node:22-alpine AS server-deps
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---- 3. Ảnh chạy: Express phục vụ cả API lẫn bản build React ----
FROM node:22-alpine
ENV NODE_ENV=production \
    PORT=4000 \
    PUBLIC_DIR=/app/public
WORKDIR /app/server
COPY --from=server-deps /app/server/node_modules ./node_modules
COPY server/package.json ./
COPY server/src ./src
COPY server/seed ./seed
COPY --from=client /app/client/dist /app/public
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/api/health | grep -q '"ok":true' || exit 1
CMD ["node", "src/index.js"]
