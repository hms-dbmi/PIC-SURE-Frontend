export function withStyleNonce(csp: string | null): string | null {
  if (!csp) return csp;

  const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];
  if (!nonce) return csp;

  return csp.replace(/(^|;\s*)style-src ([^;]*)/, (match, separator: string, sources: string) => {
    // In dev, SvelteKit deliberately rewrites style-src to 'unsafe-inline' so Vite can inject
    // stylesheets at runtime, and Vite only nonces those when the document carries a
    // meta[property=csp-nonce] - which app.html does not. Adding a nonce here would make the
    // browser ignore 'unsafe-inline' (CSP3) and leave the dev server completely unstyled.
    if (sources.includes("'unsafe-inline'") || sources.includes(`'nonce-${nonce}'`)) return match;
    return `${separator}style-src ${sources} 'nonce-${nonce}'`;
  });
}

export function findStyleNonceProblem(csp: string | null): string | null {
  if (!csp) return null;

  const styleSrc = /(?:^|;\s*)style-src ([^;]*)/.exec(csp)?.[1];
  if (!styleSrc) return 'the policy declares no style-src directive';

  // Dev relaxes style-src to 'unsafe-inline', where the seed needs no nonce.
  if (styleSrc.includes("'unsafe-inline'")) return null;

  if (!styleSrc.includes("'nonce-")) return 'style-src carries no nonce';

  return null;
}
