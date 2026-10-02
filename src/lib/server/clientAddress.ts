// With ADDRESS_HEADER set (see the Dockerfile), adapter-node's getClientAddress() reads
// X-Forwarded-For and throws when a request lacks it, which only happens when something
// reaches node without going through httpd. Treat that as an unknown address instead.
export function clientAddress(getClientAddress: () => string): string | undefined {
  try {
    return getClientAddress();
  } catch {
    return undefined;
  }
}
