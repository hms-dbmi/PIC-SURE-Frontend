<script lang="ts">
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../app.postcss';
  import { initializeStores } from '@skeletonlabs/skeleton';
  import { initializeBranding } from '$lib/configuration';
  import { settings } from '$lib/configuration';
  import GoogleAnalytics from '$lib/components/tracking/GoogleAnalytics.svelte';
  import GoogleConsents from '$lib/components/tracking/GoogleConsents.svelte';
  import GoogleTagManger from '$lib/components/tracking/GoogleTagManger.svelte';
  let googleTagManagerId = settings.google.tagManager;
  import { beforeNavigate } from '$app/navigation';
  import { hasInvalidFilter, hasGenomicFilter, hasUnallowedFilter } from '$lib/stores/Filter.ts';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import FilterWarning from '$lib/components/FilterWarning.svelte';

  
  initializeStores();
  initializeBranding();
  const modalStore = getModalStore();
  beforeNavigate((nav) => {
    console.log(nav);
    if ($hasInvalidFilter && nav?.to?.url.pathname.includes('/explorer')) {
      modalStore.trigger({
        type: 'component',
        component: 'modalWrapper',
        meta: { component: FilterWarning, width: 'w-3/4' },
      });
    } else if (($hasGenomicFilter || $hasUnallowedFilter) && nav?.to?.url.pathname.includes('/discover')) {
      modalStore.trigger({
          type: 'component',
          component: 'modalWrapper',
          meta: { component: FilterWarning, width: 'w-3/4' },
        });
      }
  });
</script>

<main class="w-full h-full">
  <!-- Google Tag Manager (noscript) -->
  <noscript>
    <iframe
      title="googleTagManager"
      src="https://www.googletagmanager.com/ns.html?id={googleTagManagerId}"
      height="0"
      width="0"
      style="display:none;visibility:hidden"
    ></iframe>
  </noscript>
  <!-- End Google Tag Manager (noscript) -->
  <slot />
  <GoogleConsents />
</main>
<GoogleAnalytics />
<GoogleTagManger />
