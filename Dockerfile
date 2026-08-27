# Step 1: Build the app with node
FROM node:24.19.0-alpine3.23@sha256:244cc2b53f46f9e876304391d17682b0ddae9ac33491f4857e25e35a36ba7995 AS builder
RUN apk add --no-cache pnpm

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN CI=true pnpm install
COPY src src
COPY static static
COPY .env svelte.config.js tsconfig.json vite.config.ts ./
# Deployment-specific CSP sources for kit.csp (see svelte.config.js). Empty for BDC and the AIO,
# whose policy the built-in directives already cover; a deployment served across sibling domains
# passes them with --build-arg. Declared ARGs reach the build as environment variables.
ARG CSP_EXTRA_SCRIPT_SRC=""
ARG CSP_EXTRA_STYLE_SRC=""
ARG CSP_EXTRA_IMG_SRC=""
ARG CSP_EXTRA_CONNECT_SRC=""
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
