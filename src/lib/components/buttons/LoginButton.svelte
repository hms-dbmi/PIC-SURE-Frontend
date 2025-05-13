<script lang="ts">
  import { createInstance } from '$lib/AuthProviderRegistry';
  import type { AuthData } from '$lib/models/AuthProvider';
  import { resetSearch } from '$lib/stores/Search';

  interface Props {
    provider: AuthData;
    helpText: string;
    buttonText?: string;
    redirectTo?: string;
    class?: string;
  }

  const {
    provider,
    helpText,
    buttonText = 'Log In',
    redirectTo = '/',
    class: className = '',
  }: Props = $props();

  const testId = `login-button-${provider.name?.toLowerCase()}`;

  let imageSrc: string | undefined = $state(undefined);

  let login = async (redirectTo: string, providerType: string) => {
    let instance = await createInstance(provider);
    instance.login(redirectTo, providerType).then(() => {
      resetSearch();
    });
  };

  if (provider.imagesrc) {
    imageSrc = './' + provider.imagesrc;
  }
</script>

<button
  type="button"
  data-testid={testId}
  class={className ?? 'btn preset-filled-primary-500 m-1'}
  onclick={(e: Event) => {
    e.stopImmediatePropagation();
    login(redirectTo, provider.type);
  }}
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
