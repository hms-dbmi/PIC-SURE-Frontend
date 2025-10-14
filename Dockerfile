# Step 1: Build the app with node
FROM node:23.3.0-alpine3.19 AS builder
RUN npm install -g pnpm@latest-10

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .
RUN pnpm install --prod
COPY src src
COPY static static
COPY .env svelte.config.js vite.config.ts .
RUN pnpm build

# Step 2: Serve the app with httpd
FROM httpd:2.4.65-alpine

RUN apk add --update openssl sed nodejs supervisor

RUN mkdir -p ${HTTPD_PREFIX}/cert

RUN sed -i '/^#Include conf.extra.httpd-vhosts.conf/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf
RUN sed -i '/^#LoadModule proxy_module/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf
RUN sed -i  '/^#LoadModule proxy_http_module/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf
RUN sed -i '/^#LoadModule proxy_connect_module/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf
RUN sed -i '/^#LoadModule ssl_module modules\/mod_ssl.so/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf
RUN sed -i '/^#LoadModule rewrite_module modules\/mod_rewrite.so/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf
RUN sed -i '/^#LoadModule socache_shmcb_module modules\/mod_socache_shmcb.so/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf
RUN mkdir -p /usr/local/apache2/logs/ssl_mutex
RUN sed -i 's/Options Indexes FollowSymLinks/Options -Indexes +FollowSymLinks/' ${HTTPD_PREFIX}/conf/httpd.conf

WORKDIR /app
RUN mkdir -p logs
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .
ENV NODE_ENV=production
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
