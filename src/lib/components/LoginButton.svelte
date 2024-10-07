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

  // Import images from the assets directory
  const images = import.meta.glob('../assets/login/*.{png,jpg,jpeg,svg}', {
    eager: true,
    as: 'url',
  });

  // Create a mapping from filenames to URLs
  const imageMap: Record<string, string> = {};
  for (const path in images) {
    const filename = path.split('/').pop();
    if (filename) {
      imageMap[filename] = images[path];
    }
  }

  console.log(provider);
  let imageSrc: string | undefined = undefined;
  if (provider.imagesrc) {
    imageSrc = imageMap[provider.imagesrc];
  }

  console.log('imageSrc', imageSrc);
</script>

<button
  type="button"
  data-testid={testId}
  class={$$props.class ?? 'btn variant-filled-primary m-1'}
  on:click={() => login(redirectTo, provider.type)}
>
  {#if imageSrc}
    <img src={imageSrc} alt={provider.imageAlt} class="h-8 mr-2" />
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
