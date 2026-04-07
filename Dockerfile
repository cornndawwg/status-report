FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Prisma needs OpenSSL; postinstall runs `prisma generate` during npm ci
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
# Schema must exist before `npm ci` (postinstall runs prisma generate)
COPY prisma ./prisma
RUN npm ci

COPY . .

RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production node_modules only (full transitive deps for Prisma CLI: effect, c12, …)
FROM node:20-bookworm-slim AS prod-deps
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

FROM node:20-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Standalone bundle (server + traced assets); then replace node_modules with full prod tree
COPY --from=builder /app/.next/standalone ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Full node_modules makes `node node_modules/prisma/build/index.js` resolve effect, c12, …
CMD ["sh", "-c", "node ./node_modules/prisma/build/index.js migrate deploy && node server.js"]
