<script lang="ts">
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { branding, settings } from '$lib/configuration';
  import { log, createLog } from '$lib/logger';

  type Acceptance = 'granted' | 'denied';
  interface Consent {
    ad_storage: Acceptance;
    analytics_storage: Acceptance;
    personalization_storage: Acceptance;
    ad_personalization: Acceptance;
    ad_data: Acceptance;
    ad_user_data: Acceptance;
  }

  const defaultConsent: Consent = {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    personalization_storage: 'denied',
    ad_personalization: 'denied',
    ad_data: 'denied',
    ad_user_data: 'denied',
  };

  const tagManagerSrc = 'https://www.googletagmanager.com/gtag/js?id=';
  const googleTag = settings.google.tagManager;
  const googleAnalyticsID = settings.google.analytics;
  const enablePrompt =
    (googleTag || googleAnalyticsID) &&
    branding?.privacyPolicy?.url &&
    branding?.privacyPolicy?.title;

  let consent: Consent = $state(defaultConsent);
  let consentPrompt: boolean = $state(false);

  function addScriptToHead(id: string, scriptId: string = '') {
    const { head } = document;
    const script = document.createElement('script');
    if (scriptId) script.id = scriptId;
    script.async = true;
    script.src = tagManagerSrc + id;
    head.insertBefore(script, head.firstChild);
  }

  // gtag.js recognizes a command ONLY when the raw `arguments` object is pushed
  // onto dataLayer. Pushing a plain array (e.g. the `_args` rest param) is
  // silently ignored and disables ALL tracking. `_args` exists only to type the
  // call sites below
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function gtag(..._args: any[]) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (!window.dataLayer) window.dataLayer = [];
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  }

  function initialize() {
    // Nothing to load if no tracking IDs are configured.
    if (!googleTag && !googleAnalyticsID) return;

    if (googleTag) {
      addScriptToHead(googleTag, 'tag-manager');
    }

    if (googleAnalyticsID) {
      addScriptToHead(googleAnalyticsID, 'analytics');

      // Send page view to Google Analytics
      gtag('js', new Date());
      gtag('config', googleAnalyticsID, {
        page_title: document.title,
        page_path: page.url.pathname,
      });
    }

    gtag('consent', 'default', consent);
  }

  function updateConsent(accepted: boolean) {
    log(createLog('ACTION', 'consent.update', { accepted }));
    consent = {
      ...consent,
      analytics_storage: accepted ? 'granted' : 'denied',
      personalization_storage: accepted ? 'granted' : 'denied',
    };

    consentPrompt = false;

    try {
      localStorage.setItem('consentMode', JSON.stringify(consent));
    } catch {
      // Storage may be unavailable (sandbox/private mode); the choice still
      // applies for this session via the consent update below.
    }

    // gtag.js is already loaded (initialized on mount); send a consent update
    // rather than re-initializing, which would inject duplicate scripts.
    gtag('consent', 'update', consent);
  }

  // Read persisted consent, failing safe to deny-all on malformed JSON, blocked
  // storage access (sandbox/private mode), or a non-object value. Returns null
  // when no valid consent is stored, so the prompt is (re)shown. This component
  // renders in the root layout, so an unhandled throw here would break hydration.
  function loadConsent(): Consent | null {
    try {
      const stored = localStorage.getItem('consentMode');
      if (!stored) return null;
      const parsed: unknown = JSON.parse(stored);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
      // Merge onto defaults so a valid-but-incomplete value can't yield a malformed consent object.
      return { ...defaultConsent, ...parsed };
    } catch {
      return null;
    }
  }

  onMount(() => {
    const storedConsent = loadConsent();
    consent = storedConsent ?? defaultConsent;

    // Always initialize tracking on load. Consent Mode (set inside initialize)
    // governs granted/denied behavior; gating this on the prompt previously
    // disabled analytics entirely whenever the prompt was not shown.
    initialize();

    // Open the consent prompt only when a privacy policy is configured and the
    // user has not yet made (or no longer has) a valid stored choice.
    if (enablePrompt) {
      consentPrompt = storedConsent === null;
    }
  });

  // Send a page_view on each SvelteKit client-side navigation. initialize() only
  // fires once on mount, so without this only the initial document load (and the
  // server redirects to /explorer and /discover) reach GA — SPA navigations are
  // never tracked. Skip the initial 'enter' navigation, already counted by the
  // gtag('config', ...) call in initialize().
  afterNavigate((navigation) => {
    if (navigation.type === 'enter' || !googleAnalyticsID) return;
    gtag('event', 'page_view', {
      page_title: document.title,
      page_path: page.url.pathname,
      page_location: page.url.href,
    });
  });
</script>

{#if enablePrompt && consentPrompt}
  <!-- Google Tag Manager (noscript) -->
  <noscript>
    <iframe
      src="https://www.googletagmanager.com/ns.html?id={googleTag}"
      title="googleTagManger"
      height="0"
      width="0"
      style="display:none;visibility:hidden"
    ></iframe>
  </noscript>
  <!-- End Google Tag Manager (noscript) -->
  <div
    data-testid="consentModal"
    class="fixed"
    style="left: 5%; bottom: 60px; z-index: 1000; width: 90%"
  >
    <div class="bg-surface-50-950 p-4 rounded-container shadow-2xl">
      <div class="flex flex-row justify-between items-center">
        <div class="flex items center">
          <p>
            We use cookies to provide you with the best possible experience and to help us make the
            site more useful to visitors. To learn more, please visit our <a
              href={branding?.privacyPolicy?.url}
              target="_blank"
              class="anchor">{branding?.privacyPolicy?.title}</a
            >.
          </p>
        </div>
        <div class="flex flex-col justify-center">
          <button
            data-testid="acceptGoogleConsent"
            class="btn preset-filled-primary-500 mt-1 mb-1"
            onclick={() => updateConsent(true)}>Accept</button
          >
          <button
            data-testid="rejectGoogleConsent"
            class="btn preset-tonal-primary border border-primary-500 mt-1 mb-1 self-center"
            onclick={() => updateConsent(false)}>Reject</button
          >
        </div>
      </div>
    </div>
  </div>
{/if}
