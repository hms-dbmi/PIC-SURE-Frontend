<script lang="ts">
  import { run } from 'svelte/legacy';

  import { onMount } from 'svelte';
  import { gtag } from 'gtagjs';
  import { branding, settings } from '$lib/configuration';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';

  let googleTag = settings.google.tagManager;
  let googleAnalyticsID = settings.google.analytics;
  let googleConsentVisible = $state(false);
  

  run(() => {
    if (
      googleAnalyticsID &&
      browser &&
      typeof gtag === 'function' &&
      localStorage.getItem('consentMode')?.includes('granted')
    ) {
      // Send page view to Google Analytics
      gtag('js', new Date());
      gtag('config', googleAnalyticsID, {
        page_title: document.title,
        page_path: $page.url.pathname,
      });
    }
  });

  function setUsersGoogleConsent(wasAccepted: boolean) {
    let consent = {
      ad_storage: 'denied',
      analytics_storage: wasAccepted ? 'granted' : 'denied',
      personalization_storage: wasAccepted ? 'granted' : 'denied',
      ad_personalization: 'denied',
      ad_data: 'denied',
      ad_user_data: 'denied',
    };

    gtag('consent', 'update', consent);
    localStorage.setItem('consentMode', JSON.stringify(consent));
    googleConsentVisible = false;
  }

  onMount(() => {
    let consentMode = localStorage.getItem('consentMode');
    if (!consentMode) {
      googleConsentVisible = true;
    }

    if (consentMode?.includes('granted')) {
      gtag('consent', 'update', JSON.parse(consentMode));
    }
  });
</script>

<svelte:head>
  {#if googleAnalyticsID}
    <script async src="https://www.googletagmanager.com/gtag/js?id={googleAnalyticsID}"></script>
    <script data-analyticsID={googleAnalyticsID}>
      let googleAnalyticsID = document.currentScript.getAttribute('data-analyticsID');
      window.dataLayer = window.dataLayer || [];

      function gtag() {
        dataLayer.push(arguments);
      }

      gtag('js', new Date());
      gtag('config', googleAnalyticsID);

      gtag('consent', 'default', {
        ad_storage: 'denied',
        analytics_storage: 'denied',
        personalization_storage: 'denied',
        ad_personalization: 'denied',
        ad_data: 'denied',
        ad_user_data: 'denied',
      });

      let consents = localStorage.getItem('consentMode');
      if (consents) {
        consents = JSON.parse(consents);
        gtag('consent', 'update', consents);
      }
    </script>
  {/if}
  {#if googleTag}
    <script data-googleTag={googleTag}>
      let googleTag = document.currentScript.getAttribute('data-googleTag');

      (function (w, d, s, l, i) {
        w[l] = w[l] || [];
        w[l].push({
          'gtm.start': new Date().getTime(),
          event: 'gtm.js',
        });
        var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s),
          dl = l != 'dataLayer' ? '&l=' + l : '';
        j.async = true;
        j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
        f.parentNode.insertBefore(j, f);
      })(window, document, 'script', 'dataLayer', googleTag);
    </script>
  {/if}
</svelte:head>

{#if googleTag && googleConsentVisible && branding?.privacyPolicy?.url && branding?.privacyPolicy?.title}
  <div
    data-testid="consentModal"
    class="fixed"
    style="left: 5%; bottom: 60px; z-index: 1000; width: 90%"
  >
    <div class="bg-surface-50-900-token p-4 rounded-container-token shadow-2xl">
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
            class="btn variant-filled-primary mt-1 mb-1"
            onclick={() => setUsersGoogleConsent(true)}>Accept</button
          >
          <button
            data-testid="rejectGoogleConsent"
            class="btn variant-ghost-primary mt-1 mb-1 self-center"
            onclick={() => setUsersGoogleConsent(false)}>Reject</button
          >
        </div>
      </div>
    </div>
  </div>
{/if}
