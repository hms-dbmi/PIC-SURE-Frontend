# Step 1: Build the app with node
FROM node:24.21.0-alpine3.23@sha256:159fe64649038c30f8cc1ec4be3af3a6e93e3648678c31294e2c5058dbeb99f3 AS builder
RUN apk add --no-cache pnpm

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN CI=true pnpm install
COPY src src
COPY static static
COPY .env svelte.config.js tsconfig.json vite.config.ts ./
ARG CSP_EXTRA_SCRIPT_SRC=""
ARG CSP_EXTRA_STYLE_SRC=""
ARG CSP_EXTRA_IMG_SRC=""
ARG CSP_EXTRA_CONNECT_SRC=""
RUN pnpm build \
  && pnpm prune --prod

# Step 2: Serve the app with httpd
FROM httpd:2.4.68-alpine3.23@sha256:4a15e9c73f25334bc03cfb3c692c9adfc103bb46ca89cee1f0b9a5fcbc7b21f6

# Alpine keeps only the newest package per branch, so `apk add pkg=version`
# breaks as soon as that branch moves. Digest bumps do not cover it either: the
# upstream httpd image is rebuilt rarely and its libs drift months behind
# Alpine's published fixes, so upgrade at build time. The httpd and node checks
# below fail the build if an upgrade breaks something. libcurl cannot be dropped
# here even though nothing calls curl: httpd's own mod_md links it, so apk holds
# it for .httpd-so-deps. The upgrade above is what keeps it patched.
# node is copied from the digest-pinned builder so build and runtime cannot drift.
RUN apk upgrade --no-cache \
  && apk add --no-cache \
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
