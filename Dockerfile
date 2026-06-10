# Step 1: Build the app with node
FROM node:24.14.1-alpine3.23@sha256:01743339035a5c3c11a373cd7c83aeab6ed1457b55da6a69e014a95ac4e4700b AS builder
RUN apk add --no-cache pnpm

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN CI=true pnpm install
COPY src src
COPY static static
COPY .env svelte.config.js tsconfig.json vite.config.ts ./
ARG THEME=picsure
RUN sed -i 's/%sveltekit.assets%\/favicon.ico/%sveltekit.assets%\/'$THEME'-favicon.png/' ./src/app.html \
  && sed -i 's/data-theme="[^"]*"/data-theme=\"'$THEME'\"/' ./src/app.html
RUN pnpm build \
  && pnpm prune --prod

# Step 2: Serve the app with httpd
FROM httpd:2.4.67-alpine3.23@sha256:0136c2d4462f3b8ecc92bea70efdfef4d06523999ae8d7aa533969dea6db4576

# Keeping these unpinned reduces the risk of alpine pulling the image and breaking deployment
RUN apk add --no-cache \
  libexpat \
  nodejs \
  openssl \
  sed \
  supervisor \
  zlib

RUN mkdir -p ${HTTPD_PREFIX}/cert /usr/local/apache2/logs/ssl_mutex \
  && sed -i '/^#Include conf.extra.httpd-vhosts.conf/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf \
  && sed -i '/^#LoadModule proxy_module/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf \
  && sed -i '/^#LoadModule proxy_http_module/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf \
  && sed -i '/^#LoadModule proxy_connect_module/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf \
  && sed -i '/^#LoadModule ssl_module modules\/mod_ssl.so/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf \
  && sed -i '/^#LoadModule rewrite_module modules\/mod_rewrite.so/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf \
  && sed -i '/^#LoadModule socache_shmcb_module modules\/mod_socache_shmcb.so/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf \
  && sed -i 's/Options Indexes FollowSymLinks/Options -Indexes +FollowSymLinks/' ${HTTPD_PREFIX}/conf/httpd.conf

WORKDIR /app
RUN mkdir -p logs
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .
ENV NODE_ENV=production
ENV XFF_DEPTH=1
ENV HOME=/tmp
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
RUN chown -R daemon:daemon /app ${HTTPD_PREFIX}/logs ${HTTPD_PREFIX}/cert
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO /dev/null --no-check-certificate https://0.0.0.0:443/picsure/health || exit 1
USER daemon
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
