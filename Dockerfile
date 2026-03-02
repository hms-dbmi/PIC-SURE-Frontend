# Step 1: Build the app with node
FROM node:25.6.1-alpine3.23 AS builder
RUN npm install -g pnpm@latest-10

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .
RUN pnpm install --prod
COPY src src
COPY static static
COPY .env svelte.config.js vite.config.ts .
RUN pnpm build

# Step 2: Serve the app with httpd
FROM httpd:2.4.66-alpine3.23

# -------------------------- CUSTOM OpenSSL patch ---------------------------- #
# https://github.com/openssl/openssl/releases/tag/openssl-3.6.1
# https://github.com/openssl/openssl/blob/openssl-3.6.1/INSTALL.md

# Install build dependencies (make, gcc, perl, etc. are not included in the base image)
RUN apk add --no-cache --virtual .build-deps \
        build-base \
        linux-headers \
        perl \
        curl \
    # Download OpenSSL 3.6.1 source from GitHub releases
    && curl -fSL "https://github.com/openssl/openssl/releases/download/openssl-3.6.1/openssl-3.6.1.tar.gz" \
        -o /tmp/openssl-3.6.1.tar.gz \
    # Verify download integrity against the published SHA-256 checksum
    && echo "b1bfedcd5b289ff22aee87c9d600f515767ebf45f77168cb6d64f231f518a82e  /tmp/openssl-3.6.1.tar.gz" | sha256sum -c - \
    && cd /tmp \
    && tar xzf openssl-3.6.1.tar.gz \
    && cd openssl-3.6.1 \
    # Configure OpenSSL
    #   --openssldir=/etc/ssl  -> reuse Alpine's existing CA cert bundle so TLS trust keeps working
    && ./Configure \
        --prefix=/usr/local \
        --openssldir=/etc/ssl \
        --libdir=lib \
        shared \
    # Build and install (install_sw skips docs for a smaller image)
    && make -j "$(nproc)" \
    && make install_sw \
    # Update the shared library search path (detect arch automatically for x86_64 vs aarch64)
    # IMPORTANT: must include /lib and /usr/lib too, otherwise system libraries (libapk, libz, etc.) break
    && MUSL_ARCH="$(uname -m)" \
    && printf '/usr/local/lib\n/lib\n/usr/lib\n' > "/etc/ld-musl-${MUSL_ARCH}.path" \
    # Clean up build artifacts and dependencies to keep image small
    && cd / \
    && rm -rf /tmp/openssl-3.6.1 /tmp/openssl-3.6.1.tar.gz \
    && apk del .build-deps

# Verify the installation
RUN /usr/local/bin/openssl version
# ------------------------ END CUSTOM OpenSSL patch -------------------------- #

RUN apk add --update sed nodejs supervisor

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
