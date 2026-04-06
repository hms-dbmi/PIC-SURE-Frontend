# Step 1: Build the app with node
FROM node:25.9.0-alpine3.23@sha256:ad82ecad30371c43f4057aaa4800a8ed88f9446553a2d21323710c7b937177fc AS builder
RUN npm install -g pnpm@10.24.0

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .
RUN pnpm install --prod
COPY src src
COPY static static
COPY .env svelte.config.js vite.config.ts ./
ARG THEME=picsure
RUN sed -i 's/%sveltekit.assets%\/favicon.ico/%sveltekit.assets%\/'$THEME'-favicon.png/' ./src/app.html
RUN sed -i 's/data-theme="[^"]*"/data-theme=\"'$THEME'\"/' ./src/app.html
RUN pnpm build

# Step 2: Serve the app with httpd
FROM httpd:2.4.66-alpine3.23@sha256:8f26f33a7002658050e9ab2cd6b77502619dfc89d0a6ba2e9e4a202e0ef04596

RUN apk add --no-cache \
  openssl \
  sed \
  nodejs \
  supervisor \
  libexpat=2.7.5-r0 \
  zlib=1.3.2-r0

RUN mkdir -p ${HTTPD_PREFIX}/cert

RUN sed -i '/^#Include conf.extra.httpd-vhosts.conf/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf

RUN sed -i '/^#LoadModule proxy_module/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf
RUN sed -i '/^#LoadModule proxy_http_module/s/^#//' ${HTTPD_PREFIX}/conf/httpd.conf
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
ENV XFF_DEPTH=1
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO /dev/null --no-check-certificate https://0.0.0.0:443/picsure/health || exit 1
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
