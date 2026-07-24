# Step 1: Build the app with node
FROM node:24.18.0-alpine3.23@sha256:595398b0081eacda8e1c4c5b97b76cd1020e4d58a8ebcb4843b9bca1e79e7436 AS builder
RUN apk add --no-cache pnpm

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN CI=true pnpm install
COPY src src
COPY static static
COPY .env svelte.config.js tsconfig.json vite.config.ts ./
ARG THEME=picsure
RUN sed -i 's/%sveltekit.assets%\/favicon.png/%sveltekit.assets%\/'$THEME'-favicon.png/' ./src/app.html \
  && sed -i 's/data-theme="[^"]*"/data-theme=\"'$THEME'\"/' ./src/app.html
RUN pnpm build \
  && pnpm prune --prod

# Step 2: Serve the app with httpd
FROM httpd:2.4.68-alpine3.23@sha256:4a15e9c73f25334bc03cfb3c692c9adfc103bb46ca89cee1f0b9a5fcbc7b21f6

# apk pins rot (Alpine keeps only the newest package per branch), so the base
# image's own libs are refreshed via the weekly digest bumps instead. node is
# copied from the digest-pinned builder so build and runtime cannot drift.
RUN apk add --no-cache \
  libstdc++ \
  supervisor
COPY --from=builder /usr/local/bin/node /usr/local/bin/node

COPY httpd-picsure.conf ${HTTPD_PREFIX}/conf/extra/httpd-picsure.conf
RUN mkdir -p ${HTTPD_PREFIX}/cert /usr/local/apache2/logs/ssl_mutex \
  && echo "Include conf/extra/httpd-picsure.conf" >> ${HTTPD_PREFIX}/conf/httpd.conf \
  && httpd -t \
  && httpd -M | grep -q proxy_http_module \
  && httpd -M | grep -q ssl_module \
  && httpd -M | grep -q rewrite_module \
  && node --version

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
