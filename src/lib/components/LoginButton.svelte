<!-- @migration-task Error while migrating Svelte code: $$props is used together with named props in a way that cannot be automatically migrated. -->
<script lang="ts">
  import { createInstance } from '$lib/AuthProviderRegistry';
  import type { AuthData } from '$lib/models/AuthProvider';
  import { resetSearch } from '$lib/stores/Search';

  let { class: className, buttonText = 'Log In', redirectTo = '/', provider, helpText } = $props();

  const testId = $derived(`login-button-${provider.name?.toLowerCase()}`);

  const login = async (redirectTo: string, providerType: string) => {
    let instance = await createInstance(provider);
    instance.login(redirectTo, providerType).then(() => {
      resetSearch();
    });
  };

  const imageSrc = $derived(provider.imagesrc ? './' + provider.imagesrc : undefined);
</script>

<button
  type="button"
  data-testid={testId}
  class={className ?? 'btn variant-filled-primary m-1'}
  on:click={() => login(redirectTo, provider.type)}
>
  {#if imageSrc}
    <img src={imageSrc} alt={provider.imageAlt} class="mr-2 h-8" />
  {/if}
  {buttonText}
</button>

{#if helpText && !provider.alt}
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  <div class="help-text">{@html helpText}</div>
{/if}

<style>
  .help-text {
    font-size: 0.8rem;
    color: var(--color-gray-500);
  }
</style>
