#!/bin/sh
set -e

CERT_DIR="/etc/nginx/certs"
CERT_FILE="${CERT_DIR}/localhost.crt"
KEY_FILE="${CERT_DIR}/localhost.key"

echo "[Nginx Entrypoint] Checking TLS certificates in ${CERT_DIR}..."
mkdir -p "${CERT_DIR}"

if [ ! -f "${CERT_FILE}" ] || [ ! -f "${KEY_FILE}" ]; then
  echo "[Nginx Entrypoint] Generating self-signed TLS certificate for localhost..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "${KEY_FILE}" \
    -out "${CERT_FILE}" \
    -subj "/C=LB/ST=Beirut/L=Beirut/O=Trenno/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
  chmod 600 "${KEY_FILE}"
  chmod 644 "${CERT_FILE}"
  echo "[Nginx Entrypoint] Certificate generated successfully."
else
  echo "[Nginx Entrypoint] Existing TLS certificate found."
fi

echo "[Nginx Entrypoint] Starting Nginx reverse proxy over HTTPS..."
exec nginx -g "daemon off;"
