FROM nginx:1.27-alpine

RUN apk add --no-cache openssl apache2-utils

# Copy reverse proxy configuration and TLS initialization entrypoint
COPY nginx.conf /etc/nginx/nginx.conf
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 8443

ENTRYPOINT ["/entrypoint.sh"]
