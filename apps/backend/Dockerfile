FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Install dependencies exactly as locked (npm ci)
COPY apps/backend/package*.json ./apps/backend/
RUN cd apps/backend && npm ci

# Copy source code and configurations
COPY apps/backend ./apps/backend

# Build the backend if source files exist, or create starter placeholder
WORKDIR /app/apps/backend
RUN if [ -d "./prisma" ]; then npx prisma generate; fi
RUN if [ -f "tsconfig.json" ] && [ -d "src" ]; then npx tsc; else mkdir -p dist && echo 'console.log("[Backend Service] Server initialized. Awaiting implementation."); setInterval(() => {}, 60000);' > dist/index.js; fi

# Runner stage
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3000

# Built artifacts and their dependencies
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/backend/package*.json ./apps/backend/
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/docker-entrypoint.sh ./apps/backend/docker-entrypoint.sh

# Create uploads directory for physical volume mount
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

WORKDIR /app/apps/backend

RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
