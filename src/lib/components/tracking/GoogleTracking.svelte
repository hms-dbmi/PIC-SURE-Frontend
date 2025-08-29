<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { branding, settings } from '$lib/stores/Configuration';

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
  const googleTag = $settings.google.tagManager;
  const googleAnalyticsID = $settings.google.analytics;
  const enablePrompt = googleTag && $branding.privacyPolicy.url && $branding.privacyPolicy.title;

  let consent: Consent = $state(defaultConsent);
  let consentPrompt: boolean = $state(false);
  let consentGranted: boolean = $derived(
    [consent.personalization_storage, consent.analytics_storage].includes('granted'),
  );

  function addScriptToHead(id: string, scriptId: string = '') {
    const { head } = document;
    const script = document.createElement('script');
    if (scriptId) script.id = scriptId;
    script.async = true;
    script.src = tagManagerSrc + id;
    head.insertBefore(script, head.firstChild);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  function gtag(command: string, ...arg: any[]) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (!window.dataLayer) window.dataLayer = [];
    window.dataLayer.push(arguments);
  }

  function initialize() {
    if (!consentGranted) return;

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
    consent = {
      ...consent,
      analytics_storage: accepted ? 'granted' : 'denied',
      personalization_storage: accepted ? 'granted' : 'denied',
    };

    consentPrompt = false;

    localStorage.setItem('consentMode', JSON.stringify(consent));

    initialize();
  }

  onMount(() => {
    const localConsent = localStorage.getItem('consentMode') || '';
    consent = localConsent ? JSON.parse(localConsent) : defaultConsent;

    if (enablePrompt) {
      // Open prompt if no local consent was saved
      consentPrompt = !localConsent;
      initialize();
    }
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
              href={$branding.privacyPolicy.url}
              target="_blank"
              class="anchor">{$branding.privacyPolicy.title}</a
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
