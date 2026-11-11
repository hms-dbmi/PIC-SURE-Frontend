<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { resolve } from '$app/paths';
  import { config } from '#lib/config/config.svelte.ts';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import { buttonClass } from '#lib/ui/button.ts';
</script>

<section
  class="w-full h-full flex flex-col justify-center items-center"
  out:fly={{ duration: 300, easing: quintOut, x: '-100%', opacity: 40 }}
>
  <h3 class="m-0">Something went wrong with your login attempt.</h3>
  <h3 class="m-0">Please try again!</h3>
  <p class="m-1">If the problem persists contact an administrator.</p>

  <div class="flex flex-col justify-between mt-5">
    <Button class="m-1" href={resolve('login')}
      >Back to Login <i class="fa-solid fa-arrow-right ml-3"></i></Button
    >
    <!-- A plain link, because Button renders a button when the configured link is empty. -->
    <a
      class="{buttonClass('tonal-static')} m-1"
      target="_blank"
      href={config.branding.login.contactLink}
      rel="external">Contact Administrator</a
    >
  </div>
</section>
