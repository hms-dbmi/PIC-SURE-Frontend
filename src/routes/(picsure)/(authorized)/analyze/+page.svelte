<script lang="ts">
  import UserToken from '$lib/components/UserToken.svelte';
  import { branding } from '$lib/configuration';
</script>

<svelte:head>
  <title>{branding.applicationName} | API</title>
</svelte:head>
<div id="api-page">
  <section class="mt-10">
    <UserToken />
  </section>
  <section id="info-cards" class="w-full flex flex-wrap flex-row justify-between mt-6">
    {#each branding.apiPage.cards as card}
      <a
        href={card.link}
        target={card.link.startsWith('http') ? '_blank' : '_self'}
        class="pic-sure-info-card basis-2/4"
      >
        <div class="card card-hover">
          <header class="card-header flex flex-col items-center">
            <h4 class="my-1" data-testid={card.header}>{card.header}</h4>
            <hr class="!border-t-2" />
          </header>
          <section class="p-4 whitespace-pre-wrap" data-testid={card.body}>{card.body}</section>
        </div>
      </a>
    {/each}
  </section>
</div>

<style>
  #api-page section {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    width: 100%;
  }
  #api-page a.pic-sure-info-card {
    max-width: 25rem;
    min-height: 18rem;
    margin: 0 8px;
  }
</style>
