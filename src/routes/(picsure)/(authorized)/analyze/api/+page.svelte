<script lang="ts">
  import { onMount } from 'svelte';
  import { Tabs } from '@skeletonlabs/skeleton-svelte';

  import { branding } from '$lib/stores/Configuration';
  import { sanitizeHTML } from '$lib/utilities/HTML';

  import Content from '$lib/components/Content.svelte';
  import UserToken from '$lib/components/UserToken.svelte';
  import CodeBlock from '$lib/components/CodeBlock.svelte';
  import TabItem from '$lib/components/TabItem.svelte';

  let tabSet: string = $state('Python');
  let connection: string = $state('');
  let execution: string = $state('');

  onMount(() => {
    connection = sanitizeHTML($branding.analysisPage.api.instructions.connection);
    execution = sanitizeHTML($branding.analysisPage.api.instructions.execution);
  });
</script>

<svelte:head>
  <title>{$branding.applicationName} | API</title>
</svelte:head>

<Content title="Prepare for Analysis with the PIC-SURE API">
  <section>
    <p class="mt-4">
      The PIC-SURE Application Programming Interface (API) can be used in an analysis environment of
      your choice. This API is available in both Python and R coding languages.
    </p>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <p>{@html connection}</p>
    <div class="flex justify-center"><UserToken /></div>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <p>{@html execution}</p>
    <Tabs value={tabSet} onValueChange={(e) => (tabSet = e.value)}>
      {#snippet list()}
        <TabItem bind:group={tabSet} value="Python">Python</TabItem>
        <TabItem bind:group={tabSet} value="R">R</TabItem>
      {/snippet}
      {#snippet content()}
        <Tabs.Panel value="Python">
          <CodeBlock
            lang="python"
            code={$branding.explorePage.codeBlocks.PythonAPI || 'Code not set'}
          />
        </Tabs.Panel>
        <Tabs.Panel value="R">
          <CodeBlock lang="r" code={$branding.explorePage.codeBlocks.RAPI || 'Code not set'} />
        </Tabs.Panel>
      {/snippet}
    </Tabs>
  </section>
  <section id="info-cards" class="w-full flex flex-wrap flex-row justify-center mt-6">
    {#each $branding.analysisPage.api.cards as card}
      <a
        href={card.link}
        target={card.link.startsWith('http') ? '_blank' : '_self'}
        class="p-4 basis-2/4 max-w-sm min-h-48 mb-8"
      >
        <div
          class="card card-hover border border-surface-200 bg-surface-100 hover:scale-105 hover:shadow-lg"
        >
          <header class="card-header flex flex-col items-center">
            <h4 class="my-1" data-testid={card.header}>{card.header}</h4>
            <hr />
          </header>
          <section class="p-4 whitespace-pre-wrap flex flex-col" data-testid={card.body}>
            <div>{card.body}</div>
            <div class="flex justify-center">
              <div class="btn preset-filled-primary-500 mt-3 w-fit">Learn More</div>
            </div>
          </section>
        </div>
      </a>
    {/each}
  </section>
</Content>
