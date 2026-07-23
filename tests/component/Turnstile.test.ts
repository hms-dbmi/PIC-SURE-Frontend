// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';

import Turnstile from '$lib/components/Turnstile.svelte';

const SITEKEY = '1x00000000000000000000AA';

describe('Turnstile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document
      .querySelectorAll('script[src*="challenges.cloudflare.com"]')
      .forEach((s) => s.remove());
  });

  describe('with the Turnstile API already loaded', () => {
    type RenderOptions = {
      sitekey: string;
      action: string;
      theme: string;
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    };
    let renderOptions: RenderOptions | undefined;
    const turnstileRender = vi.fn((_container: HTMLElement, options: RenderOptions) => {
      renderOptions = options;
      return 'widget-1';
    });
    const turnstileRemove = vi.fn();

    beforeEach(() => {
      renderOptions = undefined;
      vi.stubGlobal('turnstile', { render: turnstileRender, remove: turnstileRemove });
    });

    it('renders the widget with the sitekey and action', async () => {
      render(Turnstile, { props: { sitekey: SITEKEY, onToken: vi.fn() } });

      await waitFor(() => expect(turnstileRender).toHaveBeenCalledTimes(1));
      expect(screen.getByTestId('turnstile-widget')).toBeInTheDocument();
      expect(renderOptions).toMatchObject({
        sitekey: SITEKEY,
        action: 'generate-api-key',
        theme: 'auto',
      });
    });

    it('reports tokens, expiry, and widget errors through onToken', async () => {
      const onToken = vi.fn();
      const onError = vi.fn();
      render(Turnstile, { props: { sitekey: SITEKEY, onToken, onError } });
      await waitFor(() => expect(turnstileRender).toHaveBeenCalledTimes(1));

      renderOptions?.callback('turnstile-token-1');
      expect(onToken).toHaveBeenLastCalledWith('turnstile-token-1');

      // expiry is normal token lifecycle, not a failure
      renderOptions?.['expired-callback']();
      expect(onToken).toHaveBeenLastCalledWith(null);
      expect(onError).not.toHaveBeenCalled();

      renderOptions?.callback('turnstile-token-2');
      renderOptions?.['error-callback']();
      expect(onToken).toHaveBeenLastCalledWith(null);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('removes the widget on unmount', async () => {
      const { unmount } = render(Turnstile, { props: { sitekey: SITEKEY, onToken: vi.fn() } });
      await waitFor(() => expect(turnstileRender).toHaveBeenCalledTimes(1));

      unmount();

      expect(turnstileRemove).toHaveBeenCalledWith('widget-1');
    });
  });

  describe('script loading', () => {
    it('injects the api.js script once across mounts', async () => {
      render(Turnstile, { props: { sitekey: SITEKEY, onToken: vi.fn() } });
      render(Turnstile, { props: { sitekey: SITEKEY, onToken: vi.fn() } });

      await waitFor(() => {
        expect(document.querySelectorAll('script[src*="challenges.cloudflare.com"]')).toHaveLength(
          1,
        );
      });
    });

    it('reports the failure and removes the dead script tag when loading fails', async () => {
      const onToken = vi.fn();
      const onError = vi.fn();
      render(Turnstile, { props: { sitekey: SITEKEY, onToken, onError } });

      const script = await waitFor(() => {
        const found = document.querySelector('script[src*="challenges.cloudflare.com"]');
        expect(found).not.toBeNull();
        return found as HTMLScriptElement;
      });
      script.dispatchEvent(new Event('error'));

      await waitFor(() => expect(onToken).toHaveBeenCalledWith(null));
      expect(onError).toHaveBeenCalled();
      // a failed script element never re-fires events; it must be gone so a remount can retry
      expect(document.querySelector('script[src*="challenges.cloudflare.com"]')).toBeNull();
    });

    it('retries with a fresh script tag on mount after a failed load', async () => {
      const first = render(Turnstile, { props: { sitekey: SITEKEY, onToken: vi.fn() } });
      const script = await waitFor(() => {
        const found = document.querySelector('script[src*="challenges.cloudflare.com"]');
        expect(found).not.toBeNull();
        return found as HTMLScriptElement;
      });
      script.dispatchEvent(new Event('error'));
      await waitFor(() =>
        expect(document.querySelector('script[src*="challenges.cloudflare.com"]')).toBeNull(),
      );
      first.unmount();

      render(Turnstile, { props: { sitekey: SITEKEY, onToken: vi.fn() } });

      await waitFor(() => {
        expect(document.querySelectorAll('script[src*="challenges.cloudflare.com"]')).toHaveLength(
          1,
        );
      });
    });
  });
});
