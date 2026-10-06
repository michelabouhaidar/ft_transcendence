# Stage 1: Build React Frontend
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies exactly as locked (npm ci)
COPY apps/frontend/package*.json ./apps/frontend/
RUN cd apps/frontend && npm ci

# Copy source code and configurations
COPY apps/frontend ./apps/frontend
WORKDIR /app/apps/frontend
RUN if [ -d "src" ]; then npm run build; else mkdir -p dist && echo "<h1>Trenno Frontend Initialized</h1>" > dist/index.html; fi

# Stage 2: Serve Frontend SPA via Nginx
FROM nginx:1.27-alpine

COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
