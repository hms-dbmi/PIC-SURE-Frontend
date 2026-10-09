import { defineEnvVars } from '@sveltejs/kit/env';

// Read when the server starts. All are optional: an unset variable becomes '' and the
// routes using it fall back to a default or skip the header it would have set.
export const variables = defineEnvVars({
  LOGGING_API_KEY: { schema: (input) => input ?? '' },
  LOGGING_TARGET: { schema: (input) => input ?? '' },
});
