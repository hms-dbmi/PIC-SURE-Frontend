<script lang="ts">
  import { createInstance } from '$lib/AuthProviderRegistry';
  import type { AuthData } from '$lib/models/AuthProvider';
  import { resetSearch } from '$lib/stores/Search';

  export let buttonText = 'Log In';
  export let redirectTo = '/';
  export let provider: AuthData;
  export let helpText: string;
  $: testId = `login-button-${provider.name?.toLowerCase()}`;

  let login = async (redirectTo: string, providerType: string) => {
    let instance = await createInstance(provider);
    instance.login(redirectTo, providerType).then(() => {
      resetSearch();
    });
  };
</script>

<button
  type="button"
  data-testid={testId}
  class={$$props.class ?? 'btn variant-filled-primary m-1'}
  on:click={() => login(redirectTo, provider.type)}
>
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
