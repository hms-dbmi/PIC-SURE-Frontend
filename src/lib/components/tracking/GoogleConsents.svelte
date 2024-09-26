<script lang="ts">
  import { onMount } from 'svelte';
  import { gtag } from 'gtagjs';
  import { branding } from '$lib/configuration';
  $: googleConsentVisible = false;

  function setUsersGoogleConsent(wasAccepted: boolean) {
    let consent = {
      'ad_storage': wasAccepted ? 'granted' : 'denied',
      'analytics_storage': wasAccepted ? 'granted' : 'denied',
      'personalization_storage': wasAccepted ? 'granted' : 'denied',
      'security_storage': wasAccepted ? 'granted' : 'denied',
      'ad_personalization': wasAccepted ? 'granted' : 'denied',
      'ad_data': wasAccepted ? 'granted' : 'denied',
    };

    gtag('consent', 'default', consent);
    localStorage.setItem('consentMode', JSON.stringify(consent));
    googleConsentVisible = false;
  }

  onMount(() => {
    console.debug('Google Consent Mode');
    let consentMode = localStorage.getItem('consentMode');
    if (!consentMode) {
      googleConsentVisible = true;
    }
  });
</script>

{#if googleConsentVisible && branding?.privacyPolicy?.url && branding?.privacyPolicy?.title}
  <div
    data-testid="consentModal"
    class="fixed"
    style="left: 5%; bottom: 60px; z-index: 1000; width: 90%"
  >
    <div
      class="bg-surface-50-900-token p-4 rounded-container-token shadow-2xl"
    >
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
            data-testid="acceptGoogleConsent" class="btn variant-filled-primary mt-1 mb-1"
            on:click={() => setUsersGoogleConsent(true)}>Accept</button
          >
          <button
            data-testid="rejectGoogleConsent"
            class="btn variant-ghost-primary mt-1 mb-1 self-center"
            on:click={() => setUsersGoogleConsent(false)}>Reject</button
          >
        </div>
      </div>
    </div>
  </div>
{/if}
