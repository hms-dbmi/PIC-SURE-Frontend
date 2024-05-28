<script lang="ts">
  export let buttonText = 'Log In';
  export let redirectTo = '/';
  export let loginFunction: (redirectTo: string) => Promise<void>;
  let clazz = 'btn variant-filled-primary m-1';
  export { clazz as class };
  let testId = `login-button-${buttonText}`;
</script>

<button type="button" data-testid={testId} class={clazz} on:click={() => loginFunction(redirectTo)}>
  {buttonText}
</button>
