<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import { config } from '$lib/configuration.svelte';
  import { log, createLog } from '$lib/logger';

  let open = $state(false);
  let pendingUrl: string | null = $state(null);
  let openInNewTab = $state(false);

  const cfg = $derived(config.branding.externalLinkWarning);
  const title = $derived(cfg.title || `Leaving ${config.branding.applicationName}`);
  const message = $derived(
    cfg.message || `Are you sure you want to leave ${config.branding.applicationName}?`,
  );
  const newTabMessage = $derived(
    cfg.newTabMessage || 'This external website will be opened as a new tab in your browser.',
  );

  function intercept(event: MouseEvent) {
    if (event.type === 'auxclick' && event.button !== 1) return;
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute('download')) return;
    let url: URL;
    try {
      url = new URL(anchor.href);
    } catch {
      return;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    if (url.host === window.location.host) return;
    // Capture-phase preventDefault stops navigation, but the anchor's own click
    // handlers still run — a cancelled navigation still emits link_click logs.
    event.preventDefault();
    openInNewTab =
      anchor.target === '_blank' ||
      event.type === 'auxclick' ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey;
    pendingUrl = url.href;
    open = true;
    log(
      createLog('NAVIGATION', 'external_link.warning_shown', {
        url: pendingUrl,
        newTab: openInNewTab,
      }),
    );
  }

  function proceed() {
    const url = pendingUrl;
    if (!url) return;
    // Firefox's window.open() spins the event loop, which flushes the cancellation.
    pendingUrl = null;
    log(
      createLog('NAVIGATION', 'external_link.confirmed', {
        url,
        newTab: openInNewTab,
      }),
      { keepalive: true },
    );
    if (openInNewTab) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.assign(url);
    }
  }

  $effect(() => {
    if (!open && pendingUrl) {
      log(createLog('NAVIGATION', 'external_link.cancelled', { url: pendingUrl }));
      pendingUrl = null;
    }
  });
</script>

<svelte:window onclickcapture={intercept} onauxclickcapture={intercept} />

<Modal
  bind:open
  withDefault
  {title}
  cancelText={cfg.cancelText || 'Cancel'}
  confirmText={cfg.okText || 'OK'}
  onconfirm={proceed}
  data-testid="external-link-warning"
>
  <p>
    {message}{#if openInNewTab}&nbsp;{newTabMessage}{/if}
  </p>
</Modal>
