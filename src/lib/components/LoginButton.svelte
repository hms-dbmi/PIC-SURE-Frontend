<script lang="ts">
  import { createInstance } from '$lib/AuthProviderRegistry';
  import type { AuthData } from '$lib/models/AuthProvider';

  export let buttonText = 'Log In';
  export let redirectTo = '/';
  export let provider: AuthData;
  let testId = `login-button-${provider.name?.toLowerCase()}`;

  let login = async (redirectTo: string, providerType: string) => {
    let instance = await createInstance(provider);
    instance.login(redirectTo, providerType);
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
