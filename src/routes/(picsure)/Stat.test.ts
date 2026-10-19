import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';

import Stat from './Stat.svelte';

// Render as the server does, where `browser` is false
vi.mock('$app/env', () => ({ browser: false }));

describe('landing Stat server render', () => {
  it('sanitises the admin-supplied description', () => {
    const { body } = render(Stat, {
      props: {
        stats: [],
        description: '<p>Welcome</p><img src="x" onerror="alert(1)"><script>alert(2)</script>',
      },
    });

    expect(body).toContain('<p>Welcome</p>');
    expect(body).not.toContain('onerror');
    expect(body).not.toContain('<script>');
  });
});
