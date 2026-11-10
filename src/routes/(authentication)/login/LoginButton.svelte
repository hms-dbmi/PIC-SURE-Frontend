<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import type { ButtonSize, ButtonVariant } from '#lib/ui/button.ts';

  import { createInstance } from '#lib/auth/providerRegistry.ts';
  import { sanitizeHTML } from '#lib/utils/html.ts';
  import type { AuthData } from '#lib/auth/providers/AuthProvider.ts';
  import { explorerSearch } from '#lib/explorer/search.svelte.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  interface Props {
    provider: AuthData | undefined;
    helpText?: string;
    buttonText?: string;
    redirectTo?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    class?: string;
  }

  const {
    provider,
    helpText,
    buttonText = 'Log In',
    redirectTo = '/',
    variant = 'filled',
    size = 'md',
    class: className = '',
  }: Props = $props();

  const testId = $derived(`login-provider-${provider?.name?.toLowerCase()}`);
  let imageSrc: string | undefined = $derived(
    provider?.imagesrc ? './' + provider.imagesrc : undefined,
  );
  const help = $derived(sanitizeHTML(helpText ?? ''));

  let login = async (redirectTo: string, providerType: string) => {
    log(
      createLog(
        'AUTH_LOGIN',
        'login.click',
        { provider: providerType },
        { idp: provider?.name ?? undefined },
      ),
    );
    let instance = await createInstance(provider!);
    instance.login(redirectTo, providerType).then(() => {
      explorerSearch.reset();
    });
  };
</script>

{#if provider}
  <Button
    data-testid={testId}
    {variant}
    {size}
    class={className}
    onclick={(e: Event) => {
      e.stopImmediatePropagation();
      login(redirectTo, provider!.type);
    }}
  >
    {#if imageSrc}
      <img src={imageSrc} alt={provider!.imagealt} class="mr-2 h-8" />
    {/if}
    <span>{buttonText}</span>
  </Button>

  {#if helpText && !provider?.alt}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <div class="help-text">{@html help}</div>
  {/if}
{:else}
  <Button
    class="m-1 w-full"
    disabled
    title="No provider selected"
    aria-label="No provider selected. Please select a provider from the dropdown menu above."
  >
    <span>Login</span>
  </Button>
{/if}

<style>
  .help-text {
    font-size: 0.8rem;
    color: var(--color-gray-500);
  }
</style>
