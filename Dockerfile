FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist/osa-frontend/browser /tmp/browser

RUN rm -rf /usr/share/nginx/html/* && \
    cp -r /tmp/browser/* /usr/share/nginx/html/ && \
    rm -rf /tmp/browser
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY entrypoint.sh /entrypoint.sh

RUN apk add --no-cache gettext \
	&& chmod +x /entrypoint.sh

EXPOSE 8080

CMD ["/entrypoint.sh"]