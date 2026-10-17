// Name of the cookie e2e tests use to override the server-side config cache on a
// per-request basis (see src/routes/+layout.server.ts). Only honored when
// import.meta.env.MODE === 'test'.
//
// This lives in its own zero-dependency file, not src/lib/server/configCache.ts,
// because Playwright's test-file transform doesn't polyfill import.meta.env the way
// Vite does - configCache.ts reads import.meta.env.VITE_API_CONFIG_FEATURES at module
// top level, which throws when imported directly from Playwright test code
// (tests/end-to-end/custom-context.ts imports this constant).
export const TEST_CONFIG_COOKIE = 'picsure-test-config';
