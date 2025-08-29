<script lang="ts">
  import { branding } from '$lib/stores/Configuration';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
</script>

<section
  class="w-full h-full flex flex-col justify-center items-center"
  out:fly={{ duration: 300, easing: quintOut, x: '-100%', opacity: 40 }}
>
  <h3 class="m-0">Something went wrong with your login attempt.</h3>
  <h3 class="m-0">Please try again!</h3>
  <p class="m-1">If the problem persists contact an administrator.</p>

  <div class="flex flex-col justify-between mt-5">
    <a class="btn preset-filled-primary-500 m-1" href="/login"
      >Back to Login <i class="fa-solid fa-arrow-right ml-3"></i></a
    >
    <a
      class="btn preset-tonal-primary border border-primary-500 m-1"
      target="_blank"
      href={$branding.login.contactLink}>Contact Administrator</a
    >
  </div>
</section>
