#!/bin/sh
set -e

if [ -z "$PORT" ]; then
  PORT=8080
fi

export PORT

envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Generated nginx config:"
cat /etc/nginx/conf.d/default.conf

echo "Files in nginx html root:"
ls -la /usr/share/nginx/html/ | head -20

echo "Starting nginx on port $PORT with pid 1"
exec nginx -g 'daemon off;'
