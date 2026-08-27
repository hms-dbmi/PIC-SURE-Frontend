/**
 * SvelteKit only writes its nonce into `style-src` from `add_style()`, which fires when it emits
 * an inline `<style>` of its own - and at the default `inlineStyleThreshold: 0` it never does. So
 * the directive ships as bare `'self'`. `app.html` seeds Plotly's global stylesheet element with
 * `%sveltekit.nonce%` (Plotly writes its rules into an element it finds rather than creating an
 * unnonced one), and without the matching source in `style-src` that seed is blocked and the
 * rules are dropped silently.
 *
 * Returns the policy unchanged when there is nothing to do, so callers can assign the result
 * unconditionally.
 */
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

/**
 * Describes why the emitted policy cannot authorise the `<style>` element `app.html` seeds for
 * Plotly, or returns null when it can.
 *
 * That seed is the only thing keeping Plotly's ~53 global rules working under a strict style-src,
 * and every way it breaks is silent: the rules simply stop applying and charts render subtly
 * wrong. Two realistic edits cause it - removing `style-src` from `kit.csp` so it falls back to
 * `default-src`, or adding `'unsafe-inline'` to `script-src`, which stops SvelteKit emitting a
 * nonce anywhere. Neither produces an error on its own.
 */
export function findStyleNonceProblem(csp: string | null): string | null {
  if (!csp) return null;

  const styleSrc = /(?:^|;\s*)style-src ([^;]*)/.exec(csp)?.[1];
  if (!styleSrc) return 'the policy declares no style-src directive';

  // SvelteKit relaxes style-src to 'unsafe-inline' in dev, where the seed needs no nonce.
  if (styleSrc.includes("'unsafe-inline'")) return null;

  if (!styleSrc.includes("'nonce-")) return 'style-src carries no nonce';

  return null;
}
