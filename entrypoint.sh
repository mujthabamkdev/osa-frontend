#!/bin/sh
set -e

if [ -z "$PORT" ]; then
  PORT=80
fi

export PORT

envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Starting nginx on port $PORT"
echo "----- Rendered nginx config -----"
cat /etc/nginx/conf.d/default.conf || true
echo "-----------------------------------"
exec nginx -g 'daemon off;'
